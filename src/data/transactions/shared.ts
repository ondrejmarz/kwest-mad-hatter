import { type Firestore, increment, type Transaction } from 'firebase/firestore';

import { reservationMembers } from '../../domain/reservation';
import type { Player, Reservation } from '../../domain/types';
import { invariant } from '../../lib/invariant';
import { playerDoc, reservationCountsDoc, reservationDoc, turnusDoc } from '../paths';
import { parsePlayer } from '../schemas/player';
import { parseTurnus, type Turnus } from '../schemas/turnus';

/** Typed turnus read inside a transaction — a corrupt turnus is programmer error, so it throws. */
export async function readTurnus(tx: Transaction, db: Firestore, t: string): Promise<Turnus> {
  const snap = await tx.get(turnusDoc(db, t));
  const turnus = parseTurnus(snap.id, snap.data() ?? {});
  invariant(turnus !== null, 'turnus document is valid');
  return turnus;
}

/** Typed player read inside a transaction. */
export async function readPlayer(
  tx: Transaction,
  db: Firestore,
  t: string,
  playerId: string,
): Promise<Player> {
  const snap = await tx.get(playerDoc(db, t, playerId));
  const player = parsePlayer(snap.id, snap.data() ?? {});
  invariant(player !== null, 'player document is valid');
  return player;
}

/** A player read inside a transaction that tolerates a missing or unreadable doc (`null`). */
export async function readPlayerOrNull(
  tx: Transaction,
  db: Firestore,
  t: string,
  playerId: string | null,
): Promise<Player | null> {
  if (playerId === null) return null;
  const snap = await tx.get(playerDoc(db, t, playerId));
  return snap.exists() ? parsePlayer(snap.id, snap.data() ?? {}) : null;
}

/**
 * Deletes a reservation inside a transaction and moves the public aggregates with it (spec 7): its
 * task loses one unit of interest (a pair counts once), and every confirmed member — the initiator
 * and an accepted partner — stops showing as holding a reservation. A pair is done together or not
 * at all, so this is how it is cancelled for both. Writes only: call it after every read.
 */
export function dropReservation(
  tx: Transaction,
  db: Firestore,
  t: string,
  reservation: Reservation,
): void {
  tx.delete(reservationDoc(db, t, reservation.playerId));
  const players = Object.fromEntries(reservationMembers(reservation).map((id) => [id, false]));
  tx.set(
    reservationCountsDoc(db, t, reservation.day),
    { counts: { [reservation.taskId]: increment(-1) }, players },
    { merge: true },
  );
}
