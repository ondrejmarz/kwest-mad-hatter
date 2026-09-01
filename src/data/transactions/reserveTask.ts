import { type Firestore, increment, runTransaction, serverTimestamp } from 'firebase/firestore';

import { canReserveTask } from '../../domain/eligibility';
import type { DomainError } from '../../domain/errors';
import { Day, type PlayerId } from '../../domain/ids';
import { createReservation } from '../../domain/reservation';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { reservationCountsDoc, reservationDoc, taskDoc } from '../paths';
import { parseTask } from '../schemas/catalog';

import { readPlayer, readTurnus } from './shared';

/**
 * Reserve a task for tomorrow (spec 7). Eligibility is decided by the pure domain; the
 * transaction only reads state, builds the reservation and adjusts the public interest
 * counts (a group counts as one). `inviteeIds` are the others invited (empty for a solo task).
 * Reservations are secret, so nothing is written to the public events log during the day
 * (decision A3). Changing a reservation moves the count.
 */
export async function reserveTask(
  db: Firestore,
  t: string,
  playerId: string,
  taskId: string,
  inviteeIds: readonly PlayerId[] = [],
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

    const previous = await tx.get(reservationDoc(db, t, playerId));
    const previousTaskId = previous.exists() ? (previous.data().taskId as string) : null;

    const { createdAt: _placeholder, ...fields } = built.value;
    tx.set(reservationDoc(db, t, playerId), { ...fields, createdAt: serverTimestamp() });

    const countsRef = reservationCountsDoc(db, t, day);
    if (previousTaskId === taskId) {
      // Same task — count unchanged.
    } else if (previousTaskId === null) {
      tx.set(countsRef, { counts: { [taskId]: increment(1) } }, { merge: true });
    } else {
      tx.set(
        countsRef,
        { counts: { [previousTaskId]: increment(-1), [taskId]: increment(1) } },
        { merge: true },
      );
    }
    // The initiator now holds a reservation for the day (public existence flag, no task revealed).
    tx.set(countsRef, { players: { [playerId]: true } }, { merge: true });
    return ok(undefined);
  });
}
