import { type Firestore, increment, runTransaction, serverTimestamp } from 'firebase/firestore';

import type { DomainError } from '../../domain/errors';
import { type PlayerId } from '../../domain/ids';
import { createBid } from '../../domain/reward';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { punishTargetDoc, rewardBidCountsDoc, rewardBidDoc, rewardDoc } from '../paths';
import { parseReward } from '../schemas/catalog';

import { readPlayer, readTurnus } from './shared';

/**
 * Place or change a sealed bid in a reward's hidden auction (spec 8). Eligibility and the bid
 * object are decided by the pure domain; the transaction only reads state, writes the bid and
 * moves the public interest count (one per player, so switching rewards moves the count). Bids are
 * secret, so nothing is written to the public events log during the day — the win appears only at
 * evaluation (decision A3).
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
    const keptTargets = previous.exists() ? ((previous.data().targetIds as string[]) ?? []) : [];
    // Targets are first-come across all bidders and locked for the whole turnus: a target already
    // claimed (marker exists) can't be picked, except one the bidder is keeping from their own bid
    // (spec 8). Read the markers for the newly-chosen targets to decide.
    const chosen = reward.form === 'punish_someone' ? [...new Set(targetIds)] : [];
    const newTargets = chosen.filter((id) => !keptTargets.includes(id));
    const usedTargets: PlayerId[] = [];
    for (const target of newTargets) {
      const markerSnap = await tx.get(punishTargetDoc(db, t, target));
      if (markerSnap.exists()) usedTargets.push(target);
    }

    const built = createBid({
      player,
      reward,
      amount,
      targetIds,
      usedTargets,
      turnus,
      createdAt: 0,
    });
    if (!built.ok) return built;

    const { createdAt: _placeholder, ...fields } = built.value;
    tx.set(rewardBidDoc(db, t, playerId), { ...fields, createdAt: serverTimestamp() });

    // Claim each newly-chosen target with a create-only marker; contention on it settles first-come.
    for (const target of newTargets) {
      tx.set(punishTargetDoc(db, t, target), { day: turnus.currentDay });
    }

    const countsRef = rewardBidCountsDoc(db, t, built.value.day);
    if (previousRewardId === rewardId) {
      // Same reward — count unchanged.
    } else if (previousRewardId === null) {
      tx.set(countsRef, { counts: { [rewardId]: increment(1) } }, { merge: true });
    } else {
      tx.set(
        countsRef,
        { counts: { [previousRewardId]: increment(-1), [rewardId]: increment(1) } },
        { merge: true },
      );
    }
    return ok(undefined);
  });
}
