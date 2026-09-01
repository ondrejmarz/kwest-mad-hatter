import { describe, expect, it } from 'vitest';

import { Day, PlayerId, TaskId } from '../ids';
import { resolveRollover } from '../rollover';
import type { PlayerUpdate, RolloverResult } from '../rollover';
import type { Player, Reservation, Task, TurnusSettings } from '../types';

import { makeActiveTask, makePlayer, makeReservation, makeTask, makeTurnus } from './fixtures';

interface RunInput {
  readonly turnus?: Partial<TurnusSettings>;
  readonly players?: readonly Player[];
  readonly tasks?: readonly Task[];
  readonly reservations?: readonly Reservation[];
  readonly completed?: readonly PlayerId[];
}

function run(input: RunInput): RolloverResult {
  return resolveRollover({
    turnus: makeTurnus(input.turnus),
    players: input.players ?? [],
    tasks: input.tasks ?? [],
    reservations: input.reservations ?? [],
    completedPlayerIds: new Set(input.completed ?? []),
  });
}

/** Looks up one player's update; throws (test-only) if it is missing. */
function pu(result: RolloverResult, id: string): PlayerUpdate {
  const update = result.playerUpdates.find((u) => u.playerId === id);
  if (!update) throw new Error(`no player update for ${id}`);
  return update;
}

describe('resolveRollover — settlement (step 1)', () => {
  it('handles an empty turnus', () => {
    const result = run({ turnus: { currentDay: Day(1) } });
    expect(result.nextDay).toBe(2);
    expect(result.playerUpdates).toEqual([]);
    expect(result.taskUpdates).toEqual([]);
    expect(result.events).toEqual([]);
    expect(result.turnus).toEqual({ currentDay: 2, currentDayCategories: [], dayLocked: false });
  });

  it('pays everyone who completed their task', () => {
    const p1 = makePlayer({
      id: PlayerId('p1'),
      coins: 100,
      activeTask: makeActiveTask({ taskId: TaskId('t1'), coinReward: 150 }),
    });
    const p2 = makePlayer({
      id: PlayerId('p2'),
      coins: 100,
      activeTask: makeActiveTask({ taskId: TaskId('t2'), coinReward: 200 }),
    });
    const result = run({
      players: [p1, p2],
      tasks: [makeTask({ id: TaskId('t1') }), makeTask({ id: TaskId('t2') })],
      completed: [PlayerId('p1'), PlayerId('p2')],
    });
    expect(pu(result, 'p1').coins).toBe(250);
    expect(pu(result, 'p2').coins).toBe(300);
    expect(pu(result, 'p1').activeTask).toBeNull();
    expect(pu(result, 'p1').needsPick).toBe(true);
    expect(result.events.filter((e) => e.type === 'task_completed')).toHaveLength(2);
  });

  it('penalizes a failed task and still marks it used', () => {
    const p1 = makePlayer({
      id: PlayerId('p1'),
      coins: 100,
      activeTask: makeActiveTask({ taskId: TaskId('t1'), coinPenalty: 75 }),
    });
    const result = run({
      players: [p1],
      tasks: [makeTask({ id: TaskId('t1'), usedByPlayerIds: [] })],
      completed: [],
    });
    expect(pu(result, 'p1').coins).toBe(25);
    expect(result.events.some((e) => e.type === 'task_failed')).toBe(true);
    expect(result.taskUpdates.find((t) => t.taskId === 't1')?.usedByPlayerIds).toContain('p1');
  });

  it('lets a failed balance go negative, or floors it to zero when configured', () => {
    const failing = (): Player =>
      makePlayer({
        id: PlayerId('p1'),
        coins: 20,
        activeTask: makeActiveTask({ taskId: TaskId('t1'), coinPenalty: 75 }),
      });
    const tasks = [makeTask({ id: TaskId('t1') })];
    const negative = run({ players: [failing()], tasks, turnus: { allowNegativeBalance: true } });
    const floored = run({ players: [failing()], tasks, turnus: { allowNegativeBalance: false } });
    expect(pu(negative, 'p1').coins).toBe(-55);
    expect(pu(floored, 'p1').coins).toBe(0);
  });

  it('docks an approved player who never picked a task', () => {
    const p = makePlayer({ id: PlayerId('p1'), coins: 100, activeTask: null });
    const result = run({ turnus: { noPickPenalty: 40 }, players: [p] });
    expect(pu(result, 'p1').coins).toBe(60);
    expect(result.events).toContainEqual({
      type: 'no_task_penalty',
      day: 1,
      playerId: 'p1',
      coins: -40,
    });
  });

  it('ignores players who are not approved', () => {
    const pending = makePlayer({ id: PlayerId('p9'), status: 'pending', coins: 999 });
    const approved = makePlayer({ id: PlayerId('p1'), coins: 50, activeTask: null });
    const result = run({ turnus: { noPickPenalty: 0 }, players: [pending, approved] });
    expect(result.playerUpdates.map((u) => u.playerId)).toEqual(['p1']);
  });

  it('marks a pair task used by both partners', () => {
    const pairTask = (partner: string) =>
      makeActiveTask({ taskId: TaskId('t1'), isPair: true, partnerId: PlayerId(partner) });
    const a = makePlayer({ id: PlayerId('a'), activeTask: pairTask('b') });
    const b = makePlayer({ id: PlayerId('b'), activeTask: pairTask('a') });
    const result = run({
      players: [a, b],
      tasks: [makeTask({ id: TaskId('t1'), isPair: true })],
      completed: [PlayerId('a'), PlayerId('b')],
    });
    const used = result.taskUpdates.find((t) => t.taskId === 't1')?.usedByPlayerIds;
    expect(used).toEqual(expect.arrayContaining(['a', 'b']));
    expect(used).toHaveLength(2);
  });
});

