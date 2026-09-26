import { readFileSync } from 'node:fs';

import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  type Firestore,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { acceptPairPick } from '../../src/data/transactions/acceptPairPick';
import { adjustCoins } from '../../src/data/transactions/adjustCoins';
import { approvePlayer } from '../../src/data/transactions/approvePlayer';
import { bidReward } from '../../src/data/transactions/bidReward';
import { cancelReservation } from '../../src/data/transactions/cancelReservation';
import { claimPlayer } from '../../src/data/transactions/claimPlayer';
import { declinePairPick } from '../../src/data/transactions/declinePairPick';
import { initiatePairPick } from '../../src/data/transactions/initiatePairPick';
import { joinTurnus } from '../../src/data/transactions/joinTurnus';
import { pickTaskNow } from '../../src/data/transactions/pickTaskNow';
import { reserveTask } from '../../src/data/transactions/reserveTask';
import { respondToInvite } from '../../src/data/transactions/respondToInvite';
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
  partnerIds: [],
  partnerNames: [],
});

/** One member's side of a pair task: the same task, the other member as the single partner. */
const pairTaskWith = (taskId: string, partnerId: string, partnerName: string): ActiveTask => ({
  ...activeTaskFor(taskId, taskId),
  partnerIds: [PlayerId(partnerId)],
  partnerNames: [partnerName],
});

/** A pair reservation for day 2 under its initiator, as the fixtures seed it (rules disabled). */
const pairReservation = (
  initiator: string,
  taskId: string,
  invitee: string,
  responses: Record<string, string> = {},
): Record<string, unknown> => ({
  playerId: initiator,
  day: 2,
  taskId,
  taskName: L(taskId),
  minPlayers: 2,
  maxPlayers: 2,
  invitees: [invitee],
  responses,
  createdAt: Timestamp.now(),
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
    await put('rewards/r2', reward({ name: L('Reward 2') }));
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

const readCollection = async (suffix: string): Promise<Record<string, unknown>[]> => {
  let rows: Record<string, unknown>[] = [];
  await env.withSecurityRulesDisabled(async (ctx) => {
    const snap = await getDocs(collection(ctx.firestore(), `turnuses/${T}/${suffix}`));
    rows = snap.docs.map((docSnap) => docSnap.data() as Record<string, unknown>);
  });
  return rows;
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

describe('respondToInvite', () => {
  // p1 (owned by alice) is already doing task t1; an invite to t1 must not let them join it again.
  const inviteP1ToTask1 = (): Promise<void> =>
    env.withSecurityRulesDisabled((ctx) =>
      setDoc(doc(ctx.firestore(), `turnuses/${T}/reservations/p2`), {
        playerId: 'p2',
        day: 2,
        taskId: 't1',
        taskName: L('Task 1'),
        minPlayers: 2,
        maxPlayers: 2,
        invitees: ['p1'],
        responses: {},
        createdAt: Timestamp.now(),
      }),
    );

  it('refuses to accept an invite to a task the invitee is already doing', async () => {
    await inviteP1ToTask1();
    const result = await respondToInvite(asDb('alice'), T, 'p2', PlayerId('p1'), true);
    expect(result).toEqual({ ok: false, error: { code: 'TASK_ALREADY_USED_BY_PLAYER' } });
    expect((await read('reservations/p2'))?.responses).toEqual({});
  });

  it('still lets the invitee decline that invite', async () => {
    await inviteP1ToTask1();
    const result = await respondToInvite(asDb('alice'), T, 'p2', PlayerId('p1'), false);
    expect(result.ok).toBe(true);
    expect((await read('reservations/p2'))?.responses).toEqual({ p1: 'declined' });
  });

  // Accepting a second pair must break the first: p1 has already accepted free's pair on t3; when p1
  // accepts p2's pair on t2, free's pair is cancelled for both of its members — a pair is done
  // together or not at all — so p1 is never committed to two pairs at once (spec 7).
  it('cancels every other accepted pair when the invitee accepts a new one', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      const put = (suffix: string, data: Record<string, unknown>): Promise<void> =>
        setDoc(doc(db, `turnuses/${T}/${suffix}`), data);
      await put('reservations/free', pairReservation('free', 't3', 'p1', { p1: 'accepted' }));
      await put('reservations/p2', pairReservation('p2', 't2', 'p1'));
      await put('reservationCounts/2', {
        counts: { t3: 1, t2: 1 },
        players: { free: true, p1: true, p2: true },
      });
    });

    const result = await respondToInvite(asDb('alice'), T, 'p2', PlayerId('p1'), true, [
      PlayerId('free'),
    ]);
    expect(result.ok).toBe(true);
    expect((await read('reservations/p2'))?.responses).toEqual({ p1: 'accepted' });
    expect(await read('reservations/free')).toBeUndefined();
    const counts = await read('reservationCounts/2');
    expect(counts?.counts).toMatchObject({ t3: 0, t2: 1 });
    expect(counts?.players).toMatchObject({ free: false, p1: true, p2: true });
  });
});

