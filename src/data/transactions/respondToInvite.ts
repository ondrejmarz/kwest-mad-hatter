import { type Firestore, runTransaction } from 'firebase/firestore';

import { hasUsedTask } from '../../domain/eligibility';
import type { DomainError } from '../../domain/errors';
import type { PlayerId } from '../../domain/ids';
import { hasAccepted, withResponse } from '../../domain/reservation';
import type { Reservation } from '../../domain/types';
import { invariant } from '../../lib/invariant';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { reservationCountsDoc, reservationDoc, taskDoc } from '../paths';
import { parseTask } from '../schemas/catalog';
import { parseReservation } from '../schemas/reservation';

import { dropReservation, readPlayer, readTurnus } from './shared';

/**
 * An invited player accepts or declines a pair invite (spec 7). It only sets that player's own key in
 * the initiator's `responses` map (the rules allow exactly that). Declining leaves the reservation in
 * place — the initiator sees the refusal and it simply falls short at evaluation.
 *
 * Accepting commits the player to this one pair, so it also LEAVES every other reservation they
 * belong to. A pair is done together or not at all, so each is cancelled for both of its members: the
 * player's own reservation is dropped (taking it from a partner who had accepted it), and so is every
 * other pair they had accepted (`leaveInviterIds`, from the caller's live invites) — otherwise they
 * would be double-booked and the abandoned pair would still hold them. Secret, so no public event.
 */
export async function respondToInvite(
  db: Firestore,
  t: string,
  initiatorPlayerId: string,
  myPlayerId: PlayerId,
  accept: boolean,
  leaveInviterIds: readonly PlayerId[] = [],
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

    // Every read precedes the writes. Only the accept path leaves the player's other reservations:
    // their own, and each other pair they accepted (a distinct id list, never the one answered here).
    const leaving: Reservation[] = [];
    if (accept) {
      const me = await readPlayer(tx, db, t, myPlayerId);
      const taskSnap = await tx.get(taskDoc(db, t, invitation.taskId));
      const task = parseTask(taskSnap.id, taskSnap.data() ?? {});
      // An invitee who has meanwhile taken or completed this very task can't accept — a task is done
      // at most once per player, so joining the pair would do it twice (spec 7). Declining stays open.
      if (task !== null && hasUsedTask(me, task)) {
        return err({ code: 'TASK_ALREADY_USED_BY_PLAYER' });
      }

      const mineSnap = await tx.get(reservationDoc(db, t, myPlayerId));
      const mine = mineSnap.exists() ? parseReservation(mineSnap.id, mineSnap.data() ?? {}) : null;
      if (mine !== null) leaving.push(mine);
      for (const id of new Set(leaveInviterIds)) {
        if (id === initiatorPlayerId || id === myPlayerId) continue;
        const snap = await tx.get(reservationDoc(db, t, id));
        const other = snap.exists() ? parseReservation(snap.id, snap.data() ?? {}) : null;
        if (other !== null && hasAccepted(other, myPlayerId)) leaving.push(other);
      }
    }

    const next = withResponse(invitation, myPlayerId, accept);
    tx.update(reservationDoc(db, t, initiatorPlayerId), { responses: next.responses });
    for (const reservation of leaving) dropReservation(tx, db, t, reservation);

    // Accepting commits this player to the pair for the round; declining releases them. Public
    // existence flag only — which task the pair holds stays secret. Set last, so dropping the
    // reservations left above never flips it back off.
    tx.set(
      reservationCountsDoc(db, t, invitation.day),
      { players: { [myPlayerId]: accept } },
      { merge: true },
    );
    return ok(undefined);
  });
}
