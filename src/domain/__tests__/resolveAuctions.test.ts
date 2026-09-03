import { describe, expect, it } from 'vitest';

import { PlayerId, RewardId } from '../ids';
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
      1,
    );
    expect(result.wins).toEqual([{ rewardId: 'r1', playerId: 'p1', amount: 60 }]);
    expect(result.coinsAfter.get(PlayerId('p1'))).toBe(40);
  });

  it('gives it to the highest bid when several compete', () => {
    const result = resolveAuctions(
      [makeReward({ id: RewardId('r1'), price: 10 })],
      [
        makeRewardBid({ playerId: PlayerId('p1'), rewardId: RewardId('r1'), amount: 30 }),
        makeRewardBid({ playerId: PlayerId('p2'), rewardId: RewardId('r1'), amount: 50 }),
      ],
      coins({ p1: 100, p2: 100 }),
      1,
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
      1,
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
      1,
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
      1,
    );
    expect(result.wins).toEqual([]);
    expect(result.coinsAfter.get(PlayerId('p1'))).toBe(20);
  });

  it('ignores a reward that drew no bids', () => {
    const result = resolveAuctions(
      [makeReward({ id: RewardId('r1') }), makeReward({ id: RewardId('r2') })],
      [makeRewardBid({ playerId: PlayerId('p1'), rewardId: RewardId('r2'), amount: 50 })],
      coins({ p1: 100 }),
      1,
    );
    expect(result.wins).toEqual([{ rewardId: 'r2', playerId: 'p1', amount: 50 }]);
  });

  it('skips a bid from a player with no balance on record', () => {
    const result = resolveAuctions(
      [makeReward({ id: RewardId('r1'), price: 10 })],
      [makeRewardBid({ playerId: PlayerId('ghost'), rewardId: RewardId('r1'), amount: 20 })],
      coins({}),
      1,
    );
    expect(result.wins).toEqual([]);
  });

  it('lets a player win several rewards up to the per-player cap', () => {
    const result = resolveAuctions(
      [
        makeReward({ id: RewardId('r1'), price: 10 }),
        makeReward({ id: RewardId('r2'), price: 10 }),
      ],
      [
        makeRewardBid({ playerId: PlayerId('p1'), rewardId: RewardId('r1'), amount: 30 }),
        makeRewardBid({ playerId: PlayerId('p1'), rewardId: RewardId('r2'), amount: 40 }),
      ],
      coins({ p1: 100 }),
      2,
    );
    expect(result.wins).toEqual([
      { rewardId: 'r1', playerId: 'p1', amount: 30 },
      { rewardId: 'r2', playerId: 'p1', amount: 40 },
    ]);
    expect(result.coinsAfter.get(PlayerId('p1'))).toBe(30); // 100 − 30 − 40
  });

  it('caps a player at the daily win limit and passes further rewards to the next bidder', () => {
    const result = resolveAuctions(
      [
        makeReward({ id: RewardId('r1'), price: 10 }),
        makeReward({ id: RewardId('r2'), price: 10 }),
      ],
      [
        makeRewardBid({ playerId: PlayerId('greedy'), rewardId: RewardId('r1'), amount: 90 }),
        makeRewardBid({ playerId: PlayerId('greedy'), rewardId: RewardId('r2'), amount: 90 }),
        makeRewardBid({ playerId: PlayerId('other'), rewardId: RewardId('r2'), amount: 20 }),
      ],
      coins({ greedy: 300, other: 100 }),
      1,
    );
    // greedy hits their cap of 1 on r1, so r2 falls to `other` despite greedy's higher bid.
    expect(result.wins).toEqual([
      { rewardId: 'r1', playerId: 'greedy', amount: 90 },
      { rewardId: 'r2', playerId: 'other', amount: 20 },
    ]);
    expect(result.coinsAfter.get(PlayerId('greedy'))).toBe(210); // 300 − 90 (only r1)
    expect(result.coinsAfter.get(PlayerId('other'))).toBe(80);
  });
});
