import { err, ok, type Result } from '../lib/result';

import type { DomainError } from './errors';
import type { Player, Reward, RewardBid, TurnusSettings } from './types';

/**
 * Place or change a sealed auction bid (spec 8, reimagined as a hidden auction). Bidding is frozen
 * once the admin locks the day, the reward must still be active, and a bid may not fall below the
 * reward's price — the price is the auction's starting bid, not a fixed cost.
 *
 * There is deliberately no affordability check here: bids never escrow coins, so a player may bid
 * more than they currently hold (hoping to earn the difference before evaluation). The winner's
 * ability to pay is re-checked at evaluation, where an unaffordable top bid forfeits to the next.
 */
export function createBid(params: {
  readonly player: Player;
  readonly reward: Reward;
  readonly amount: number;
  readonly turnus: TurnusSettings;
  readonly createdAt: number;
}): Result<RewardBid, DomainError> {
  const { player, reward, amount, turnus, createdAt } = params;
  if (turnus.dayLocked) return err({ code: 'DAY_LOCKED' });
  if (!reward.active) return err({ code: 'REWARD_INACTIVE' });
  if (!Number.isInteger(amount) || amount < reward.price) {
    return err({ code: 'BID_BELOW_MINIMUM', min: reward.price });
  }
  return ok({
    playerId: player.id,
    day: turnus.currentDay,
    rewardId: reward.id,
    amount,
    createdAt,
  });
}
