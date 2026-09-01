import { describe, expect, it } from 'vitest';

import { TYPE_KEYS } from '../../lib/group';
import { canPickTaskNow, canReserveTask } from '../eligibility';
import type { TaskId } from '../ids';

import { loc, makePlayer, makeTask, makeTurnus } from './fixtures';

describe('canReserveTask', () => {
  const turnus = makeTurnus({ nextDayCategories: ['chores'] });

  it('allows an eligible task', () => {
    expect(canReserveTask(makePlayer(), makeTask(), turnus)).toEqual({
      ok: true,
      value: undefined,
    });
  });

  it('opens a task by its type even when its tag is closed', () => {
    const pairsOpen = makeTurnus({ nextDayCategories: [TYPE_KEYS.pair] });
    const pair = makeTask({ categories: [loc('games')], minPlayers: 2, maxPlayers: 2 });
    expect(canReserveTask(makePlayer(), pair, pairsOpen)).toEqual({ ok: true, value: undefined });
  });

  it('rejects an inactive task', () => {
    expect(canReserveTask(makePlayer(), makeTask({ active: false }), turnus)).toEqual({
      ok: false,
      error: { code: 'TASK_INACTIVE' },
    });
  });

  it('rejects a category closed for tomorrow', () => {
    expect(canReserveTask(makePlayer(), makeTask({ categories: [loc('games')] }), turnus)).toEqual({
      ok: false,
      error: { code: 'TASK_CATEGORY_CLOSED' },
    });
  });

  it('rejects a task the player already had', () => {
    const player = makePlayer();
    expect(canReserveTask(player, makeTask({ usedByPlayerIds: [player.id] }), turnus)).toEqual({
      ok: false,
      error: { code: 'TASK_ALREADY_USED_BY_PLAYER' },
    });
  });
});

describe('canPickTaskNow', () => {
  const turnus = makeTurnus({ currentDayCategories: ['chores'] });
  const noneTaken = new Map<TaskId, string>();

  it('allows an eligible, unlocked, free task', () => {
    expect(canPickTaskNow(makePlayer(), makeTask(), turnus, noneTaken)).toEqual({
      ok: true,
      value: undefined,
    });
  });

  it('rejects when the day is locked', () => {
    const locked = makeTurnus({ currentDayCategories: ['chores'], dayLocked: true });
    expect(canPickTaskNow(makePlayer(), makeTask(), locked, noneTaken)).toEqual({
      ok: false,
      error: { code: 'DAY_LOCKED' },
    });
  });

  it('rejects an inactive task', () => {
    expect(canPickTaskNow(makePlayer(), makeTask({ active: false }), turnus, noneTaken)).toEqual({
      ok: false,
      error: { code: 'TASK_INACTIVE' },
    });
  });

  it('rejects a category closed today', () => {
    expect(
      canPickTaskNow(makePlayer(), makeTask({ categories: [loc('games')] }), turnus, noneTaken),
    ).toEqual({
      ok: false,
      error: { code: 'TASK_CATEGORY_CLOSED' },
    });
  });

  it('rejects a task the player already had', () => {
    const player = makePlayer();
    expect(
      canPickTaskNow(player, makeTask({ usedByPlayerIds: [player.id] }), turnus, noneTaken),
    ).toEqual({ ok: false, error: { code: 'TASK_ALREADY_USED_BY_PLAYER' } });
  });

  it('rejects a task already taken today by someone else', () => {
    const task = makeTask();
    const taken = new Map<TaskId, string>([[task.id, 'Kuba']]);
    expect(canPickTaskNow(makePlayer(), task, turnus, taken)).toEqual({
      ok: false,
      error: { code: 'TASK_TAKEN_TODAY', byPlayerName: 'Kuba' },
    });
  });
});
