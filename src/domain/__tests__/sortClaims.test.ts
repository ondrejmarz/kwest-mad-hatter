import { describe, expect, it } from 'vitest';

import { TaskId } from '../ids';
import { compareClaims, sortClaims } from '../rollover/sortClaims';
import type { Claim } from '../rollover/types';

const claim = (over: Partial<Claim>): Claim => ({
  taskId: TaskId('t'),
  taskName: 'T',
  isPair: false,
  playerIds: [],
  balance: 0,
  createdAt: 0,
  key: 'a',
  ...over,
});

describe('compareClaims', () => {
  it('orders by balance ascending first', () => {
    expect(compareClaims(claim({ balance: 10 }), claim({ balance: 20 }))).toBeLessThan(0);
    expect(compareClaims(claim({ balance: 20 }), claim({ balance: 10 }))).toBeGreaterThan(0);
  });

  it('breaks a balance tie by the earlier reservation', () => {
    expect(
      compareClaims(claim({ balance: 5, createdAt: 100 }), claim({ balance: 5, createdAt: 200 })),
    ).toBeLessThan(0);
  });

  it('breaks a time tie by lexicographic key', () => {
    const same = { balance: 5, createdAt: 1 } as const;
    expect(compareClaims(claim({ ...same, key: 'a' }), claim({ ...same, key: 'b' }))).toBe(-1);
    expect(compareClaims(claim({ ...same, key: 'b' }), claim({ ...same, key: 'a' }))).toBe(1);
  });

  it('is zero for fully equal claims', () => {
    const c = { balance: 5, createdAt: 1, key: 'a' } as const;
    expect(compareClaims(claim(c), claim(c))).toBe(0);
  });
});

describe('sortClaims', () => {
  it('returns a new array in ascending balance order', () => {
    const input = [claim({ balance: 30, key: 'x' }), claim({ balance: 10, key: 'y' })];
    const sorted = sortClaims(input);
    expect(sorted.map((c) => c.balance)).toEqual([10, 30]);
    expect(sorted).not.toBe(input);
  });
});
