import { readFileSync } from 'node:fs';

import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, type Firestore, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { approvePlayer } from '../../src/data/transactions/approvePlayer';
import { bidReward } from '../../src/data/transactions/bidReward';
import { claimPlayer } from '../../src/data/transactions/claimPlayer';
import { joinTurnus } from '../../src/data/transactions/joinTurnus';
import { reserveTask } from '../../src/data/transactions/reserveTask';
import { runRollover } from '../../src/data/transactions/runRollover';
import { Day, PlayerId, RewardId, TaskId } from '../../src/domain/ids';
import type { RolloverInput } from '../../src/domain/rollover/types';
import type { ActiveTask, Player, Reward, Task } from '../../src/domain/types';

/**
 * Integration tests for the transactions layer (spec 15.10): the real transaction functions
 * run against the emulator with rules enabled, so these prove read -> domain -> write wires up
 * end to end. Reads for assertions bypass rules; the transactions themselves do not.
 */
const T = 'demo';
let env: RulesTestEnvironment;

const asDb = (uid: string): Firestore =>
  env.authenticatedContext(uid).firestore() as unknown as Firestore;

/** A single-language trilingual literal for the fixtures. */
const L = (cs: string): { cs: string; en: string; de: string } => ({ cs, en: '', de: '' });

const activeTaskFor = (taskId: string, name: string): ActiveTask => ({
  taskId: TaskId(taskId),
  name: L(name),
  description: L(''),
  difficulty: 1,
  coinReward: 150,
  partnerNames: [],
});

const turnusSettings = {
  name: 'Demo',
  slug: 'demo',
  currentDay: 1,
  archived: false,
  startingCoins: 10,
  failPenalty: 75,
  allowNegativeBalance: true,
  maxActiveRewardsPerPlayer: 1,
  maxActivePunishesPerPlayer: 1,
  noPickPenalty: 100,
  dayLocked: false,
  nextDayCategories: ['c'],
  currentDayCategories: ['c'],
};

beforeAll(async () => {
  vi.stubGlobal('navigator', { onLine: true });
  env = await initializeTestEnvironment({
    projectId: 'demo-tabor',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await env.cleanup();
  vi.unstubAllGlobals();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const put = (suffix: string, data: Record<string, unknown>): Promise<void> =>
      setDoc(doc(db, `turnuses/${T}/${suffix}`), data);

    await setDoc(doc(db, `turnuses/${T}`), turnusSettings);
    await put('private/config', { playerCode: 'PLAY01', adminCode: 'ADMIN1' });
    await put('members/admin', { role: 'admin' });
    await put('members/alice', { role: 'player' });
    await put('members/dan', { role: 'player' });
    await put('members/eve', { role: 'player' });

    const player = (over: Record<string, unknown>): Record<string, unknown> => ({
      name: 'X',
      coins: 100,
      status: 'approved',
      ownerUids: [],
      needsPick: false,
      activeTask: null,
      createdByUid: 'admin',
      ...over,
    });
    await put('players/p1', player({ name: 'A', activeTask: activeTaskFor('t1', 'Task 1') }));
    await put('players/p2', player({ name: 'B', activeTask: activeTaskFor('t2', 'Task 2') }));
    await put('players/free', player({ name: 'Free', coins: 0, needsPick: true }));
    await put('players/pending', player({ name: 'Pending', status: 'pending', coins: 0 }));
    // Recovery PINs — every claim (even the first) is verified against these.
    await put('players/free/private/auth', { recoveryPin: '1234' });
    await put('players/p1/private/auth', { recoveryPin: '1234' });
    await put('players/p2/private/auth', { recoveryPin: '1234' });
    await put('ownerIndex/alice', { playerId: 'p1' });

    const task = (over: Record<string, unknown>): Record<string, unknown> => ({
      name: L('T'),
      description: L(''),
      categories: [L('c')],
      difficulty: 1,
      minPlayers: 1,
      maxPlayers: 1,
      coinReward: 150,
      usedByPlayerIds: [],
      active: true,
      manualCoins: false,
      ...over,
    });
    await put('tasks/t1', task({ name: L('Task 1') }));
    await put('tasks/t2', task({ name: L('Task 2') }));
    await put('tasks/t3', task({ name: L('Task 3') }));

    const reward = (over: Record<string, unknown>): Record<string, unknown> => ({
      name: L('R'),
      description: L(''),
      categories: [L('c')],
      price: 40,
      form: 'reward',
      minTargets: 0,
      maxTargets: 0,
      exclusivePerDay: false,
      active: true,
      ...over,
    });
    await put('rewards/r1', reward({ name: L('Reward 1') }));
  });
});

