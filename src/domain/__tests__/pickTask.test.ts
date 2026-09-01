import { describe, expect, it } from 'vitest';

import { TaskId } from '../ids';
import { pickTaskNow } from '../pickTask';

import { loc, makePlayer, makeTask, makeTurnus } from './fixtures';

const OPEN = { currentDayCategories: ['chores'], noPickPenalty: 0 };
const NONE: ReadonlyMap<TaskId, string> = new Map();

describe('pickTaskNow', () => {
  const task = makeTask({ id: TaskId('t1'), categories: [loc('chores')] });

  it('builds the active-task snapshot when the pick is allowed', () => {
    const result = pickTaskNow(makePlayer(), task, makeTurnus(OPEN), NONE);
    expect(result).toEqual({
      ok: true,
      value: {
        taskId: 't1',
        name: task.name,
        description: task.description,
        difficulty: task.difficulty,
        coinReward: task.coinReward,
        partnerNames: [],
      },
    });
  });

  it('passes the eligibility failure through (task already taken today)', () => {
    const taken = new Map<TaskId, string>([[TaskId('t1'), 'Bob']]);
    const result = pickTaskNow(makePlayer(), task, makeTurnus(OPEN), taken);
    expect(result).toEqual({ ok: false, error: { code: 'TASK_TAKEN_TODAY', byPlayerName: 'Bob' } });
  });

  it('refuses when the day is locked', () => {
    const result = pickTaskNow(makePlayer(), task, makeTurnus({ ...OPEN, dayLocked: true }), NONE);
    expect(result).toEqual({ ok: false, error: { code: 'DAY_LOCKED' } });
  });
});
