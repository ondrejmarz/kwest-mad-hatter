import { describe, expect, it } from 'vitest';

import { applyFloor, derivePenalty, deriveReward } from '../coins';

describe('coins', () => {
  it('derives reward as base 100 plus difficulty times the coefficient', () => {
    expect(deriveReward(1, 50)).toBe(150);
    expect(deriveReward(6, 50)).toBe(400);
    expect(deriveReward(3, 0)).toBe(100);
  });

  it('derives penalty as a rounded ratio of the reward', () => {
    expect(derivePenalty(150, 0.5)).toBe(75);
    expect(derivePenalty(125, 0.5)).toBe(63); // 62.5 rounds up
    expect(derivePenalty(100, 0)).toBe(0);
  });

  it('floors the balance only when negatives are disallowed', () => {
    expect(applyFloor(-10, true)).toBe(-10);
    expect(applyFloor(-10, false)).toBe(0);
    expect(applyFloor(5, false)).toBe(5);
  });
});