const read = async (suffix: string): Promise<Record<string, unknown> | undefined> => {
  let data: Record<string, unknown> | undefined;
  await env.withSecurityRulesDisabled(async (ctx) => {
    const snap = await getDoc(doc(ctx.firestore(), `turnuses/${T}/${suffix}`));
    data = snap.data() as Record<string, unknown> | undefined;
  });
  return data;
};

const readTurnus = async (): Promise<Record<string, unknown> | undefined> => {
  let data: Record<string, unknown> | undefined;
  await env.withSecurityRulesDisabled(async (ctx) => {
    const snap = await getDoc(doc(ctx.firestore(), `turnuses/${T}`));
    data = snap.data() as Record<string, unknown> | undefined;
  });
  return data;
};

describe('joinTurnus', () => {
  it('joins with the correct player code and writes member + role', async () => {
    const result = await joinTurnus(asDb('newbie'), T, 'newbie', 'PLAY01');
    expect(result).toEqual({ ok: true, value: 'player' });
    expect((await read('roles/newbie'))?.role).toBe('player');
  });

  it('promotes to admin with the admin code', async () => {
    const result = await joinTurnus(asDb('boss'), T, 'boss', 'ADMIN1');
    expect(result).toEqual({ ok: true, value: 'admin' });
  });

  it('rejects a wrong code', async () => {
    const result = await joinTurnus(asDb('newbie'), T, 'newbie', 'NOPE99');
    expect(result).toEqual({ ok: false, error: { code: 'INVALID_CODE' } });
  });
});

describe('claimPlayer', () => {
  it('claims a character with the right PIN and writes the owner index', async () => {
    const result = await claimPlayer(asDb('dan'), T, 'free', 'dan', '1234');
    expect(result.ok).toBe(true);
    expect((await read('players/free'))?.ownerUids).toEqual(['dan']);
    expect((await read('ownerIndex/dan'))?.playerId).toBe('free');
  });

  it('refuses a wrong PIN, even on a free character', async () => {
    const result = await claimPlayer(asDb('eve'), T, 'free', 'eve', '9999');
    expect(result).toEqual({ ok: false, error: { code: 'PLAYER_ALREADY_CLAIMED' } });
    expect((await read('players/free'))?.ownerUids).toEqual([]);
  });

  it('releases the previous character when claiming a new one', async () => {
    await claimPlayer(asDb('dan'), T, 'free', 'dan', '1234');
    const result = await claimPlayer(asDb('dan'), T, 'p2', 'dan', '1234');
    expect(result.ok).toBe(true);
    expect((await read('players/p2'))?.ownerUids).toEqual(['dan']);
    expect((await read('players/free'))?.ownerUids).toEqual([]);
    expect((await read('ownerIndex/dan'))?.playerId).toBe('p2');
  });
});

describe('admin actions', () => {
  it('approves a pending player with starting coins', async () => {
    const result = await approvePlayer(asDb('admin'), T, 'pending');
    expect(result.ok).toBe(true);
    const player = await read('players/pending');
    expect(player?.status).toBe('approved');
    expect(player?.coins).toBe(10);
    expect(player?.needsPick).toBe(true);
  });
});

describe('reserveTask', () => {
  it('creates a reservation for tomorrow and bumps the interest count', async () => {
    const result = await reserveTask(asDb('alice'), T, 'p1', 't3');
    expect(result.ok).toBe(true);
    const reservation = await read('reservations/p1');
    expect(reservation?.taskId).toBe('t3');
    expect(reservation?.day).toBe(2);
    const counts = await read('reservationCounts/2');
    expect((counts?.counts as Record<string, number>).t3).toBe(1);
  });
});

