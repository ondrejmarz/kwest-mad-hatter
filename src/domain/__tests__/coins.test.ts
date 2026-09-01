import { describe, expect, it } from 'vitest';

import { applyFloor, deriveReward } from '../coins';

describe('coins', () => {
  it('derives reward as 80 + 20 * difficulty (100 easiest, 200 hardest)', () => {
    expect(deriveReward(1)).toBe(100);
    expect(deriveReward(6)).toBe(200);
    expect(deriveReward(3)).toBe(140);
  });

  it('floors the balance only when negatives are disallowed', () => {
    expect(applyFloor(-10, true)).toBe(-10);
    expect(applyFloor(-10, false)).toBe(0);
    expect(applyFloor(5, false)).toBe(5);
  });
});
