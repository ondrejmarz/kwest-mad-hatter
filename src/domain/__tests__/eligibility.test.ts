import { describe, expect, it } from 'vitest';

import { TYPE_KEYS } from '../../lib/group';
import { canInitiatePairPick, canPickTaskNow, canReserveTask, hasUsedTask } from '../eligibility';
import { TaskId } from '../ids';

import { loc, makeActiveTask, makePlayer, makeTask, makeTurnus } from './fixtures';

describe('hasUsedTask', () => {
  it('is false for a task the player has never had', () => {
    expect(hasUsedTask(makePlayer(), makeTask())).toBe(false);
  });

  it('is true for the task the player is doing right now', () => {
    const player = makePlayer({ activeTask: makeActiveTask({ taskId: makeTask().id }) });
    expect(hasUsedTask(player, makeTask())).toBe(true);
  });

  it('is true for a task the player completed on a past day', () => {
    const player = makePlayer();
    expect(hasUsedTask(player, makeTask({ usedByPlayerIds: [player.id] }))).toBe(true);
  });

  it('is false when the player is busy with a different task', () => {
    const player = makePlayer({ activeTask: makeActiveTask({ taskId: TaskId('other') }) });
    expect(hasUsedTask(player, makeTask())).toBe(false);
  });
});

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

  it('rejects reserving the task the player is doing today', () => {
    const player = makePlayer({ activeTask: makeActiveTask({ taskId: makeTask().id }) });
    expect(canReserveTask(player, makeTask(), turnus)).toEqual({
      ok: false,
      error: { code: 'TASK_ALREADY_USED_BY_PLAYER' },
    });
  });

  it('rejects any reservation while the day is locked', () => {
    const locked = makeTurnus({ nextDayCategories: ['chores'], dayLocked: true });
    expect(canReserveTask(makePlayer(), makeTask(), locked)).toEqual({
      ok: false,
      error: { code: 'DAY_LOCKED' },
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

  it('rejects a non-solo task — pairs and groups are reservation-only', () => {
    const pair = makeTask({ categories: [loc('chores')], minPlayers: 2, maxPlayers: 2 });
    expect(canPickTaskNow(makePlayer(), pair, turnus, noneTaken)).toEqual({
      ok: false,
      error: { code: 'SAME_DAY_SOLO_ONLY' },
    });
  });

  it('allows a pair for a same-day pair pick', () => {
    const pair = makeTask({ categories: [loc('chores')], minPlayers: 2, maxPlayers: 2 });
    expect(canInitiatePairPick(makePlayer(), pair, turnus, noneTaken)).toEqual({
      ok: true,
      value: undefined,
    });
  });

  it('rejects a non-pair for a pair pick', () => {
    expect(canInitiatePairPick(makePlayer(), makeTask(), turnus, noneTaken)).toEqual({
      ok: false,
      error: { code: 'SAME_DAY_SOLO_ONLY' },
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
