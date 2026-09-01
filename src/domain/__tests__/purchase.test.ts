import { describe, expect, it } from 'vitest';

import { PlayerId } from '../ids';
import { validatePurchase, type PurchaseInput } from '../purchase';

import { makePlayer, makeReward, makeTurnus } from './fixtures';

const base = (over: Partial<PurchaseInput> = {}): PurchaseInput => ({
  buyer: makePlayer({ coins: 100 }),
  reward: makeReward({ price: 50, form: 'reward' }),
  turnus: makeTurnus({ maxActiveRewardsPerPlayer: 1, maxActivePunishesPerPlayer: 1 }),
  buyerActivePurchases: 0,
  punishTargetCounts: new Map(),
  exclusiveTakenBy: null,
  targets: [],
  ...over,
});

const punish = (over: Partial<PurchaseInput> = {}): PurchaseInput =>
  base({
    reward: makeReward({ form: 'punish_someone', price: 30, minTargets: 1, maxTargets: 2 }),
    ...over,
  });

describe('validatePurchase', () => {
  it('accepts a simple reward and returns the coin delta', () => {
    expect(validatePurchase(base())).toEqual({
      ok: true,
      value: { price: 50, buyerCoinsAfter: 50, targetIds: [], targetNames: [] },
    });
  });

  it('rejects an inactive reward', () => {
    expect(validatePurchase(base({ reward: makeReward({ active: false }) }))).toEqual({
      ok: false,
      error: { code: 'REWARD_INACTIVE' },
    });
  });

  it('rejects a purchase while the day is locked', () => {
    expect(validatePurchase(base({ turnus: makeTurnus({ dayLocked: true }) }))).toEqual({
      ok: false,
      error: { code: 'DAY_LOCKED' },
    });
  });

  it('rejects when the buyer cannot afford it', () => {
    expect(validatePurchase(base({ buyer: makePlayer({ coins: 10 }) }))).toEqual({
      ok: false,
      error: { code: 'INSUFFICIENT_COINS', needed: 50, available: 10 },
    });
  });

  it('rejects when the buyer is at the active-purchase cap', () => {
    expect(validatePurchase(base({ buyerActivePurchases: 1 }))).toEqual({
      ok: false,
      error: { code: 'TOO_MANY_ACTIVE_REWARDS', max: 1 },
    });
  });

  it('rejects an exclusive reward already taken today', () => {
    expect(
      validatePurchase(
        base({
          reward: makeReward({ exclusivePerDay: true, price: 50 }),
          exclusiveTakenBy: 'Kuba',
        }),
      ),
    ).toEqual({ ok: false, error: { code: 'REWARD_EXCLUSIVE_TAKEN', byPlayerName: 'Kuba' } });
  });

  it('accepts an exclusive reward not yet taken', () => {
    const result = validatePurchase(
      base({ reward: makeReward({ exclusivePerDay: true, price: 50 }) }),
    );
    expect(result.ok).toBe(true);
  });

  it('rejects too few punish targets', () => {
    expect(validatePurchase(punish({ targets: [] }))).toEqual({
      ok: false,
      error: { code: 'TARGET_COUNT_OUT_OF_RANGE', min: 1, max: 2 },
    });
  });

  it('rejects too many punish targets', () => {
    const targets = [
      { id: PlayerId('a'), name: 'A' },
      { id: PlayerId('b'), name: 'B' },
      { id: PlayerId('c'), name: 'C' },
    ];
    expect(validatePurchase(punish({ targets }))).toEqual({
      ok: false,
      error: { code: 'TARGET_COUNT_OUT_OF_RANGE', min: 1, max: 2 },
    });
  });

  it('forbids targeting yourself', () => {
    const buyer = makePlayer({ id: PlayerId('me'), coins: 100 });
    expect(
      validatePurchase(punish({ buyer, targets: [{ id: PlayerId('me'), name: 'Me' }] })),
    ).toEqual({ ok: false, error: { code: 'CANNOT_TARGET_SELF' } });
  });

  it('rejects a target already at the punish limit', () => {
    const counts = new Map<PlayerId, number>([[PlayerId('victim'), 1]]);
    expect(
      validatePurchase(
        punish({ punishTargetCounts: counts, targets: [{ id: PlayerId('victim'), name: 'Vic' }] }),
      ),
    ).toEqual({ ok: false, error: { code: 'TARGET_AT_PUNISH_LIMIT', playerName: 'Vic', max: 1 } });
  });

  it('accepts a valid punish and records its targets', () => {
    expect(
      validatePurchase(punish({ targets: [{ id: PlayerId('victim'), name: 'Vic' }] })),
    ).toEqual({
      ok: true,
      value: { price: 30, buyerCoinsAfter: 70, targetIds: ['victim'], targetNames: ['Vic'] },
    });
  });

  it('carries no targets for a punish_all', () => {
    expect(
      validatePurchase(base({ reward: makeReward({ form: 'punish_all', price: 40 }) })),
    ).toEqual({
      ok: true,
      value: { price: 40, buyerCoinsAfter: 60, targetIds: [], targetNames: [] },
    });
  });
});
