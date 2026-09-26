import { type Firestore, runTransaction } from 'firebase/firestore';

import type { DomainError } from '../../domain/errors';
import type { PlayerId } from '../../domain/ids';
import { canCancelReservation } from '../../domain/reservation';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { reservationDoc } from '../paths';
import { parseReservation } from '../schemas/reservation';

import { dropReservation, readTurnus } from './shared';

/**
 * Call off a reservation for the next round (spec 7) — the player's own, or a pair they accepted.
 * A pair is done together or not at all, so either member cancelling cancels it for both: the
 * reservation lives under its initiator, and deleting it also frees any invite still pending on it.
 * Secret, so no public event; only the public interest count and "has a reservation" flags move.
 */
export async function cancelReservation(
  db: Firestore,
  t: string,
  ownerId: string,
  myPlayerId: PlayerId,
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });
  return runTransaction<Result<void, DomainError>>(db, async (tx) => {
    const turnus = await readTurnus(tx, db, t);
    const snap = await tx.get(reservationDoc(db, t, ownerId));
    if (!snap.exists()) return ok(undefined);
    const reservation = parseReservation(snap.id, snap.data() ?? {});
    if (reservation === null) return ok(undefined);

    const allowed = canCancelReservation(reservation, myPlayerId, turnus);
    if (!allowed.ok) return allowed;
    dropReservation(tx, db, t, reservation);
    return ok(undefined);
  });
}
