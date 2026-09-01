import { describe, expect, it } from 'vitest';

import { Day, PlayerId, RewardId, TaskId, TurnusId } from '../ids';

describe('branded id constructors', () => {
  it('wrap the raw value unchanged at runtime', () => {
    expect(PlayerId('p1')).toBe('p1');
    expect(TaskId('t1')).toBe('t1');
    expect(RewardId('r1')).toBe('r1');
    expect(TurnusId('leto27')).toBe('leto27');
    expect(Day(3)).toBe(3);
  });
});
