import { type Firestore, runTransaction } from 'firebase/firestore';

import { buildActiveTask } from '../../domain/activeTask';
import type { DomainError } from '../../domain/errors';
import type { PlayerId } from '../../domain/ids';
import { invariant } from '../../lib/invariant';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { playerDoc, taskClaimDoc, taskDoc } from '../paths';
import { parseTask } from '../schemas/catalog';
import { parseTaskClaim } from '../schemas/taskClaim';

import { readPlayer, readTurnus } from './shared';

/**
 * The invited partner accepts a same-day pair pick (spec 7): one commit marks the claim accepted and
 * hands the task to BOTH members, each with the other as their partner. The partner is the only
 * writer, so the rules let them set the initiator's `activeTask` too, validated against this claim.
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

    tx.update(claimRef, { accepted: true });
    tx.update(playerDoc(db, t, claim.playerId), {
      activeTask: buildActiveTask(task, [me.name]),
      needsPick: false,
    });
    tx.update(playerDoc(db, t, myPlayerId), {
      activeTask: buildActiveTask(task, [initiator.name]),
      needsPick: false,
    });
    return ok(undefined);
  });
}
