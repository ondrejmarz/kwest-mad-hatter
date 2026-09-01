import { type Firestore, increment, runTransaction } from 'firebase/firestore';

import type { DomainError } from '../../domain/errors';
import type { PlayerId } from '../../domain/ids';
import { confirmPairInvite } from '../../domain/reservation';
import { invariant } from '../../lib/invariant';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { reservationCountsDoc, reservationDoc } from '../paths';
import { parseReservation } from '../schemas/reservation';

/**
 * The invited partner accepts or declines a pair invite (spec 7). Accepting confirms the
 * initiator's reservation and cancels the partner's own reservation for that day if any;
 * declining deletes the invite. Interest counts move accordingly. Secret, so no public event.
 */
export async function respondToPairInvite(
  db: Firestore,
  t: string,
  initiatorPlayerId: string,
  myPlayerId: PlayerId,
  accept: boolean,
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });
  return runTransaction<Result<void, DomainError>>(db, async (tx) => {
    const invSnap = await tx.get(reservationDoc(db, t, initiatorPlayerId));
    const invitation = invSnap.exists() ? parseReservation(invSnap.id, invSnap.data() ?? {}) : null;
    invariant(
      invitation !== null && invitation.invitePartnerId === myPlayerId,
      'a pending pair invite for this player exists',
    );

    const mine = await tx.get(reservationDoc(db, t, myPlayerId));
    const countsRef = reservationCountsDoc(db, t, invitation.day);

    if (!accept) {
      tx.delete(reservationDoc(db, t, initiatorPlayerId));
      tx.set(countsRef, { counts: { [invitation.taskId]: increment(-1) } }, { merge: true });
      return ok(undefined);
    }

    const confirmed = confirmPairInvite(invitation, myPlayerId);
    tx.update(reservationDoc(db, t, initiatorPlayerId), {
      confirmed: confirmed.confirmed,
      partnerId: confirmed.partnerId,
      invitePartnerId: confirmed.invitePartnerId,
    });

    if (mine.exists()) {
      const mineRes = parseReservation(mine.id, mine.data() ?? {});
      tx.delete(reservationDoc(db, t, myPlayerId));
      if (mineRes !== null) {
        tx.set(countsRef, { counts: { [mineRes.taskId]: increment(-1) } }, { merge: true });
      }
    }
    return ok(undefined);
  });
}
