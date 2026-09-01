import { describe, expect, it } from 'vitest';

import { PlayerId, RewardId } from '../ids';
import { assignPunishTargets, type PunishWin } from '../rollover/assignPunishTargets';

const SEED = 3;

const win = (over: Partial<PunishWin> & Pick<PunishWin, 'rewardId' | 'buyerId'>): PunishWin => ({
  amount: 50,
  createdAt: 100,
  minTargets: 1,
  maxTargets: 1,
  picks: [],
  ...over,
});
const targetsOf = (
  result: ReadonlyMap<RewardId, readonly PlayerId[]>,
  reward: string,
): readonly PlayerId[] => result.get(RewardId(reward)) ?? [];

describe('assignPunishTargets', () => {
  it("honours the buyer's picks up to maxTargets", () => {
    const result = assignPunishTargets(
      [
        win({
          rewardId: RewardId('r1'),
          buyerId: PlayerId('p1'),
          minTargets: 1,
          maxTargets: 2,
          picks: [PlayerId('p2'), PlayerId('p3'), PlayerId('p4')],
        }),
      ],
      1,
      [PlayerId('p2'), PlayerId('p3'), PlayerId('p4')],
      SEED,
    );
    expect(targetsOf(result, 'r1')).toEqual(['p2', 'p3']); // stops at maxTargets, p4 ignored
  });

  it('gives a contested target to the higher bid and fills the loser from the pool', () => {
    const result = assignPunishTargets(
      [
        win({
          rewardId: RewardId('r1'),
          buyerId: PlayerId('p1'),
          amount: 40,
          picks: [PlayerId('p2')],
        }),
        win({
          rewardId: RewardId('r2'),
          buyerId: PlayerId('pX'),
          amount: 60,
          picks: [PlayerId('p2')],
        }),
      ],
      1,
      [PlayerId('p2'), PlayerId('p3'), PlayerId('p4')],
      SEED,
    );
    expect(targetsOf(result, 'r2')).toEqual(['p2']); // higher bid (60) claims p2
    const loser = targetsOf(result, 'r1'); // p2 capped -> a different free player fills the slot
    expect(loser).toHaveLength(1);
    expect(['p3', 'p4']).toContain(loser[0]);
  });

  it('skips self, out-of-pool, duplicate and capped picks', () => {
    const result = assignPunishTargets(
      [
        win({
          rewardId: RewardId('r1'),
          buyerId: PlayerId('p1'),
          minTargets: 1,
          maxTargets: 4,
          picks: [PlayerId('p1'), PlayerId('ghost'), PlayerId('p2'), PlayerId('p2')],
        }),
      ],
      1,
      [PlayerId('p2'), PlayerId('p3')],
      SEED,
    );
    expect(targetsOf(result, 'r1')).toEqual(['p2']); // self, ghost, dup all skipped
  });

  it('tops up to minTargets, spreading across the whole free pool', () => {
    const result = assignPunishTargets(
      [
        win({
          rewardId: RewardId('r1'),
          buyerId: PlayerId('p1'),
          minTargets: 3,
          maxTargets: 3,
          picks: [],
        }),
      ],
      1,
      [PlayerId('p2'), PlayerId('p3'), PlayerId('p4')],
      SEED,
    );
    // The whole pool is used to reach minTargets; the order is a seed-shuffle, so assert the set.
    expect([...targetsOf(result, 'r1')].sort()).toEqual(['p2', 'p3', 'p4']);
  });

  it('is deterministic for a given seed but does not always fill the same player', () => {
    const wins = [
      win({ rewardId: RewardId('r1'), buyerId: PlayerId('p1'), minTargets: 1, maxTargets: 1 }),
    ];
    const pool = [PlayerId('a'), PlayerId('b'), PlayerId('c'), PlayerId('d'), PlayerId('e')];
    const pick = (seed: number) => targetsOf(assignPunishTargets(wins, 1, pool, seed), 'r1')[0];
    expect(pick(1)).toBe(pick(1)); // same seed -> same fill (preview matches the committed write)
    const acrossDays = new Set([1, 2, 3, 4, 5, 6].map(pick));
    expect(acrossDays.size).toBeGreaterThan(1); // the auto-fill rotates, not always the lowest id
  });

  it('leaves fewer than minTargets when the pool runs out', () => {
    const result = assignPunishTargets(
      [win({ rewardId: RewardId('r1'), buyerId: PlayerId('p1'), minTargets: 3, maxTargets: 3 })],
      1,
      [PlayerId('p2')],
      SEED,
    );
    expect(targetsOf(result, 'r1')).toEqual(['p2']);
  });

  it('prefers the least-targeted player when the cap allows sharing', () => {
    const result = assignPunishTargets(
      [
        win({
          rewardId: RewardId('r1'),
          buyerId: PlayerId('p1'),
          amount: 90,
          minTargets: 2,
          maxTargets: 2,
          picks: [PlayerId('p2'), PlayerId('p3')],
        }),
        win({
          rewardId: RewardId('r2'),
          buyerId: PlayerId('pX'),
          amount: 50,
          minTargets: 2,
          maxTargets: 2,
          picks: [PlayerId('p2')],
        }),
      ],
      2, // cap 2 — a person can be targeted twice
      [PlayerId('p2'), PlayerId('p3'), PlayerId('p4')],
      SEED,
    );
    expect(targetsOf(result, 'r1')).toEqual(['p2', 'p3']); // counts: p2=1, p3=1
    // r2 takes p2 (now 2), then fills the least-targeted free player: p4 (0) before p3 (1).
    expect(targetsOf(result, 'r2')).toEqual(['p2', 'p4']);
  });

  it('breaks an amount tie by the earlier bid', () => {
    const result = assignPunishTargets(
      [
        win({
          rewardId: RewardId('r1'),
          buyerId: PlayerId('p1'),
          amount: 50,
          createdAt: 200,
          picks: [PlayerId('t')],
        }),
        win({
          rewardId: RewardId('r2'),
          buyerId: PlayerId('pX'),
          amount: 50,
          createdAt: 100,
          picks: [PlayerId('t')],
        }),
      ],
      1,
      [PlayerId('t'), PlayerId('u')],
      SEED,
    );
    expect(targetsOf(result, 'r2')).toEqual(['t']); // earlier bid (100) wins the target
    expect(targetsOf(result, 'r1')).toEqual(['u']);
  });

  it('breaks a full tie by player id, whichever order the wins arrive', () => {
    const a = win({ rewardId: RewardId('r2'), buyerId: PlayerId('p2'), picks: [PlayerId('t')] });
    const b = win({ rewardId: RewardId('r3'), buyerId: PlayerId('p3'), picks: [PlayerId('t')] });
    const pool = [PlayerId('t'), PlayerId('u')];
    const forward = assignPunishTargets([a, b], 1, pool, SEED);
    const backward = assignPunishTargets([b, a], 1, pool, SEED);
    expect(targetsOf(forward, 'r2')).toEqual(['t']); // p2 < p3 claims t either way
    expect(targetsOf(forward, 'r3')).toEqual(['u']);
    expect(targetsOf(backward, 'r2')).toEqual(['t']);
    expect(targetsOf(backward, 'r3')).toEqual(['u']);
  });
});