describe('resolveRollover — reservations (step 3)', () => {
  const chores = { currentDay: Day(1), noPickPenalty: 0, nextDayCategories: ['chores'] };
  const t1 = makeTask({ id: TaskId('t1'), category: 'chores' });
  const reserve = (
    playerId: string,
    createdAt: number,
    over: Partial<Reservation> = {},
  ): Reservation =>
    makeReservation({
      playerId: PlayerId(playerId),
      taskId: TaskId('t1'),
      day: Day(2),
      createdAt,
      ...over,
    });

  it('gives a contested task to the poorer player', () => {
    const result = run({
      turnus: chores,
      players: [
        makePlayer({ id: PlayerId('p1'), coins: 30 }),
        makePlayer({ id: PlayerId('p2'), coins: 90 }),
      ],
      tasks: [t1],
      reservations: [reserve('p1', 100), reserve('p2', 100)],
    });
    expect(pu(result, 'p1').activeTask?.taskId).toBe('t1');
    expect(pu(result, 'p1').needsPick).toBe(false);
    expect(pu(result, 'p2').activeTask).toBeNull();
    expect(pu(result, 'p2').needsPick).toBe(true);
    expect(result.events.some((e) => e.type === 'reservation_lost' && e.playerId === 'p2')).toBe(
      true,
    );
  });

  it('ranks on post-settlement coins, not yesterday — reversing the steps would flip the winner', () => {
    const p1 = makePlayer({
      id: PlayerId('p1'),
      coins: 100,
      activeTask: makeActiveTask({ taskId: TaskId('a'), coinPenalty: 80 }),
    });
    const p2 = makePlayer({
      id: PlayerId('p2'),
      coins: 50,
      activeTask: makeActiveTask({ taskId: TaskId('b'), coinReward: 100 }),
    });
    const result = run({
      turnus: chores,
      players: [p1, p2],
      tasks: [makeTask({ id: TaskId('a') }), makeTask({ id: TaskId('b') }), t1],
      completed: [PlayerId('p2')],
      reservations: [reserve('p1', 100), reserve('p2', 100)],
    });
    // p1 fails (100 -> 20), p2 completes (50 -> 150): p1 is now poorer and wins.
    expect(pu(result, 'p1').coins).toBe(20);
    expect(pu(result, 'p2').coins).toBe(150);
    expect(pu(result, 'p1').activeTask?.taskId).toBe('t1');
    expect(pu(result, 'p2').activeTask).toBeNull();
  });

  it('breaks a coin tie by the earlier reservation', () => {
    const result = run({
      turnus: chores,
      players: [
        makePlayer({ id: PlayerId('p1'), coins: 50 }),
        makePlayer({ id: PlayerId('p2'), coins: 50 }),
      ],
      tasks: [t1],
      reservations: [reserve('p2', 200), reserve('p1', 100)],
    });
    expect(pu(result, 'p1').activeTask?.taskId).toBe('t1');
    expect(pu(result, 'p2').activeTask).toBeNull();
  });

  it('breaks a full tie deterministically by player id, and repeats', () => {
    const build = (): RolloverResult =>
      run({
        turnus: chores,
        players: [
          makePlayer({ id: PlayerId('p2'), coins: 50 }),
          makePlayer({ id: PlayerId('p1'), coins: 50 }),
        ],
        tasks: [t1],
        reservations: [reserve('p2', 100), reserve('p1', 100)],
      });
    const a = build();
    const b = build();
    expect(pu(a, 'p1').activeTask?.taskId).toBe('t1'); // 'p1' < 'p2'
    expect(pu(a, 'p2').activeTask).toBeNull();
    expect(pu(b, 'p1').activeTask?.taskId).toBe('t1');
    expect(pu(b, 'p2').activeTask).toBeNull();
  });

  it('gives a task to one of three and leaves the other two needing a pick', () => {
    const result = run({
      turnus: chores,
      players: [
        makePlayer({ id: PlayerId('p1'), coins: 10 }),
        makePlayer({ id: PlayerId('p2'), coins: 20 }),
        makePlayer({ id: PlayerId('p3'), coins: 30 }),
      ],
      tasks: [t1],
      reservations: [reserve('p1', 1), reserve('p2', 1), reserve('p3', 1)],
    });
    expect(pu(result, 'p1').activeTask?.taskId).toBe('t1');
    expect(pu(result, 'p2').needsPick).toBe(true);
    expect(pu(result, 'p3').needsPick).toBe(true);
    expect(result.events.filter((e) => e.type === 'reservation_lost')).toHaveLength(2);
  });

  it('flags a player who reserved nothing as needing to pick', () => {
    const result = run({
      turnus: { noPickPenalty: 0 },
      players: [makePlayer({ id: PlayerId('p1'), coins: 50 })],
    });
    expect(pu(result, 'p1').activeTask).toBeNull();
    expect(pu(result, 'p1').needsPick).toBe(true);
  });

  it('ignores reservations that are not for the next day', () => {
    const result = run({
      turnus: chores,
      players: [makePlayer({ id: PlayerId('p1'), coins: 50 })],
      tasks: [t1],
      reservations: [reserve('p1', 100, { day: Day(5) })],
    });
    expect(pu(result, 'p1').activeTask).toBeNull();
    expect(pu(result, 'p1').needsPick).toBe(true);
  });
});

