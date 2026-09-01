import { describe, expect, it } from 'vitest';

import { Day, PlayerId, RewardId } from '../ids';
import { createBid } from '../reward';

import { makePlayer, makeReward, makeTurnus } from './fixtures';

describe('createBid', () => {
  const base = {
    player: makePlayer({ id: PlayerId('p1') }),
    reward: makeReward({ id: RewardId('r1'), price: 50 }),
    turnus: makeTurnus({ currentDay: Day(3) }),
    createdAt: 1234,
  };

  it('places a valid bid at or above the price', () => {
    expect(createBid({ ...base, amount: 80 })).toEqual({
      ok: true,
      value: { playerId: 'p1', day: 3, rewardId: 'r1', amount: 80, createdAt: 1234 },
    });
  });

  it('rejects a bid while the day is locked', () => {
    expect(createBid({ ...base, amount: 80, turnus: makeTurnus({ dayLocked: true }) })).toEqual({
      ok: false,
      error: { code: 'DAY_LOCKED' },
    });
  });

  it('rejects an inactive reward', () => {
    expect(
      createBid({ ...base, amount: 80, reward: makeReward({ price: 50, active: false }) }),
    ).toEqual({ ok: false, error: { code: 'REWARD_INACTIVE' } });
  });

  it('rejects a bid below the price', () => {
    expect(createBid({ ...base, amount: 40 })).toEqual({
      ok: false,
      error: { code: 'BID_BELOW_MINIMUM', min: 50 },
    });
  });

  it('rejects a non-integer bid', () => {
    expect(createBid({ ...base, amount: 60.5 })).toEqual({
      ok: false,
      error: { code: 'BID_BELOW_MINIMUM', min: 50 },
    });
  });
});
