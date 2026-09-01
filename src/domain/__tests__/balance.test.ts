import { describe, expect, it } from 'vitest';

import { projectBalance } from '../balance';

import { makeActiveTask, makePlayer, makeTurnus } from './fixtures';

describe('projectBalance', () => {
  it('projects best and worst case from an active task', () => {
    const player = makePlayer({
      coins: 100,
      activeTask: makeActiveTask({ coinReward: 150 }),
    });

    // The failed-task penalty is the turnus-wide flat `failPenalty` (75 in the fixture).
    expect(projectBalance(player, makeTurnus())).toEqual({
      current: 100,
      taskReward: 150,
      taskPenalty: 75,
      noPickPenalty: 0,
      bestCase: 250,
      worstCase: 25,
    });
  });

  it('applies the no-pick penalty to an approved player without a task', () => {
    const player = makePlayer({ coins: 40, activeTask: null, needsPick: true });

    const b = projectBalance(
      player,
      makeTurnus({ noPickPenalty: 100, allowNegativeBalance: true }),
    );

    expect(b.noPickPenalty).toBe(100);
    expect(b.bestCase).toBe(40);
    expect(b.worstCase).toBe(-60);
  });

  it('floors the worst case when negatives are disallowed', () => {
    const player = makePlayer({ coins: 40, activeTask: null });

    const b = projectBalance(
      player,
      makeTurnus({ noPickPenalty: 100, allowNegativeBalance: false }),
    );

    expect(b.worstCase).toBe(0);
  });

  it('gives a pending player no no-pick penalty', () => {
    const player = makePlayer({ coins: 40, status: 'pending', activeTask: null });

    const b = projectBalance(player, makeTurnus({ noPickPenalty: 100 }));

    expect(b.noPickPenalty).toBe(0);
    expect(b.worstCase).toBe(40);
  });
});