describe('resolveRollover — pairs (step 3)', () => {
  const chores = { currentDay: Day(1), noPickPenalty: 0, nextDayCategories: ['chores'] };
  const pairTaskId = TaskId('t1');
  const pairTask = makeTask({ id: pairTaskId, category: 'chores', isPair: true });

  it('lets a pair compete with the poorer partner and win for both', () => {
    const result = run({
      turnus: chores,
      players: [
        makePlayer({ id: PlayerId('a'), name: 'Anna', coins: 80 }),
        makePlayer({ id: PlayerId('b'), name: 'Bob', coins: 20 }),
        makePlayer({ id: PlayerId('c'), name: 'Cyril', coins: 50 }),
      ],
      tasks: [pairTask],
      reservations: [
        makeReservation({
          playerId: PlayerId('a'),
          taskId: pairTaskId,
          day: Day(2),
          isPair: true,
          partnerId: PlayerId('b'),
          confirmed: true,
          createdAt: 100,
        }),
        makeReservation({
          playerId: PlayerId('c'),
          taskId: pairTaskId,
          day: Day(2),
          createdAt: 50,
        }),
      ],
    });
    // pair balance = min(80, 20) = 20 < Cyril's 50, so the pair wins despite his earlier time.
    expect(pu(result, 'a').activeTask?.taskId).toBe('t1');
    expect(pu(result, 'b').activeTask?.taskId).toBe('t1');
    expect(pu(result, 'a').activeTask?.partnerId).toBe('b');
    expect(pu(result, 'b').activeTask?.partnerId).toBe('a');
    expect(pu(result, 'c').activeTask).toBeNull();
    expect(pu(result, 'c').needsPick).toBe(true);
    const lost = result.events.find((e) => e.type === 'reservation_lost');
    expect(lost && lost.type === 'reservation_lost' ? lost.winnerName : '').toBe('Anna & Bob');
  });

  it('expires an unconfirmed pair and leaves both partners without a task', () => {
    const result = run({
      turnus: { currentDay: Day(1), noPickPenalty: 0 },
      players: [
        makePlayer({ id: PlayerId('a'), coins: 50 }),
        makePlayer({ id: PlayerId('b'), coins: 50 }),
      ],
      tasks: [pairTask],
      reservations: [
        makeReservation({
          playerId: PlayerId('a'),
          taskId: pairTaskId,
          day: Day(2),
          isPair: true,
          partnerId: PlayerId('b'),
          confirmed: false,
          createdAt: 100,
        }),
      ],
    });
    expect(pu(result, 'a').needsPick).toBe(true);
    expect(pu(result, 'a').activeTask).toBeNull();
    expect(pu(result, 'b').needsPick).toBe(true);
    expect(pu(result, 'b').activeTask).toBeNull();
    expect(result.events.filter((e) => e.type === 'pair_reservation_expired')).toHaveLength(2);
  });

  it('leaves both partners without a task when their pair loses', () => {
    const result = run({
      turnus: chores,
      players: [
        makePlayer({ id: PlayerId('z'), coins: 5 }),
        makePlayer({ id: PlayerId('a'), coins: 40 }),
        makePlayer({ id: PlayerId('b'), coins: 60 }),
      ],
      tasks: [pairTask],
      reservations: [
        makeReservation({
          playerId: PlayerId('z'),
          taskId: pairTaskId,
          day: Day(2),
          createdAt: 100,
        }),
        // initiator 'b' > partner 'a' exercises the other side of the claim-key tie-break.
        makeReservation({
          playerId: PlayerId('b'),
          taskId: pairTaskId,
          day: Day(2),
          isPair: true,
          partnerId: PlayerId('a'),
          confirmed: true,
          createdAt: 100,
        }),
      ],
    });
    expect(pu(result, 'z').activeTask?.taskId).toBe('t1');
    expect(pu(result, 'a').needsPick).toBe(true);
    expect(pu(result, 'a').activeTask).toBeNull();
    expect(pu(result, 'b').needsPick).toBe(true);
    expect(pu(result, 'b').activeTask).toBeNull();
    const lostPlayers = result.events
      .filter((e) => e.type === 'reservation_lost')
      .map((e) => (e.type === 'reservation_lost' ? e.playerId : ''));
    expect(lostPlayers).toEqual(expect.arrayContaining(['a', 'b']));
  });
});

