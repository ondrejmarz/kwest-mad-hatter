import { err, ok, type Result } from '../lib/result';

import type { DomainError } from './errors';
import type { PlayerId } from './ids';
import type { Player, Reward, RewardBid, TurnusSettings } from './types';

/**
 * Place or change a sealed auction bid (spec 8, reimagined as a hidden auction). Bidding is frozen
 * once the admin locks the day, the reward must still be active, and a bid may not fall below the
 * reward's price — the price is the auction's starting bid, not a fixed cost.
 *
 * There is deliberately no affordability check here: bids never escrow coins, so a player may bid
 * more than they currently hold (hoping to earn the difference before evaluation). The winner's
 * ability to pay is re-checked at evaluation, where an unaffordable top bid forfeits to the next.
 *
 * `usedTargets` are people this bidder has already aimed a punishment at earlier in the turnus: each
 * (bidder, target) pair may be chosen only once, ever, whether or not that bid won (spec 8).
 */
export function createBid(params: {
  readonly player: Player;
  readonly reward: Reward;
  readonly amount: number;
  readonly targetIds: readonly PlayerId[];
  readonly usedTargets: readonly PlayerId[];
  readonly turnus: TurnusSettings;
  readonly createdAt: number;
}): Result<RewardBid, DomainError> {
  const { player, reward, amount, targetIds, usedTargets, turnus, createdAt } = params;
  if (turnus.dayLocked) return err({ code: 'DAY_LOCKED' });
  if (!reward.active) return err({ code: 'REWARD_INACTIVE' });
  if (!Number.isInteger(amount) || amount < reward.price) {
    return err({ code: 'BID_BELOW_MINIMUM', min: reward.price });
  }
  // Only `punish_someone` carries targets — whom the buyer would punish if this bid wins. Their
  // actual (capped/filled) targets are decided at evaluation; here we just validate the intent.
  const targets = reward.form === 'punish_someone' ? [...new Set(targetIds)] : [];
  if (reward.form === 'punish_someone') {
    if (targets.includes(player.id)) return err({ code: 'CANNOT_TARGET_SELF' });
    if (targets.some((id) => usedTargets.includes(id))) {
      return err({ code: 'TARGET_ALREADY_USED' });
    }
    if (targets.length < reward.minTargets || targets.length > reward.maxTargets) {
      return err({
        code: 'TARGET_COUNT_OUT_OF_RANGE',
        min: reward.minTargets,
        max: reward.maxTargets,
      });
    }
  }
  return ok({
    playerId: player.id,
    day: turnus.currentDay,
    rewardId: reward.id,
    amount,
    targetIds: targets,
    createdAt,
  });
}
