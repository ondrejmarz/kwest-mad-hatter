import { type Firestore, runTransaction, serverTimestamp } from 'firebase/firestore';

import { pairPartnerOf, partnerToRelease } from '../../domain/activeTask';
import type { DomainError } from '../../domain/errors';
import { TaskId } from '../../domain/ids';
import { pickTaskNow as decidePick } from '../../domain/pickTask';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { playerDoc, taskClaimDoc, taskDoc } from '../paths';
import { parseTask } from '../schemas/catalog';
import { holdsTask, parseTaskClaim } from '../schemas/taskClaim';

import { readPlayer, readPlayerOrNull, readTurnus } from './shared';

/**
 * Take a task for the CURRENT round, first-come (spec 7) — whether the player had no task or is
 * switching from one (a free task can be changed any time the round is open). Exclusivity is a
 * create-only claim marker keyed by `(day, task)`: the transaction reads it, and if it is already
 * claimed the pure domain rejects the pick; otherwise it creates the marker and writes the player's
 * `activeTask` in the same commit. Two players racing the same task contend on that one marker doc,
 * so exactly one wins. Switching releases the player's previous claim in the same commit, freeing
 * that task again — and a pair is done together or not at all, so switching away from a pair task
 * takes it from the partner too (`partnerToRelease`).
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
    // A declined pair invite no longer holds the task; anything else on the marker still does.
    const claim = claimSnap.exists() ? parseTaskClaim(claimSnap.id, claimSnap.data()) : null;
    const takenBy = new Map<TaskId, string>();
    if (claimSnap.exists() && (claim === null || holdsTask(claim))) {
      takenBy.set(TaskId(taskId), claim?.playerId ?? '');
    }

    // Switching away from a task this player picked earlier this round: read its claim so we can
    // release it, keeping one claim per player and freeing the old task for others.
    const previous = player.activeTask;
    const oldClaimRef =
      previous !== null && previous.taskId !== taskId
        ? taskClaimDoc(db, t, turnus.currentDay, previous.taskId)
        : null;
    const oldClaimSnap = oldClaimRef ? await tx.get(oldClaimRef) : null;
    const partner = await readPlayerOrNull(tx, db, t, pairPartnerOf(previous));

    const picked = decidePick(player, task, turnus, takenBy);
    if (!picked.ok) return err(picked.error);
    const released = partnerToRelease(previous, TaskId(taskId), [player.id], partner);

    if (oldClaimRef && oldClaimSnap?.exists()) tx.delete(oldClaimRef);
    tx.set(claimRef, {
      day: turnus.currentDay,
      taskId,
      playerId,
      createdAt: serverTimestamp(),
    });
    tx.update(playerDoc(db, t, playerId), { activeTask: picked.value, needsPick: false });
    if (released !== null) {
      tx.update(playerDoc(db, t, released), { activeTask: null, needsPick: true });
    }
    return ok(undefined);
  });
}