describe('resolveRollover — advance and snapshot (steps 4–5)', () => {
  it('advances the day and applies tomorrow categories', () => {
    const result = run({
      turnus: {
        currentDay: Day(3),
        currentDayCategories: ['old'],
        nextDayCategories: ['new'],
        dayLocked: true,
      },
    });
    expect(result.turnus).toEqual({
      currentDay: 4,
      currentDayCategories: ['new'],
      dayLocked: false,
    });
  });

  it('captures a rollback snapshot of the pre-evaluation state', () => {
    const p1 = makePlayer({
      id: PlayerId('p1'),
      coins: 100,
      needsPick: false,
      activeTask: makeActiveTask({ taskId: TaskId('t1'), coinReward: 150 }),
    });
    const reservation = makeReservation({
      playerId: PlayerId('p1'),
      taskId: TaskId('t2'),
      day: Day(2),
      createdAt: 100,
    });
    const result = run({
      turnus: {
        currentDay: Day(1),
        currentDayCategories: ['a'],
        dayLocked: true,
        nextDayCategories: ['b'],
      },
      players: [p1],
      tasks: [
        makeTask({ id: TaskId('t1'), usedByPlayerIds: [] }),
        makeTask({ id: TaskId('t2'), category: 'b' }),
      ],
      reservations: [reservation],
      completed: [PlayerId('p1')],
    });
    const snap = result.rollbackSnapshot;
    expect(snap.currentDay).toBe(1);
    expect(snap.currentDayCategories).toEqual(['a']);
    expect(snap.dayLocked).toBe(true);
    expect(snap.players).toEqual([
      { playerId: 'p1', coins: 100, activeTask: p1.activeTask, needsPick: false },
    ]);
    expect(snap.tasks).toEqual([{ taskId: 't1', usedByPlayerIds: [] }]);
    expect(snap.reservations).toEqual([reservation]);
    // the round genuinely moved on, so the snapshot is what makes undo meaningful.
    expect(result.nextDay).toBe(2);
    expect(pu(result, 'p1').coins).toBe(250);
    expect(pu(result, 'p1').activeTask?.taskId).toBe('t2');
  });
});
