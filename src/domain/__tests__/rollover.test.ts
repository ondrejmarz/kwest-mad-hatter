import { describe, expect, it } from 'vitest';

import { Day, PlayerId, RewardId, TaskId } from '../ids';
import type { LedgerEntry } from '../ledger';
import { resolveRollover } from '../rollover';
import type { PlayerUpdate, RolloverResult } from '../rollover';
import type { Player, Reservation, Reward, RewardBid, Task, TurnusSettings } from '../types';

import {
  loc,
  makeActiveTask,
  makePlayer,
  makeReservation,
  makeReward,
  makeRewardBid,
  makeTask,
  makeTurnus,
} from './fixtures';

interface RunInput {
  readonly turnus?: Partial<TurnusSettings>;
  readonly players?: readonly Player[];
  readonly tasks?: readonly Task[];
  readonly reservations?: readonly Reservation[];
  readonly rewards?: readonly Reward[];
  readonly rewardBids?: readonly RewardBid[];
  readonly completed?: readonly PlayerId[];
}

function run(input: RunInput): RolloverResult {
  return resolveRollover({
    turnus: makeTurnus(input.turnus),
    players: input.players ?? [],
    tasks: input.tasks ?? [],
    reservations: input.reservations ?? [],
    rewards: input.rewards ?? [],
    rewardBids: input.rewardBids ?? [],
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
    expect(result.turnus).toEqual({
      currentDay: 2,
      currentDayCategories: [],
      nextDayCategories: [],
      dayLocked: false,
    });
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
    expect(result.preview.settlements.every((s) => s.outcome === 'completed')).toBe(true);
  });

  it('penalizes a failed task and still marks it used', () => {
    const p1 = makePlayer({
      id: PlayerId('p1'),
      coins: 100,
      activeTask: makeActiveTask({ taskId: TaskId('t1') }),
    });
    const result = run({
      players: [p1],
      tasks: [makeTask({ id: TaskId('t1'), usedByPlayerIds: [] })],
      completed: [],
    });
    expect(pu(result, 'p1').coins).toBe(25);
    expect(result.preview.settlements.find((s) => s.playerId === 'p1')?.outcome).toBe('failed');
    expect(result.taskUpdates.find((t) => t.taskId === 't1')?.usedByPlayerIds).toContain('p1');
  });

  it('lets a failed balance go negative, or floors it to zero when configured', () => {
    const failing = (): Player =>
      makePlayer({
        id: PlayerId('p1'),
        coins: 20,
        activeTask: makeActiveTask({ taskId: TaskId('t1') }),
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
    expect(result.preview.settlements.find((s) => s.playerId === 'p1')?.outcome).toBe('no_task');
  });

  it('ignores players who are not approved', () => {
    const pending = makePlayer({ id: PlayerId('p9'), status: 'pending', coins: 999 });
    const approved = makePlayer({ id: PlayerId('p1'), coins: 50, activeTask: null });
    const result = run({ turnus: { noPickPenalty: 0 }, players: [pending, approved] });
    expect(result.playerUpdates.map((u) => u.playerId)).toEqual(['p1']);
  });

  it('marks a group task used by all members', () => {
    const groupTask = (partner: string) =>
      makeActiveTask({ taskId: TaskId('t1'), partnerNames: [partner] });
    const a = makePlayer({ id: PlayerId('a'), activeTask: groupTask('b') });
    const b = makePlayer({ id: PlayerId('b'), activeTask: groupTask('a') });
    const result = run({
      players: [a, b],
      tasks: [makeTask({ id: TaskId('t1'), minPlayers: 2, maxPlayers: 2 })],
      completed: [PlayerId('a'), PlayerId('b')],
    });
    const used = result.taskUpdates.find((t) => t.taskId === 't1')?.usedByPlayerIds;
    expect(used).toEqual(expect.arrayContaining(['a', 'b']));
    expect(used).toHaveLength(2);
  });
});

describe('resolveRollover — reservations (step 3)', () => {
  const chores = { currentDay: Day(1), noPickPenalty: 0, nextDayCategories: ['chores'] };
  const t1 = makeTask({ id: TaskId('t1'), categories: [loc('chores')] });
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
    expect(result.preview.losses.some((l) => l.playerId === 'p2')).toBe(true);
  });

  it('ranks on post-settlement coins, not yesterday — reversing the steps would flip the winner', () => {
    const p1 = makePlayer({
      id: PlayerId('p1'),
      coins: 100,
      activeTask: makeActiveTask({ taskId: TaskId('a') }),
    });
    const p2 = makePlayer({
      id: PlayerId('p2'),
      coins: 50,
      activeTask: makeActiveTask({ taskId: TaskId('b'), coinReward: 100 }),
    });
    const result = run({
      turnus: { ...chores, failPenalty: 80 },
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
    expect(result.preview.losses).toHaveLength(2);
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

describe('resolveRollover — groups and pairs (step 3)', () => {
  const chores = { currentDay: Day(1), noPickPenalty: 0, nextDayCategories: ['chores'] };
  const groupTaskId = TaskId('g1');
  // A 2–3 group task: reserved individually, pooled at evaluation (no invites).
  const groupTask = makeTask({
    id: groupTaskId,
    categories: [loc('chores')],
    minPlayers: 2,
    maxPlayers: 3,
  });
  const reserveGroup = (playerId: string, createdAt = 100): Reservation =>
    makeReservation({
      playerId: PlayerId(playerId),
      taskId: groupTaskId,
      day: Day(2),
      minPlayers: 2,
      maxPlayers: 3,
      createdAt,
    });

  it('gives a pooled group task to every reserver within the bounds', () => {
    const result = run({
      turnus: chores,
      players: [
        makePlayer({ id: PlayerId('a'), name: 'Anna', coins: 50 }),
        makePlayer({ id: PlayerId('b'), name: 'Bob', coins: 30 }),
      ],
      tasks: [groupTask],
      reservations: [reserveGroup('a'), reserveGroup('b')],
    });
    expect(pu(result, 'a').activeTask?.taskId).toBe('g1');
    expect(pu(result, 'b').activeTask?.taskId).toBe('g1');
    expect(pu(result, 'a').activeTask?.partnerNames).toEqual(['Bob']);
  });

  it('expires a pooled group below its lower bound', () => {
    const result = run({
      turnus: chores,
      players: [makePlayer({ id: PlayerId('a'), coins: 50 })],
      tasks: [groupTask],
      reservations: [reserveGroup('a')],
    });
    expect(pu(result, 'a').activeTask).toBeNull();
    expect(pu(result, 'a').needsPick).toBe(true);
  });

  it('drops the richest over the upper bound so the poorest fill the seats', () => {
    const result = run({
      turnus: chores,
      players: [
        makePlayer({ id: PlayerId('a'), name: 'Anna', coins: 80 }),
        makePlayer({ id: PlayerId('b'), name: 'Bob', coins: 20 }),
        makePlayer({ id: PlayerId('c'), name: 'Cyril', coins: 50 }),
        makePlayer({ id: PlayerId('d'), name: 'Dana', coins: 10 }),
      ],
      tasks: [groupTask],
      reservations: [reserveGroup('a'), reserveGroup('b'), reserveGroup('c'), reserveGroup('d')],
    });
    // 4 reservers, max 3 → the richest (Anna, 80) is dropped; the poorest three get it.
    expect(pu(result, 'a').activeTask).toBeNull();
    expect(pu(result, 'a').needsPick).toBe(true);
    expect(pu(result, 'b').activeTask?.taskId).toBe('g1');
    expect(pu(result, 'c').activeTask?.taskId).toBe('g1');
    expect(pu(result, 'd').activeTask?.taskId).toBe('g1');
  });

  const pairTask = makeTask({
    id: TaskId('p1'),
    categories: [loc('chores')],
    minPlayers: 2,
    maxPlayers: 2,
  });
  const pairReservation = (responses: Record<string, 'accepted' | 'declined'>): Reservation =>
    makeReservation({
      playerId: PlayerId('a'),
      taskId: TaskId('p1'),
      day: Day(2),
      minPlayers: 2,
      maxPlayers: 2,
      invitees: [PlayerId('b')],
      responses,
      createdAt: 100,
    });

  it('still lets a pair reserve together via an accepted invite', () => {
    const result = run({
      turnus: chores,
      players: [
        makePlayer({ id: PlayerId('a'), name: 'Anna', coins: 40 }),
        makePlayer({ id: PlayerId('b'), name: 'Bob', coins: 60 }),
      ],
      tasks: [pairTask],
      reservations: [pairReservation({ b: 'accepted' })],
    });
    expect(pu(result, 'a').activeTask?.taskId).toBe('p1');
    expect(pu(result, 'b').activeTask?.taskId).toBe('p1');
    expect(pu(result, 'b').activeTask?.partnerNames).toEqual(['Anna']);
  });

  it('expires a pair whose invitee never accepted', () => {
    const result = run({
      turnus: chores,
      players: [
        makePlayer({ id: PlayerId('a'), coins: 50 }),
        makePlayer({ id: PlayerId('b'), coins: 50 }),
      ],
      tasks: [pairTask],
      reservations: [pairReservation({})],
    });
    expect(pu(result, 'a').activeTask).toBeNull();
    expect(pu(result, 'a').needsPick).toBe(true);
  });
});

describe('resolveRollover — reward auctions (step 2)', () => {
  it('charges the winner, reports it in the preview, and snapshots the bids', () => {
    const result = run({
      turnus: { currentDay: Day(1), noPickPenalty: 0 },
      players: [makePlayer({ id: PlayerId('p1'), name: 'Jana', coins: 100 })],
      rewards: [makeReward({ id: RewardId('r1'), name: loc('Extra dessert'), price: 40 })],
      rewardBids: [
        makeRewardBid({
          playerId: PlayerId('p1'),
          rewardId: RewardId('r1'),
          amount: 60,
          day: Day(1),
        }),
      ],
    });
    expect(pu(result, 'p1').coins).toBe(40); // 100 − 60
    expect(result.preview.auctions).toEqual([
      { rewardId: 'r1', rewardName: loc('Extra dessert'), winnerName: 'Jana', amount: 60 },
    ]);
    // The win becomes an owned-reward Purchase (price = what they paid).
    expect(result.purchases).toEqual([
      {
        id: '1_r1',
        day: 1,
        buyerId: 'p1',
        buyerName: 'Jana',
        rewardId: 'r1',
        rewardName: loc('Extra dessert'),
        description: loc(''),
        price: 60,
        form: 'reward',
        targetIds: [],
        targetNames: [],
        refunded: false,
      },
    ]);
  });

  it('creates no purchases when the auction has no winners', () => {
    const result = run({ turnus: { currentDay: Day(1), noPickPenalty: 0 } });
    expect(result.purchases).toEqual([]);
  });

  it('records the punishment targets on a won punish_someone purchase', () => {
    const result = run({
      turnus: { currentDay: Day(1), noPickPenalty: 0, maxActivePunishesPerPlayer: 1 },
      players: [
        makePlayer({ id: PlayerId('p1'), name: 'Jana', coins: 100 }),
        makePlayer({ id: PlayerId('p2'), name: 'Bob', coins: 100 }),
      ],
      rewards: [
        makeReward({
          id: RewardId('r1'),
          form: 'punish_someone',
          minTargets: 1,
          maxTargets: 1,
          price: 10,
        }),
      ],
      rewardBids: [
        makeRewardBid({
          playerId: PlayerId('p1'),
          rewardId: RewardId('r1'),
          amount: 30,
          day: Day(1),
          targetIds: [PlayerId('p2')],
        }),
      ],
    });
    const purchase = result.purchases.find((p) => p.rewardId === 'r1');
    expect(purchase?.form).toBe('punish_someone');
    expect(purchase?.targetIds).toEqual(['p2']);
    expect(purchase?.targetNames).toEqual(['Bob']);
  });
});

describe('resolveRollover — advance the round (step 4)', () => {
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
      nextDayCategories: [],
      dayLocked: false,
    });
  });

  it('settles a completed task and assigns the reserved task for tomorrow', () => {
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
        makeTask({ id: TaskId('t2'), categories: [loc('b')] }),
      ],
      reservations: [reservation],
      completed: [PlayerId('p1')],
    });
    expect(result.nextDay).toBe(2);
    expect(pu(result, 'p1').coins).toBe(250);
    expect(pu(result, 'p1').activeTask?.taskId).toBe('t2');
  });
});

