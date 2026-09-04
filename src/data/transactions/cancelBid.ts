import { type Firestore, increment, runTransaction } from 'firebase/firestore';

import type { DomainError } from '../../domain/errors';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { punishTargetCountsDoc, rewardBidCountsDoc, rewardBidDoc } from '../paths';
import { parseRewardBid } from '../schemas/rewardBid';

/**
 * A player withdraws their bid before the day is evaluated (spec 8). Deleting the doc drops the
 * reward's public interest count by one and frees any punishment targets it held (the live tally
 * goes down, so a locked target can be picked again). Secret, so no public event is written.
 */
export async function cancelBid(
  db: Firestore,
  t: string,
  playerId: string,
  rewardId: string,
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });
  return runTransaction<Result<void, DomainError>>(db, async (tx) => {
    const snap = await tx.get(rewardBidDoc(db, t, playerId, rewardId));
    if (!snap.exists()) return ok(undefined);
    const bid = parseRewardBid(snap.id, snap.data() ?? {});

    tx.delete(rewardBidDoc(db, t, playerId, rewardId));
    if (bid !== null) {
      tx.set(
        rewardBidCountsDoc(db, t, bid.day),
        { counts: { [bid.rewardId]: increment(-1) } },
        { merge: true },
      );
      if (bid.targetIds.length > 0) {
        const targetDelta: Record<string, ReturnType<typeof increment>> = {};
        for (const id of bid.targetIds) targetDelta[id] = increment(-1);
        tx.set(punishTargetCountsDoc(db, t, bid.day), { counts: targetDelta }, { merge: true });
      }
    }
    return ok(undefined);
  });
}