describe('a pair is cancelled for both', () => {
  // p1 (alice) accepted p2's pair on t2 for the next round.
  const seedAcceptedPair = (): Promise<void> =>
    env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(
        doc(db, `turnuses/${T}/reservations/p2`),
        pairReservation('p2', 't2', 'p1', { p1: 'accepted' }),
      );
      await setDoc(doc(db, `turnuses/${T}/reservationCounts/2`), {
        counts: { t2: 1 },
        players: { p1: true, p2: true },
      });
    });

  it('lets the accepted partner cancel the pair reservation for both members', async () => {
    await seedAcceptedPair();
    const result = await cancelReservation(asDb('alice'), T, 'p2', PlayerId('p1'));
    expect(result.ok).toBe(true);
    expect(await read('reservations/p2')).toBeUndefined();
    const counts = await read('reservationCounts/2');
    expect(counts?.counts).toMatchObject({ t2: 0 });
    expect(counts?.players).toMatchObject({ p1: false, p2: false });
  });

  it('refuses an invitee who has not accepted', async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      setDoc(
        doc(ctx.firestore(), `turnuses/${T}/reservations/p2`),
        pairReservation('p2', 't2', 'p1'),
      ),
    );
    const result = await cancelReservation(asDb('alice'), T, 'p2', PlayerId('p1'));
    expect(result).toEqual({ ok: false, error: { code: 'NOT_RESERVATION_MEMBER' } });
    expect(await read('reservations/p2')).toBeDefined();
  });

  it('cancels the pair for both when the partner reserves something else', async () => {
    await seedAcceptedPair();
    const result = await reserveTask(asDb('alice'), T, 'p1', 't3', [], [PlayerId('p2')]);
    expect(result.ok).toBe(true);
    expect(await read('reservations/p2')).toBeUndefined();
    expect((await read('reservations/p1'))?.taskId).toBe('t3');
    const counts = await read('reservationCounts/2');
    expect(counts?.counts).toMatchObject({ t2: 0, t3: 1 });
    expect(counts?.players).toMatchObject({ p1: true, p2: false });
  });

  it('takes the pair from the partner when the initiator replaces it', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(
        doc(db, `turnuses/${T}/reservations/p1`),
        pairReservation('p1', 't2', 'p2', { p2: 'accepted' }),
      );
      await setDoc(doc(db, `turnuses/${T}/reservationCounts/2`), {
        counts: { t2: 1 },
        players: { p1: true, p2: true },
      });
    });
    const result = await reserveTask(asDb('alice'), T, 'p1', 't3');
    expect(result.ok).toBe(true);
    expect((await read('reservations/p1'))?.invitees).toEqual([]);
    const counts = await read('reservationCounts/2');
    expect(counts?.counts).toMatchObject({ t2: 0, t3: 1 });
    expect(counts?.players).toMatchObject({ p1: true, p2: false });
  });

  // p1 (alice) and p2 do pair task tp together in the current round.
  const seedPairToday = (): Promise<void> =>
    env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      const pairTask = {
        name: L('Pair'),
        description: L(''),
        categories: [L('c')],
        difficulty: 1,
        minPlayers: 2,
        maxPlayers: 2,
        coinReward: 150,
        usedByPlayerIds: [],
        active: true,
        manualCoins: false,
      };
      await setDoc(doc(db, `turnuses/${T}/tasks/tp`), pairTask);
      await setDoc(doc(db, `turnuses/${T}/tasks/tq`), pairTask);
      await setDoc(
        doc(db, `turnuses/${T}/players/p1`),
        { activeTask: pairTaskWith('tp', 'p2', 'B') },
        { merge: true },
      );
      await setDoc(
        doc(db, `turnuses/${T}/players/p2`),
        { activeTask: pairTaskWith('tp', 'p1', 'A') },
        { merge: true },
      );
    });

  it('releases the partner when a member switches away from their pair task', async () => {
    await seedPairToday();
    const result = await pickTaskNow(asDb('alice'), T, 'p1', 't3');
    expect(result.ok).toBe(true);
    expect((await read('players/p1'))?.activeTask).toMatchObject({ taskId: 't3' });
    expect((await read('players/p2'))?.activeTask).toBeNull();
    expect((await read('players/p2'))?.needsPick).toBe(true);
  });

  it('releases the old partner when a member joins another same-round pair', async () => {
    await seedPairToday();
    await env.withSecurityRulesDisabled((ctx) =>
      setDoc(doc(ctx.firestore(), `turnuses/${T}/taskClaims/1_tq`), {
        day: 1,
        taskId: 'tq',
        playerId: 'free',
        invitee: 'p1',
        accepted: false,
        createdAt: Timestamp.now(),
      }),
    );
    const result = await acceptPairPick(asDb('alice'), T, 'tq', PlayerId('p1'));
    expect(result.ok).toBe(true);
    expect((await read('players/p1'))?.activeTask).toMatchObject({
      taskId: 'tq',
      partnerIds: ['free'],
    });
    expect((await read('players/free'))?.activeTask).toMatchObject({
      taskId: 'tq',
      partnerIds: ['p1'],
    });
    expect((await read('players/p2'))?.activeTask).toBeNull();
  });
});

