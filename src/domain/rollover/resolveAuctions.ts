import { gameEvent, type GameEvent } from '../events';
import type { Day, PlayerId, RewardId } from '../ids';
import type { Reward, RewardBid } from '../types';

export interface AuctionWin {
  readonly rewardId: RewardId;
  readonly playerId: PlayerId;
  readonly amount: number;
}

export interface AuctionResult {
  readonly wins: readonly AuctionWin[];
  /** Balances after every winner has paid — folded into the players' final coins. */
  readonly coinsAfter: ReadonlyMap<PlayerId, number>;
  readonly events: readonly GameEvent[];
}

/**
 * Resolve each reward's sealed-bid auction against the post-settlement balances (spec 8, reimagined
 * as a hidden auction). Rewards are settled in a stable order (by id); within a reward the highest
 * bid wins, ties broken by the earlier bid and then the smaller player id. The winner must still
 * afford it on the balance left after any earlier wins that evening — otherwise it passes to the
 * next-highest affordable bidder, and stays unsold if nobody can pay. There is no escrow: bids never
 * hold coins, so a losing (or outbid) player keeps everything.
 */
export function resolveAuctions(
  rewards: readonly Reward[],
  bids: readonly RewardBid[],
  coins: ReadonlyMap<PlayerId, number>,
  day: Day,
): AuctionResult {
  const balances = new Map(coins);
  const bidsByReward = new Map<RewardId, RewardBid[]>();
  for (const bid of bids) {
    const list = bidsByReward.get(bid.rewardId) ?? [];
    list.push(bid);
    bidsByReward.set(bid.rewardId, list);
  }

  const wins: AuctionWin[] = [];
  const events: GameEvent[] = [];
  // Rewards resolve in catalog order (stable across the admin's preview and the committed write,
  // which share one input); the highest bid wins, ties broken by the earlier bid.
  for (const reward of rewards) {
    const contenders = [...(bidsByReward.get(reward.id) ?? [])].sort(
      (a, b) => b.amount - a.amount || a.createdAt - b.createdAt,
    );
    for (const bid of contenders) {
      const balance = balances.get(bid.playerId);
      if (balance !== undefined && balance >= bid.amount) {
        balances.set(bid.playerId, balance - bid.amount);
        wins.push({ rewardId: reward.id, playerId: bid.playerId, amount: bid.amount });
        events.push(gameEvent.rewardWon(day, bid.playerId, reward.id, -bid.amount));
        break;
      }
    }
  }

  return { wins, coinsAfter: balances, events };
}