describe('resolveRollover — coin-history ledger (spec 9.1)', () => {
  it('appends a task entry per active player and a reward entry per auction win', () => {
    const result = run({
      turnus: { currentDay: Day(1) }, // fixture defaults: failPenalty 75, noPickPenalty 100
      players: [
        makePlayer({
          id: PlayerId('p1'),
          coins: 300,
          activeTask: makeActiveTask({ taskId: TaskId('t1'), coinReward: 150 }),
        }),
        makePlayer({
          id: PlayerId('p2'),
          coins: 300,
          activeTask: makeActiveTask({ taskId: TaskId('t2'), coinReward: 120 }),
        }),
        makePlayer({ id: PlayerId('p3'), coins: 300, needsPick: true, activeTask: null }),
      ],
      tasks: [makeTask({ id: TaskId('t1'), name: loc('Nádobí') }), makeTask({ id: TaskId('t2') })],
      rewards: [makeReward({ id: RewardId('r1'), name: loc('Dezert'), price: 40 })],
      rewardBids: [
        makeRewardBid({
          playerId: PlayerId('p1'),
          rewardId: RewardId('r1'),
          amount: 60,
          day: Day(1),
        }),
      ],
      completed: [PlayerId('p1')],
    });

    const entryFor = (playerId: string, kind: string): LedgerEntry | undefined =>
      result.ledger.find((append) => append.playerId === playerId && append.entry.kind === kind)
        ?.entry;

    // The task name comes from the catalog task, not the player's activeTask snapshot.
    expect(entryFor('p1', 'task')).toMatchObject({
      delta: 150,
      outcome: 'completed',
      taskName: loc('Nádobí'),
      day: 1,
    });
    expect(entryFor('p2', 'task')).toMatchObject({ delta: -75, outcome: 'failed' });
    expect(entryFor('p3', 'task')).toMatchObject({
      delta: -100,
      outcome: 'no_task',
      taskName: loc(''),
    });
    expect(entryFor('p1', 'reward')).toMatchObject({
      delta: -60,
      form: 'reward',
      rewardName: loc('Dezert'),
    });

    // Task entries precede reward entries, so a sorted history reads earn-then-spend.
    const kinds = result.ledger.map((append) => append.entry.kind);
    expect(kinds.indexOf('task')).toBeLessThan(kinds.indexOf('reward'));
  });

  it('records no entry for a no-pick when the penalty is zero (nothing moved)', () => {
    const result = run({
      turnus: { currentDay: Day(1), noPickPenalty: 0 },
      players: [makePlayer({ id: PlayerId('p1'), coins: 100, needsPick: true, activeTask: null })],
    });
    expect(result.ledger).toEqual([]);
  });
});