describe('switching tasks mid-round', () => {
  const pairTaskDoc = {
    name: L('Pair'),
    description: L(''),
    categories: [L('c')],
    difficulty: 1,
    minPlayers: 2,
    maxPlayers: 2,
    coinReward: 150,
    usedByPlayerIds: [],
    active: true,
    manualCoins: false,
  };
  // Merges into a turnus doc (`''` is the turnus itself), bypassing the rules.
  const seed = (suffix: string, data: Record<string, unknown>): Promise<void> =>
    env.withSecurityRulesDisabled((ctx) =>
      setDoc(
        doc(ctx.firestore(), suffix === '' ? `turnuses/${T}` : `turnuses/${T}/${suffix}`),
        data,
        { merge: true },
      ),
    );
  // free (owned by dan) invites p1 (alice) to pair task tq for the current round.
  const seedPairInvite = async (): Promise<void> => {
    await seed('tasks/tq', pairTaskDoc);
    await seed('taskClaims/1_tq', {
      day: 1,
      taskId: 'tq',
      playerId: 'free',
      invitee: 'p1',
      accepted: false,
      createdAt: Timestamp.now(),
    });
  };

  it('refuses to swap a held task when the turnus turns switching off', async () => {
    await seed('', { allowTaskSwitch: false });
    const result = await pickTaskNow(asDb('alice'), T, 'p1', 't3');
    expect(result).toEqual({ ok: false, error: { code: 'TASK_SWITCH_DISABLED' } });
    expect((await read('players/p1'))?.activeTask).toMatchObject({ taskId: 't1' });
  });

  it('still lets a player without a task take one when switching is off', async () => {
    await seed('', { allowTaskSwitch: false });
    await seed('ownerIndex/dan', { playerId: 'free' });
    const result = await pickTaskNow(asDb('dan'), T, 'free', 't3');
    expect(result.ok).toBe(true);
    expect((await read('players/free'))?.activeTask).toMatchObject({ taskId: 't3' });
  });

  it('refuses to join a same-round pair over a held task when switching is off', async () => {
    await seed('', { allowTaskSwitch: false });
    await seedPairInvite();
    const result = await acceptPairPick(asDb('alice'), T, 'tq', PlayerId('p1'));
    expect(result).toEqual({ ok: false, error: { code: 'TASK_SWITCH_DISABLED' } });
    expect((await read('taskClaims/1_tq'))?.accepted).toBe(false);
  });

  // free took solo t3 first-come, then invited p1 to tq; accepting moves free off t3, so its claim
  // must go too — otherwise t3 stays locked for everyone although nobody holds it any more.
  it("releases the initiator's old claim when their same-round pair is accepted", async () => {
    await seedPairInvite();
    await seed('players/free', { activeTask: activeTaskFor('t3', 'Task 3'), needsPick: false });
    await seed('taskClaims/1_t3', {
      day: 1,
      taskId: 't3',
      playerId: 'free',
      createdAt: Timestamp.now(),
    });
    const result = await acceptPairPick(asDb('alice'), T, 'tq', PlayerId('p1'));
    expect(result.ok).toBe(true);
    expect((await read('players/free'))?.activeTask).toMatchObject({ taskId: 'tq' });
    expect(await read('taskClaims/1_t3')).toBeUndefined();
  });

  // Declining keeps the claim, so the initiator sees the answer, but the task is free again at once.
  it('keeps a declined same-round invite visible and frees its task', async () => {
    await seedPairInvite();
    expect((await declinePairPick(asDb('alice'), T, 'tq', 1)).ok).toBe(true);
    expect(await read('taskClaims/1_tq')).toMatchObject({
      playerId: 'free',
      invitee: 'p1',
      declined: true,
    });
    expect((await acceptPairPick(asDb('alice'), T, 'tq', PlayerId('p1'))).ok).toBe(false);

    const result = await initiatePairPick(asDb('alice'), T, 'p1', 'tq', PlayerId('p2'));
    expect(result.ok).toBe(true);
    const claim = await read('taskClaims/1_tq');
    expect(claim).toMatchObject({ playerId: 'p1', invitee: 'p2', accepted: false });
    expect(claim?.declined).toBeUndefined();
  });
});

