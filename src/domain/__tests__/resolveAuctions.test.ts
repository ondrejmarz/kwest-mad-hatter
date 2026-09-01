import { describe, expect, it } from 'vitest';

import { Day, PlayerId, RewardId } from '../ids';
import { resolveAuctions } from '../rollover/resolveAuctions';

import { makeReward, makeRewardBid } from './fixtures';

const coins = (entries: Record<string, number>): Map<PlayerId, number> =>
  new Map(Object.entries(entries).map(([id, c]) => [PlayerId(id), c]));

describe('resolveAuctions', () => {
  it('awards a reward to its only affordable bidder and charges them', () => {
    const result = resolveAuctions(
      [makeReward({ id: RewardId('r1'), price: 40 })],
      [makeRewardBid({ playerId: PlayerId('p1'), rewardId: RewardId('r1'), amount: 60 })],
      coins({ p1: 100 }),
      Day(1),
    );
    expect(result.wins).toEqual([{ rewardId: 'r1', playerId: 'p1', amount: 60 }]);
    expect(result.coinsAfter.get(PlayerId('p1'))).toBe(40);
    expect(result.events).toEqual([
      { type: 'reward_won', day: 1, playerId: 'p1', rewardId: 'r1', coins: -60 },
    ]);
  });

  it('gives it to the highest bid when several compete', () => {
    const result = resolveAuctions(
      [makeReward({ id: RewardId('r1'), price: 10 })],
      [
        makeRewardBid({ playerId: PlayerId('p1'), rewardId: RewardId('r1'), amount: 30 }),
        makeRewardBid({ playerId: PlayerId('p2'), rewardId: RewardId('r1'), amount: 50 }),
      ],
      coins({ p1: 100, p2: 100 }),
      Day(1),
    );
    expect(result.wins).toEqual([{ rewardId: 'r1', playerId: 'p2', amount: 50 }]);
    expect(result.coinsAfter.get(PlayerId('p2'))).toBe(50);
    expect(result.coinsAfter.get(PlayerId('p1'))).toBe(100); // an outbid player is never charged
  });

  it('breaks an equal-bid tie in favour of the earlier bid', () => {
    const result = resolveAuctions(
      [makeReward({ id: RewardId('r1'), price: 10 })],
      [
        makeRewardBid({
          playerId: PlayerId('late'),
          rewardId: RewardId('r1'),
          amount: 40,
          createdAt: 200,
        }),
        makeRewardBid({
          playerId: PlayerId('early'),
          rewardId: RewardId('r1'),
          amount: 40,
          createdAt: 100,
        }),
      ],
      coins({ late: 100, early: 100 }),
      Day(1),
    );
    expect(result.wins).toEqual([{ rewardId: 'r1', playerId: 'early', amount: 40 }]);
  });

  it('forfeits an unaffordable top bid to the next bidder who can pay', () => {
    const result = resolveAuctions(
      [makeReward({ id: RewardId('r1'), price: 10 })],
      [
        makeRewardBid({ playerId: PlayerId('bold'), rewardId: RewardId('r1'), amount: 90 }),
        makeRewardBid({ playerId: PlayerId('payer'), rewardId: RewardId('r1'), amount: 50 }),
      ],
      coins({ bold: 20, payer: 100 }),
      Day(1),
    );
    expect(result.wins).toEqual([{ rewardId: 'r1', playerId: 'payer', amount: 50 }]);
    expect(result.coinsAfter.get(PlayerId('payer'))).toBe(50);
    expect(result.coinsAfter.get(PlayerId('bold'))).toBe(20); // the bold bid never paid
  });

  it('leaves a reward unsold when nobody can afford their bid', () => {
    const result = resolveAuctions(
      [makeReward({ id: RewardId('r1'), price: 10 })],
      [makeRewardBid({ playerId: PlayerId('p1'), rewardId: RewardId('r1'), amount: 90 })],
      coins({ p1: 20 }),
      Day(1),
    );
    expect(result.wins).toEqual([]);
    expect(result.events).toEqual([]);
    expect(result.coinsAfter.get(PlayerId('p1'))).toBe(20);
  });

  it('ignores a reward that drew no bids', () => {
    const result = resolveAuctions(
      [makeReward({ id: RewardId('r1') }), makeReward({ id: RewardId('r2') })],
      [makeRewardBid({ playerId: PlayerId('p1'), rewardId: RewardId('r2'), amount: 50 })],
      coins({ p1: 100 }),
      Day(1),
    );
    expect(result.wins).toEqual([{ rewardId: 'r2', playerId: 'p1', amount: 50 }]);
  });

  it('skips a bid from a player with no balance on record', () => {
    const result = resolveAuctions(
      [makeReward({ id: RewardId('r1'), price: 10 })],
      [makeRewardBid({ playerId: PlayerId('ghost'), rewardId: RewardId('r1'), amount: 20 })],
      coins({}),
      Day(1),
    );
    expect(result.wins).toEqual([]);
  });
});