describe('bidReward', () => {
  it('places a sealed bid for the current day and bumps the interest count', async () => {
    const result = await bidReward(asDb('alice'), T, 'p1', 'r1', 70);
    expect(result.ok).toBe(true);
    const bid = await read('rewardBids/p1');
    expect(bid?.rewardId).toBe('r1');
    expect(bid?.amount).toBe(70);
    const counts = await read('rewardBidCounts/1');
    expect((counts?.counts as Record<string, number>).r1).toBe(1);
  });

  it('refuses a bid below the reward price', async () => {
    const result = await bidReward(asDb('alice'), T, 'p1', 'r1', 10);
    expect(result).toEqual({ ok: false, error: { code: 'BID_BELOW_MINIMUM', min: 40 } });
    expect(await read('rewardBids/p1')).toBeUndefined();
  });
});

describe('runRollover', () => {
  const player = (id: string, activeTask: ActiveTask): Player => ({
    id: PlayerId(id),
    name: id,
    coins: 100,
    status: 'approved',
    ownerUids: [],
    needsPick: false,
    activeTask,
  });
  const task = (id: string): Task => ({
    id: TaskId(id),
    name: L(id),
    description: L(''),
    categories: [L('c')],
    difficulty: 1,
    minPlayers: 1,
    maxPlayers: 1,
    coinReward: 150,
    usedByPlayerIds: [],
    active: true,
  });
  const input = (): RolloverInput => ({
    turnus: {
      currentDay: Day(1),
      startingCoins: 10,
      failPenalty: 75,
      allowNegativeBalance: true,
      maxActiveRewardsPerPlayer: 1,
      maxActivePunishesPerPlayer: 1,
      noPickPenalty: 100,
      nextDayCategories: [],
      currentDayCategories: ['c'],
      dayLocked: false,
    },
    players: [
      player('p1', activeTaskFor('t1', 'Task 1')),
      player('p2', activeTaskFor('t2', 'Task 2')),
    ],
    tasks: [task('t1'), task('t2')],
    reservations: [],
    rewards: [],
    rewardBids: [],
    completedPlayerIds: new Set([PlayerId('p1')]),
  });
  const auctionReward: Reward = {
    id: RewardId('r1'),
    name: L('Reward 1'),
    description: L(''),
    categories: [L('c')],
    price: 40,
    form: 'reward',
    minTargets: 0,
    maxTargets: 0,
    exclusivePerDay: false,
    active: true,
  };

  it('settles the day and advances the round', async () => {
    const rolled = await runRollover(asDb('admin'), T, input());
    expect(rolled.ok).toBe(true);

    expect((await read('players/p1'))?.coins).toBe(250); // completed: +150
    expect((await read('players/p2'))?.coins).toBe(25); // failed: -75
    expect((await read('players/p1'))?.activeTask).toBeNull();
    expect((await read('players/p1'))?.needsPick).toBe(true);
    expect((await readTurnus())?.currentDay).toBe(2);
  });

  it('resolves the reward auction: charges the winner and consumes the bid', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `turnuses/${T}/rewardBids/p1`), {
        day: 1,
        rewardId: 'r1',
        amount: 60,
        createdAt: Timestamp.fromMillis(1000),
      });
    });
    const auctionInput: RolloverInput = {
      ...input(),
      rewards: [auctionReward],
      rewardBids: [
        {
          playerId: PlayerId('p1'),
          day: Day(1),
          rewardId: RewardId('r1'),
          amount: 60,
          targetIds: [],
          createdAt: 1000,
        },
      ],
    };

    const rolled = await runRollover(asDb('admin'), T, auctionInput);
    expect(rolled.ok).toBe(true);
    // p1 completes t1 (+150 => 250), then wins r1 (−60 => 190).
    expect((await read('players/p1'))?.coins).toBe(190);
    expect(await read('rewardBids/p1')).toBeUndefined();
    // The win is recorded as an owned-reward purchase (id = `${day}_${rewardId}`).
    const purchase = await read('purchases/1_r1');
    expect(purchase?.buyerId).toBe('p1');
    expect(purchase?.price).toBe(60);
    expect(purchase?.form).toBe('reward');
  });
});
