import { type Firestore, runTransaction, serverTimestamp } from 'firebase/firestore';

import type { DomainError } from '../../domain/errors';
import { TaskId } from '../../domain/ids';
import { pickTaskNow as decidePick } from '../../domain/pickTask';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { playerDoc, taskClaimDoc, taskDoc } from '../paths';
import { parseTask } from '../schemas/catalog';

import { readPlayer, readTurnus } from './shared';

/**
 * Take a task for TODAY, first-come (spec 7) — for a player whose reservation did not come through.
 * Exclusivity is a create-only claim marker keyed by `(day, task)`: the transaction reads it, and if
 * it is already claimed the pure domain rejects the pick; otherwise it creates the marker and writes
 * the player's `activeTask` in the same commit. Two players racing the same task contend on that one
 * marker doc, so exactly one wins and the other is told it is taken.
 */
export async function pickTaskNow(
  db: Firestore,
  t: string,
  playerId: string,
  taskId: string,
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });
  return runTransaction<Result<void, DomainError>>(db, async (tx) => {
    const turnus = await readTurnus(tx, db, t);
    const player = await readPlayer(tx, db, t, playerId);
    const taskSnap = await tx.get(taskDoc(db, t, taskId));
    const task = parseTask(taskSnap.id, taskSnap.data() ?? {});
    if (task === null) return err({ code: 'TASK_INACTIVE' });

    const claimRef = taskClaimDoc(db, t, turnus.currentDay, taskId);
    const claimSnap = await tx.get(claimRef);
    const takenBy = new Map<TaskId, string>();
    if (claimSnap.exists()) {
      takenBy.set(TaskId(taskId), (claimSnap.data().playerId as string) ?? '');
    }

    const picked = decidePick(player, task, turnus, takenBy);
    if (!picked.ok) return err(picked.error);

    tx.set(claimRef, {
      day: turnus.currentDay,
      taskId,
      playerId,
      createdAt: serverTimestamp(),
    });
    tx.update(playerDoc(db, t, playerId), { activeTask: picked.value, needsPick: false });
    return ok(undefined);
  });
}
