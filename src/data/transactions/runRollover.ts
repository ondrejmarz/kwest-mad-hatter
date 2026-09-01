import { doc, type Firestore, runTransaction, serverTimestamp } from 'firebase/firestore';

import type { DomainError } from '../../domain/errors';
import { resolveRollover } from '../../domain/rollover';
import type { RolloverInput } from '../../domain/rollover/types';
import { invariant } from '../../lib/invariant';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import {
  eventsCol,
  playerDoc,
  purchaseDoc,
  reservationCountsDoc,
  reservationDoc,
  rewardBidCountsDoc,
  rewardBidDoc,
  rollbackDoc,
  taskDoc,
  turnusDoc,
} from '../paths';

import { domainEvent, type EventMeta } from './shared';

/**
 * Day evaluation (spec 6) — the thin shell over `resolveRollover`, with no game rule of its
 * own. The pure function already ran for the admin's preview; here it runs once more inside
 * one transaction that writes its entire output atomically. `input` (players, tasks,
 * reservations, turnus) comes from the live listeners; the transaction re-reads only the
 * turnus to guard against a concurrent evaluation. The web SDK cannot query in a transaction,
 * which is why the collections are read outside and passed in.
 */
export async function runRollover(
  db: Firestore,
  t: string,
  input: RolloverInput,
  meta: EventMeta,
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });
  return runTransaction<Result<void, DomainError>>(db, async (tx) => {
    const turnusSnap = await tx.get(turnusDoc(db, t));
    invariant(
      turnusSnap.data()?.currentDay === input.turnus.currentDay,
      'no concurrent day evaluation happened',
    );

    const result = resolveRollover(input);

    for (const update of result.playerUpdates) {
      tx.update(playerDoc(db, t, update.playerId), {
        coins: update.coins,
        activeTask: update.activeTask,
        needsPick: update.needsPick,
      });
    }
    for (const update of result.taskUpdates) {
      tx.update(taskDoc(db, t, update.taskId), { usedByPlayerIds: update.usedByPlayerIds });
    }
    tx.update(turnusDoc(db, t), {
      currentDay: result.turnus.currentDay,
      currentDayCategories: result.turnus.currentDayCategories,
      nextDayCategories: result.turnus.nextDayCategories,
      dayLocked: result.turnus.dayLocked,
    });
    tx.set(rollbackDoc(db, t), { snapshot: result.rollbackSnapshot, savedAt: serverTimestamp() });
    for (const reservation of input.reservations) {
      tx.delete(reservationDoc(db, t, reservation.playerId));
    }
    tx.set(reservationCountsDoc(db, t, result.nextDay), { counts: {} });
    // Consume the sealed bids: winners already paid via the coin updates above (spec 8).
    for (const bid of input.rewardBids) {
      tx.delete(rewardBidDoc(db, t, bid.playerId));
    }
    tx.set(rewardBidCountsDoc(db, t, input.turnus.currentDay), { counts: {} });
    // Owned rewards: the winners' purchase docs (id is the doc key; `createdAt` is server-stamped).
    for (const purchase of result.purchases) {
      const { id, ...data } = purchase;
      tx.set(purchaseDoc(db, t, id), { ...data, createdAt: serverTimestamp() });
    }
    for (const event of result.events) {
      tx.set(doc(eventsCol(db, t)), domainEvent(event, meta));
    }
    return ok(undefined);
  });
}
