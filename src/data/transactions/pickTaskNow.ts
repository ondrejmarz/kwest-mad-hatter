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
 * Take a task for TODAY, first-come (spec 7) — whether the player had no task or is switching from
 * one (a free task can be changed any time the day is open). Exclusivity is a create-only claim
 * marker keyed by `(day, task)`: the transaction reads it, and if it is already claimed the pure
 * domain rejects the pick; otherwise it creates the marker and writes the player's `activeTask` in
 * the same commit. Two players racing the same task contend on that one marker doc, so exactly one
 * wins. Switching releases the player's previous claim in the same commit, freeing that task again.
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

    // Switching away from a task this player picked earlier today: read its claim so we can release
    // it, keeping one claim per player and freeing the old task for others.
    const previous = player.activeTask;
    const oldClaimRef =
      previous !== null && previous.taskId !== taskId
        ? taskClaimDoc(db, t, turnus.currentDay, previous.taskId)
        : null;
    const oldClaimSnap = oldClaimRef ? await tx.get(oldClaimRef) : null;

    const picked = decidePick(player, task, turnus, takenBy);
    if (!picked.ok) return err(picked.error);

    if (oldClaimRef && oldClaimSnap?.exists()) tx.delete(oldClaimRef);
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
