import { type Firestore, increment, runTransaction } from 'firebase/firestore';

import type { DomainError } from '../../domain/errors';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { reservationCountsDoc, reservationDoc } from '../paths';
import { parseReservation } from '../schemas/reservation';

/**
 * A player drops their own reservation for tomorrow (spec 7). Deleting the doc also frees any
 * pending pair invite riding on it. The public interest count for the task drops by one; a pair
 * still counted as a single unit, so the decrement is one either way. Secret, so no public event.
 */
export async function cancelReservation(
  db: Firestore,
  t: string,
  playerId: string,
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });
  return runTransaction<Result<void, DomainError>>(db, async (tx) => {
    const snap = await tx.get(reservationDoc(db, t, playerId));
    if (!snap.exists()) return ok(undefined);
    const reservation = parseReservation(snap.id, snap.data() ?? {});

    tx.delete(reservationDoc(db, t, playerId));
    if (reservation !== null) {
      tx.set(
        reservationCountsDoc(db, t, reservation.day),
        { counts: { [reservation.taskId]: increment(-1) }, players: { [playerId]: false } },
        { merge: true },
      );
    }
    return ok(undefined);
  });
}
