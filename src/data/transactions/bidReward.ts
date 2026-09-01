import { type Firestore, increment, runTransaction, serverTimestamp } from 'firebase/firestore';

import type { DomainError } from '../../domain/errors';
import { type PlayerId } from '../../domain/ids';
import { createBid } from '../../domain/reward';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { punishTargetCountsDoc, rewardBidCountsDoc, rewardBidDoc, rewardDoc } from '../paths';
import { parseReward } from '../schemas/catalog';

import { readPlayer, readTurnus } from './shared';

/**
 * Place or change a sealed bid in a reward's hidden auction (spec 8). Eligibility and the bid
 * object are decided by the pure domain; the transaction only reads state, writes the bid and
 * moves the public interest count (one per player, so switching rewards moves the count). Bids are
 * secret: only the interest count is public during the day — the win appears only at
 * evaluation (decision A3). Punishment targets ride along on the bid and stay editable all day; the
 * transaction moves a live per-target tally by the delta so a target locks once it reaches the cap,
 * yet who is actually punished is settled only at evaluation.
 */
export async function bidReward(
  db: Firestore,
  t: string,
  playerId: string,
  rewardId: string,
  amount: number,
  targetIds: readonly PlayerId[] = [],
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });
  return runTransaction<Result<void, DomainError>>(db, async (tx) => {
    const turnus = await readTurnus(tx, db, t);
    const player = await readPlayer(tx, db, t, playerId);
    const rewardSnap = await tx.get(rewardDoc(db, t, rewardId));
    const reward = parseReward(rewardSnap.id, rewardSnap.data() ?? {});
    if (reward === null) return err({ code: 'REWARD_INACTIVE' });

    const previous = await tx.get(rewardBidDoc(db, t, playerId));
    const previousRewardId = previous.exists() ? (previous.data().rewardId as string) : null;
    const previousTargets = previous.exists()
      ? ((previous.data().targetIds as PlayerId[] | undefined) ?? [])
      : [];

    // The live per-target tally: how many current bids aim at each player. A newly-chosen target
    // already at the cap is refused by the domain; the buyer's own current picks are exempt.
    const targetCountsRef = punishTargetCountsDoc(db, t, turnus.currentDay);
    const targetCountsSnap = await tx.get(targetCountsRef);
    const storedCounts = (targetCountsSnap.data()?.counts ?? {}) as Record<string, number>;
    const targetCounts = new Map<PlayerId, number>(
      Object.entries(storedCounts).map(([id, n]) => [id as PlayerId, n]),
    );

    const built = createBid({
      player,
      reward,
      amount,
      targetIds,
      previousTargets,
      targetCounts,
      turnus,
      createdAt: 0,
    });
    if (!built.ok) return built;

    const { createdAt: _placeholder, ...fields } = built.value;
    tx.set(rewardBidDoc(db, t, playerId), { ...fields, createdAt: serverTimestamp() });

    // Move the live target tally by the delta between the old and new picks (dropped ones free up).
    const newTargets = built.value.targetIds;
    const targetDelta: Record<string, ReturnType<typeof increment>> = {};
    for (const id of previousTargets) if (!newTargets.includes(id)) targetDelta[id] = increment(-1);
    for (const id of newTargets) if (!previousTargets.includes(id)) targetDelta[id] = increment(1);
    if (Object.keys(targetDelta).length > 0) {
      tx.set(targetCountsRef, { counts: targetDelta }, { merge: true });
    }

    // Move the public reward-interest count (one per player, so switching rewards moves it).
    const interestRef = rewardBidCountsDoc(db, t, built.value.day);
    if (previousRewardId === rewardId) {
      // Same reward — count unchanged.
    } else if (previousRewardId === null) {
      tx.set(interestRef, { counts: { [rewardId]: increment(1) } }, { merge: true });
    } else {
      tx.set(
        interestRef,
        { counts: { [previousRewardId]: increment(-1), [rewardId]: increment(1) } },
        { merge: true },
      );
    }
    return ok(undefined);
  });
}
