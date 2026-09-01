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
 * A `punish_someone` bid records the buyer's intended targets, freely editable all day. A person can
 * be aimed at by at most `maxActivePunishesPerPlayer` bidders at once: `targetCounts` is the live
 * public tally per target, and a target newly added to this bid that is already at the cap is
 * refused. `previousTargets` — the buyer's own current picks — are exempt, so they keep them freely
 * even at the cap. The lock only limits who can be picked; who is actually punished, and the final
 * cap, is settled at evaluation (`assignPunishTargets`), so two buyers may share a target when the
 * cap allows (spec 8).
 */
export function createBid(params: {
  readonly player: Player;
  readonly reward: Reward;
  readonly amount: number;
  readonly targetIds: readonly PlayerId[];
  readonly previousTargets: readonly PlayerId[];
  readonly targetCounts: ReadonlyMap<PlayerId, number>;
  readonly turnus: TurnusSettings;
  readonly createdAt: number;
}): Result<RewardBid, DomainError> {
  const { player, reward, amount, targetIds, previousTargets, targetCounts, turnus, createdAt } =
    params;
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
    // A target newly added to this bid needs a free slot; ones the buyer already holds are kept.
    const added = targets.filter((id) => !previousTargets.includes(id));
    if (added.some((id) => (targetCounts.get(id) ?? 0) >= turnus.maxActivePunishesPerPlayer)) {
      return err({ code: 'TARGET_AT_PUNISH_LIMIT', max: turnus.maxActivePunishesPerPlayer });
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
