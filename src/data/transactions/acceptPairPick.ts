import { type Firestore, runTransaction } from 'firebase/firestore';

import { buildActiveTask, pairPartnerOf, partnerToRelease } from '../../domain/activeTask';
import { canJoinPairPick } from '../../domain/eligibility';
import type { DomainError } from '../../domain/errors';
import type { PlayerId, TaskId } from '../../domain/ids';
import { invariant } from '../../lib/invariant';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { playerDoc, taskClaimDoc, taskDoc } from '../paths';
import { parseTask } from '../schemas/catalog';
import { parseTaskClaim } from '../schemas/taskClaim';

import { readPlayer, readPlayerOrNull, readTurnus } from './shared';

/**
 * The invited partner accepts a same-round pair pick (spec 7): one commit marks the claim accepted
 * and hands the task to BOTH members, each with the other as their partner. The partner is the only
 * writer, so the rules let them set the initiator's `activeTask` too, validated against this claim.
 * With task switching turned off, neither member may already hold a task (`canJoinPairPick`).
 *
 * Either member may be leaving a task they held this round. Its claim marker is released so the task
 * is free for others again, and a pair is done together or not at all, so an old pair partner loses
 * that task too (`partnerToRelease`).
 */
export async function acceptPairPick(
  db: Firestore,
  t: string,
  taskId: string,
  myPlayerId: PlayerId,
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });
  return runTransaction<Result<void, DomainError>>(db, async (tx) => {
    const turnus = await readTurnus(tx, db, t);
    const claimRef = taskClaimDoc(db, t, turnus.currentDay, taskId);
    const claimSnap = await tx.get(claimRef);
    const claim = claimSnap.exists() ? parseTaskClaim(claimSnap.id, claimSnap.data() ?? {}) : null;
    if (claim === null || claim.invitee !== myPlayerId || claim.accepted) {
      return err({ code: 'TASK_TAKEN_TODAY', byPlayerName: '' });
    }

    const taskSnap = await tx.get(taskDoc(db, t, taskId));
    const task = parseTask(taskSnap.id, taskSnap.data() ?? {});
    if (task === null) return err({ code: 'TASK_INACTIVE' });
    const initiator = await readPlayer(tx, db, t, claim.playerId);
    const me = await readPlayer(tx, db, t, myPlayerId);
    invariant(claim.invitee !== null, 'a pair claim always names its invitee');

    const allowed = canJoinPairPick([initiator, me], turnus);
    if (!allowed.ok) return allowed;

    // Every read precedes the writes: the claims of the tasks the members leave, and their old pair
    // partners, who lose those tasks too.
    const members = [initiator.id, me.id];
    const leftTaskIds = new Set<TaskId>();
    const released = new Set<PlayerId>();
    for (const member of [initiator, me]) {
      const previous = member.activeTask;
      if (previous === null || previous.taskId === task.id) continue;
      leftTaskIds.add(previous.taskId);
      const partner = await readPlayerOrNull(tx, db, t, pairPartnerOf(previous));
      const leftBehind = partnerToRelease(previous, task.id, members, partner);
      if (leftBehind !== null) released.add(leftBehind);
    }
    const leftClaims: ReturnType<typeof taskClaimDoc>[] = [];
    for (const leftTaskId of leftTaskIds) {
      const ref = taskClaimDoc(db, t, turnus.currentDay, leftTaskId);
      if ((await tx.get(ref)).exists()) leftClaims.push(ref);
    }

    tx.update(claimRef, { accepted: true });
    tx.update(playerDoc(db, t, claim.playerId), {
      activeTask: buildActiveTask(task, [{ id: me.id, name: me.name }]),
      needsPick: false,
    });
    tx.update(playerDoc(db, t, myPlayerId), {
      activeTask: buildActiveTask(task, [{ id: initiator.id, name: initiator.name }]),
      needsPick: false,
    });
    for (const id of released) {
      tx.update(playerDoc(db, t, id), { activeTask: null, needsPick: true });
    }
    for (const ref of leftClaims) tx.delete(ref);
    return ok(undefined);
  });
}
