import {
  type FieldValue,
  type Firestore,
  increment,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

import { canReserveTask } from '../../domain/eligibility';
import type { DomainError } from '../../domain/errors';
import { Day, type PlayerId } from '../../domain/ids';
import { createReservation, hasAccepted, reservationMembers } from '../../domain/reservation';
import type { Reservation } from '../../domain/types';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { reservationCountsDoc, reservationDoc, taskDoc } from '../paths';
import { parseTask } from '../schemas/catalog';
import { parseReservation } from '../schemas/reservation';

import { dropReservation, readPlayer, readTurnus } from './shared';

/**
 * Reserve a task for the next round (spec 7). Eligibility is decided by the pure domain; the
 * transaction only reads state, builds the reservation and adjusts the public interest counts (a
 * pair counts as one). `inviteeIds` are the others invited (empty for a solo task). Reservations are
 * secret: only the interest count is public, and who won a contested task is revealed at evaluation
 * (decision A3).
 *
 * A player holds one reservation at a time, and a pair is done together or not at all. So replacing
 * the player's own pair takes it away from the partner who had accepted, and reserving while
 * committed to someone else's pair (`leaveInviterIds`, from the caller's live invites) cancels that
 * pair for both of its members.
 */
export async function reserveTask(
  db: Firestore,
  t: string,
  playerId: string,
  taskId: string,
  inviteeIds: readonly PlayerId[] = [],
  leaveInviterIds: readonly PlayerId[] = [],
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });
  return runTransaction<Result<void, DomainError>>(db, async (tx) => {
    const turnus = await readTurnus(tx, db, t);
    const player = await readPlayer(tx, db, t, playerId);
    const taskSnap = await tx.get(taskDoc(db, t, taskId));
    const task = parseTask(taskSnap.id, taskSnap.data() ?? {});
    if (task === null) return err({ code: 'TASK_INACTIVE' });

    const eligible = canReserveTask(player, task, turnus);
    if (!eligible.ok) return eligible;

    const day = Day(turnus.currentDay + 1);
    const built = createReservation({ player, task, day, inviteeIds, createdAt: 0 });
    if (!built.ok) return err(built.error);

    const previousSnap = await tx.get(reservationDoc(db, t, playerId));
    const previous = previousSnap.exists()
      ? parseReservation(previousSnap.id, previousSnap.data() ?? {})
      : null;
    // Every read precedes the writes: the other pairs this player accepted, which reserving leaves.
    const leaving: Reservation[] = [];
    for (const id of new Set(leaveInviterIds)) {
      if (id === playerId) continue;
      const snap = await tx.get(reservationDoc(db, t, id));
      const other = snap.exists() ? parseReservation(snap.id, snap.data() ?? {}) : null;
      if (other !== null && hasAccepted(other, player.id)) leaving.push(other);
    }

    for (const other of leaving) dropReservation(tx, db, t, other);

    const { createdAt: _placeholder, ...fields } = built.value;
    tx.set(reservationDoc(db, t, playerId), { ...fields, createdAt: serverTimestamp() });

    // Move the interest from the previous task (if it changed), and take the "has a reservation"
    // flag from a partner who had accepted the previous pair — the new reservation starts afresh.
    const counts: Record<string, FieldValue> = {};
    const players: Record<string, boolean> = {};
    if (previous?.taskId !== taskId) {
      if (previous !== null) counts[previous.taskId] = increment(-1);
      counts[taskId] = increment(1);
    }
    if (previous !== null) {
      for (const member of reservationMembers(previous)) players[member] = false;
    }
    players[playerId] = true;
    tx.set(reservationCountsDoc(db, t, day), { counts, players }, { merge: true });
    return ok(undefined);
  });
}
