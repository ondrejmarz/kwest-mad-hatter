import { type Firestore, increment, runTransaction } from 'firebase/firestore';

import { hasUsedTask } from '../../domain/eligibility';
import type { DomainError } from '../../domain/errors';
import type { PlayerId } from '../../domain/ids';
import { withResponse } from '../../domain/reservation';
import { invariant } from '../../lib/invariant';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { reservationCountsDoc, reservationDoc, taskDoc } from '../paths';
import { parseTask } from '../schemas/catalog';
import { parseReservation } from '../schemas/reservation';

import { readPlayer, readTurnus } from './shared';

/**
 * An invited player accepts or declines a group invite (spec 7), toggleable until evaluation. It
 * only sets that player's own key in the initiator's `responses` map (the rules allow exactly that).
 * Accepting also cancels the player's own reservation for the day, if any, and drops its interest
 * count. Declining leaves the group reservation in place — it just may fall short at evaluation.
 * Secret, so no public event.
 */
export async function respondToInvite(
  db: Firestore,
  t: string,
  initiatorPlayerId: string,
  myPlayerId: PlayerId,
  accept: boolean,
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });
  return runTransaction<Result<void, DomainError>>(db, async (tx) => {
    const turnus = await readTurnus(tx, db, t);
    if (turnus.dayLocked) return err({ code: 'DAY_LOCKED' });
    const invSnap = await tx.get(reservationDoc(db, t, initiatorPlayerId));
    const invitation = invSnap.exists() ? parseReservation(invSnap.id, invSnap.data() ?? {}) : null;
    invariant(
      invitation !== null && invitation.invitees.includes(myPlayerId),
      'this player was invited to the reservation',
    );
    const mineSnap = await tx.get(reservationDoc(db, t, myPlayerId));

    // An invitee who has meanwhile taken or completed this very task can't accept — a task is done
    // at most once per player, so joining the group would do it twice (spec 7). Declining stays open.
    if (accept) {
      const me = await readPlayer(tx, db, t, myPlayerId);
      const taskSnap = await tx.get(taskDoc(db, t, invitation.taskId));
      const task = parseTask(taskSnap.id, taskSnap.data() ?? {});
      if (task !== null && hasUsedTask(me, task)) {
        return err({ code: 'TASK_ALREADY_USED_BY_PLAYER' });
      }
    }

    const next = withResponse(invitation, myPlayerId, accept);
    tx.update(reservationDoc(db, t, initiatorPlayerId), { responses: next.responses });

    if (accept && mineSnap.exists()) {
      const mineRes = parseReservation(mineSnap.id, mineSnap.data() ?? {});
      tx.delete(reservationDoc(db, t, myPlayerId));
      if (mineRes !== null) {
        tx.set(
          reservationCountsDoc(db, t, invitation.day),
          { counts: { [mineRes.taskId]: increment(-1) } },
          { merge: true },
        );
      }
    }
    // Accepting commits this player to the group for the day; declining releases them. Public
    // existence flag only — which task the group holds stays secret.
    tx.set(
      reservationCountsDoc(db, t, invitation.day),
      { players: { [myPlayerId]: accept } },
      { merge: true },
    );
    return ok(undefined);
  });
}
