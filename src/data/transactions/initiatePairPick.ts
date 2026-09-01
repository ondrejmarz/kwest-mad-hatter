import { type Firestore, runTransaction, serverTimestamp } from 'firebase/firestore';

import { canInitiatePairPick } from '../../domain/eligibility';
import type { DomainError } from '../../domain/errors';
import { TaskId, type PlayerId } from '../../domain/ids';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { taskClaimDoc, taskDoc } from '../paths';
import { parseTask } from '../schemas/catalog';

import { readPlayer, readTurnus } from './shared';

/**
 * Start a same-day pair pick (spec 7): the initiator claims a pair task for today and names a
 * partner. The create-only claim locks the task first-come, but nobody gets it yet — the partner
 * still has to accept (`acceptPairPick`). Solo picks use `pickTaskNow`; groups are reservation-only.
 */
export async function initiatePairPick(
  db: Firestore,
  t: string,
  initiatorId: string,
  taskId: string,
  partnerId: PlayerId,
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });
  return runTransaction<Result<void, DomainError>>(db, async (tx) => {
    const turnus = await readTurnus(tx, db, t);
    const initiator = await readPlayer(tx, db, t, initiatorId);
    if (partnerId === initiator.id) return err({ code: 'PARTNER_IS_SELF' });
    const taskSnap = await tx.get(taskDoc(db, t, taskId));
    const task = parseTask(taskSnap.id, taskSnap.data() ?? {});
    if (task === null) return err({ code: 'TASK_INACTIVE' });

    const claimRef = taskClaimDoc(db, t, turnus.currentDay, taskId);
    const claimSnap = await tx.get(claimRef);
    const takenBy = new Map<TaskId, string>();
    if (claimSnap.exists()) {
      takenBy.set(TaskId(taskId), (claimSnap.data().playerId as string) ?? '');
    }

    const eligible = canInitiatePairPick(initiator, task, turnus, takenBy);
    if (!eligible.ok) return err(eligible.error);

    tx.set(claimRef, {
      day: turnus.currentDay,
      taskId,
      playerId: initiatorId,
      invitee: partnerId,
      accepted: false,
      createdAt: serverTimestamp(),
    });
    return ok(undefined);
  });
}
