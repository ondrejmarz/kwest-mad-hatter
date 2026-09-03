import type { PlayerId, RewardId } from '../ids';
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
}

/**
 * Resolve each reward's sealed-bid auction against the post-settlement balances (spec 8, reimagined
 * as a hidden auction). Rewards are settled in a stable order (by id); within a reward the highest
 * bid wins, ties broken by the earlier bid and then the smaller player id. The winner must still
 * afford it on the balance left after any earlier wins that evening — otherwise it passes to the
 * next-highest affordable bidder, and stays unsold if nobody can pay. There is no escrow: bids never
 * hold coins, so a losing (or outbid) player keeps everything.
 *
 * A player may bid on several rewards a day but wins at most `maxPerPlayer` of them (the turnus
 * setting): once a player has won that many, their bids on later rewards pass to the next contender.
 */
export function resolveAuctions(
  rewards: readonly Reward[],
  bids: readonly RewardBid[],
  coins: ReadonlyMap<PlayerId, number>,
  maxPerPlayer: number,
): AuctionResult {
  const balances = new Map(coins);
  const winsByPlayer = new Map<PlayerId, number>();
  const bidsByReward = new Map<RewardId, RewardBid[]>();
  for (const bid of bids) {
    const list = bidsByReward.get(bid.rewardId) ?? [];
    list.push(bid);
    bidsByReward.set(bid.rewardId, list);
  }

  const wins: AuctionWin[] = [];
  // Rewards resolve in catalog order (stable across the admin's preview and the committed write,
  // which share one input); the highest bid wins, ties broken by the earlier bid.
  for (const reward of rewards) {
    const contenders = [...(bidsByReward.get(reward.id) ?? [])].sort(
      (a, b) => b.amount - a.amount || a.createdAt - b.createdAt,
    );
    for (const bid of contenders) {
      // A player already at their daily win cap can't take another — the reward falls to the next.
      if ((winsByPlayer.get(bid.playerId) ?? 0) >= maxPerPlayer) continue;
      const balance = balances.get(bid.playerId);
      if (balance !== undefined && balance >= bid.amount) {
        balances.set(bid.playerId, balance - bid.amount);
        winsByPlayer.set(bid.playerId, (winsByPlayer.get(bid.playerId) ?? 0) + 1);
        wins.push({ rewardId: reward.id, playerId: bid.playerId, amount: bid.amount });
        break;
      }
    }
  }

  return { wins, coinsAfter: balances };
}
