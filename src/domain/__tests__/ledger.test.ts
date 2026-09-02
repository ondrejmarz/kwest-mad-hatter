import { describe, expect, it } from 'vitest';

import { Day } from '../ids';
import { deriveOpeningBalance, derivePlayerStats, type LedgerEntry } from '../ledger';

import { loc } from './fixtures';

const task = (delta: number, outcome: 'completed' | 'failed' | 'no_task'): LedgerEntry => ({
  kind: 'task',
  day: Day(1),
  delta,
  taskName: loc('Task'),
  outcome,
});
const reward = (delta: number): LedgerEntry => ({
  kind: 'reward',
  day: Day(1),
  delta,
  rewardName: loc('Reward'),
  form: 'reward',
});
const adjust = (delta: number, note = ''): LedgerEntry => ({
  kind: 'adjust',
  day: Day(1),
  delta,
  note,
});

describe('deriveOpeningBalance', () => {
  it('is the live balance when there is no history', () => {
    expect(deriveOpeningBalance(120, [])).toBe(120);
  });

  it('is coins minus every recorded delta, so the history reconciles to the balance', () => {
    // base 0 + 150 (task) − 60 (reward) + 20 (adjust) = 110
    const entries = [task(150, 'completed'), reward(-60), adjust(20)];
    expect(deriveOpeningBalance(110, entries)).toBe(0);
  });
});

describe('derivePlayerStats', () => {
  it('counts completed tasks and their pay, and won rewards and their spend', () => {
    const entries = [
      task(150, 'completed'),
      task(-75, 'failed'),
      task(-100, 'no_task'),
      reward(-60),
      reward(-40),
      adjust(20, 'bonus'),
    ];
    expect(derivePlayerStats(entries)).toEqual({
      tasksCompleted: 1,
      rewardsWon: 2,
      coinsEarned: 150,
      coinsSpent: 100,
    });
  });

  it('is all zero for an empty ledger', () => {
    expect(derivePlayerStats([])).toEqual({
      tasksCompleted: 0,
      rewardsWon: 0,
      coinsEarned: 0,
      coinsSpent: 0,
    });
  });
});
