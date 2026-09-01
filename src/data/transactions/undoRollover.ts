import { type Firestore, runTransaction, Timestamp } from 'firebase/firestore';

import type { DomainError } from '../../domain/errors';
import type { RollbackSnapshot } from '../../domain/rollover/types';
import { invariant } from '../../lib/invariant';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import {
  playerDoc,
  purchaseDoc,
  reservationDoc,
  rewardBidDoc,
  rollbackDoc,
  taskDoc,
  turnusDoc,
} from '../paths';

/**
 * The admin safety brake (spec 6, decision A4): restore the complete pre-evaluation state
 * from the one-shot snapshot — coins, activeTask, needsPick, tasks' usedByPlayerIds, the
 * deleted reservations, and the turnus day/categories/lock — then consume the snapshot.
 */
export async function undoRollover(db: Firestore, t: string): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });
  return runTransaction<Result<void, DomainError>>(db, async (tx) => {
    const snap = await tx.get(rollbackDoc(db, t));
    invariant(snap.exists(), 'a rollback snapshot exists to undo');
    const snapshot = snap.data()?.snapshot as RollbackSnapshot;

    for (const player of snapshot.players) {
      tx.update(playerDoc(db, t, player.playerId), {
        coins: player.coins,
        activeTask: player.activeTask,
        needsPick: player.needsPick,
      });
    }
    for (const task of snapshot.tasks) {
      tx.update(taskDoc(db, t, task.taskId), { usedByPlayerIds: task.usedByPlayerIds });
    }
    tx.update(turnusDoc(db, t), {
      currentDay: snapshot.currentDay,
      currentDayCategories: snapshot.currentDayCategories,
      nextDayCategories: snapshot.nextDayCategories,
      dayLocked: snapshot.dayLocked,
    });
    for (const reservation of snapshot.reservations) {
      const { playerId, createdAt, ...rest } = reservation;
      tx.set(reservationDoc(db, t, playerId), {
        ...rest,
        createdAt: Timestamp.fromMillis(createdAt),
      });
    }
    for (const bid of snapshot.rewardBids) {
      const { playerId, createdAt, ...rest } = bid;
      tx.set(rewardBidDoc(db, t, playerId), {
        ...rest,
        createdAt: Timestamp.fromMillis(createdAt),
      });
    }
    // Owned rewards created by the evaluation are removed again (spec 8, decision A4).
    for (const id of snapshot.purchaseIds) {
      tx.delete(purchaseDoc(db, t, id));
    }
    tx.delete(rollbackDoc(db, t));
    return ok(undefined);
  });
}