describe('bidReward', () => {
  it('places a sealed bid for the current day and bumps the interest count', async () => {
    const result = await bidReward(asDb('alice'), T, 'p1', 'r1', 70);
    expect(result.ok).toBe(true);
    const bid = await read('rewardBids/p1_r1');
    expect(bid?.playerId).toBe('p1');
    expect(bid?.rewardId).toBe('r1');
    expect(bid?.amount).toBe(70);
    const counts = await read('rewardBidCounts/1');
    expect((counts?.counts as Record<string, number>).r1).toBe(1);
  });

  it('lets a player hold a separate bid on each reward', async () => {
    expect((await bidReward(asDb('alice'), T, 'p1', 'r1', 70)).ok).toBe(true);
    expect((await bidReward(asDb('alice'), T, 'p1', 'r2', 50)).ok).toBe(true);
    expect((await read('rewardBids/p1_r1'))?.amount).toBe(70);
    expect((await read('rewardBids/p1_r2'))?.amount).toBe(50);
    const counts = (await read('rewardBidCounts/1'))?.counts as Record<string, number>;
    expect(counts.r1).toBe(1);
    expect(counts.r2).toBe(1);
  });

  it('refuses a bid below the reward price', async () => {
    const result = await bidReward(asDb('alice'), T, 'p1', 'r1', 10);
    expect(result).toEqual({ ok: false, error: { code: 'BID_BELOW_MINIMUM', min: 40 } });
    expect(await read('rewardBids/p1_r1')).toBeUndefined();
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
      allowTaskSwitch: true,
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
    // Coin history: p1's completed task is recorded (spec 9.1).
    const p1Ledger = await readCollection('players/p1/ledger');
    expect(p1Ledger).toHaveLength(1);
    expect(p1Ledger[0]).toMatchObject({ kind: 'task', outcome: 'completed', delta: 150, day: 1 });
  });

  it('resolves the reward auction: charges the winner and consumes the bid', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `turnuses/${T}/rewardBids/p1_r1`), {
        playerId: 'p1',
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
    expect(await read('rewardBids/p1_r1')).toBeUndefined();
    // The win is recorded as an owned-reward purchase (id = `${day}_${rewardId}`).
    const purchase = await read('purchases/1_r1');
    expect(purchase?.buyerId).toBe('p1');
    expect(purchase?.price).toBe(60);
    expect(purchase?.form).toBe('reward');
    // Coin history records both the settled task and the won reward for p1 (spec 9.1).
    const p1Ledger = await readCollection('players/p1/ledger');
    expect(p1Ledger.some((entry) => entry.kind === 'task' && entry.delta === 150)).toBe(true);
    expect(p1Ledger.some((entry) => entry.kind === 'reward' && entry.delta === -60)).toBe(true);
  });
});

describe('adjustCoins', () => {
  it('applies a manual change and records it with the note in the ledger', async () => {
    const result = await adjustCoins(asDb('admin'), T, 'p1', -30, 'Raketa');
    expect(result.ok).toBe(true);
    expect((await read('players/p1'))?.coins).toBe(70); // 100 − 30
    const ledger = await readCollection('players/p1/ledger');
    expect(ledger).toHaveLength(1);
    expect(ledger[0]).toMatchObject({ kind: 'adjust', delta: -30, note: 'Raketa', day: 1 });
  });

  it('writes no ledger entry when the change nets to zero', async () => {
    await adjustCoins(asDb('admin'), T, 'p1', 0, 'noop');
    expect(await readCollection('players/p1/ledger')).toEqual([]);
  });
});
