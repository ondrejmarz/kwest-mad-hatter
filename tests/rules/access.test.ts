import { readFileSync } from 'node:fs';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

/**
 * The rules are the whole security model (spec 11) — there is no backend to fall back on.
 * These tests are written as an attacker (spec 15.10): the "denies" must fail, the "allows"
 * must pass. Baseline data is seeded via the rules-disabled context before each test.
 */
const T = 'demo';
let env: RulesTestEnvironment;

const authed = (uid: string) => env.authenticatedContext(uid).firestore();
const anon = () => env.unauthenticatedContext().firestore();
const path = (suffix: string): string => `turnuses/${T}/${suffix}`;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-tabor',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const put = (suffix: string, data: Record<string, unknown>): Promise<void> =>
      setDoc(doc(db, path(suffix)), data);

    await setDoc(doc(db, `turnuses/${T}`), {
      name: 'Demo',
      slug: 'demo',
      currentDay: 1,
      dayLocked: false,
    });
    await put('private/config', { playerCode: 'PLAY01', adminCode: 'ADMIN1' });

    for (const [uid, role] of [
      ['admin', 'admin'],
      ['alice', 'player'],
      ['bob', 'player'],
      ['carol', 'player'],
      ['dan', 'player'],
    ] as const) {
      await put(`members/${uid}`, { role });
      await put(`roles/${uid}`, { role });
    }

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
    await put(
      'players/p1',
      player({
        name: 'Alice',
        ownerUids: ['alice'],
        activeTask: {
          taskId: 't1',
          name: 'T',
          description: '',
          category: 'c',
          difficulty: 1,
          coinReward: 150,
          partnerNames: [],
        },
      }),
    );
    await put('players/p2', player({ name: 'Bob', ownerUids: ['bob'] }));
    await put('players/p3', player({ name: 'Free', coins: 0, needsPick: true }));
    await put('players/p4', player({ name: 'Carol', ownerUids: ['carol'] }));
    await put('players/p5', player({ name: 'Pending', status: 'pending', coins: 0 }));
    await put('players/p1/private/auth', { recoveryPin: '1234' });
    await put('players/p3/private/auth', { recoveryPin: '4321' });

    await put('ownerIndex/alice', { playerId: 'p1' });
    await put('ownerIndex/bob', { playerId: 'p2' });
    await put('ownerIndex/carol', { playerId: 'p4' });

    await put('tasks/t1', {
      name: 'T',
      category: 'c',
      difficulty: 1,
      active: true,
      coinReward: 150,
      minPlayers: 1,
      maxPlayers: 1,
    });
    await put('tasks/g1', {
      name: 'G',
      category: 'c',
      difficulty: 1,
      active: true,
      coinReward: 150,
      minPlayers: 2,
      maxPlayers: 3,
    });
    await put('rewards/r1', { name: 'R', price: 10, form: 'reward', active: true });

    await put('reservations/p1', {
      day: 2,
      taskId: 't1',
      taskName: { cs: 'T', en: '', de: '' },
      minPlayers: 2,
      maxPlayers: 2,
      invitees: ['p2'],
      responses: {},
      createdAt: serverTimestamp(),
    });
    await put('rewardBids/p1', {
      day: 1,
      rewardId: 'r1',
      amount: 20,
      createdAt: serverTimestamp(),
    });
  });
});

describe('reads', () => {
  it('denies a non-member reading players', async () => {
    await assertFails(getDocs(collection(authed('stranger'), path('players'))));
    await assertFails(getDocs(collection(anon(), path('players'))));
  });

  it('lets a member read players', async () => {
    await assertSucceeds(getDocs(collection(authed('alice'), path('players'))));
  });

  it('hides the turnus codes from everyone, including admins', async () => {
    await assertFails(getDoc(doc(authed('alice'), path('private/config'))));
    await assertFails(getDoc(doc(authed('admin'), path('private/config'))));
  });

  it('hides recovery PINs from everyone, even the character owner', async () => {
    await assertFails(getDoc(doc(authed('alice'), path('players/p1/private/auth'))));
    await assertFails(getDoc(doc(authed('admin'), path('players/p1/private/auth'))));
  });

  it("hides other members' membership", async () => {
    await assertFails(getDoc(doc(authed('alice'), path('members/bob'))));
  });

  it('lets a member read only their own role', async () => {
    await assertSucceeds(getDoc(doc(authed('alice'), path('roles/alice'))));
    await assertFails(getDoc(doc(authed('alice'), path('roles/bob'))));
  });
});

describe('reservations are secret', () => {
  it("denies an uninvolved member reading someone else's reservation", async () => {
    await assertFails(getDoc(doc(authed('carol'), path('reservations/p1'))));
  });

  it('lets the initiator and the invited partner read it', async () => {
    await assertSucceeds(getDoc(doc(authed('alice'), path('reservations/p1'))));
    await assertSucceeds(getDoc(doc(authed('bob'), path('reservations/p1'))));
  });

  it('lets the owner change their own reservation', async () => {
    await assertSucceeds(
      updateDoc(doc(authed('alice'), path('reservations/p1')), { taskId: 't2' }),
    );
    await assertSucceeds(deleteDoc(doc(authed('alice'), path('reservations/p1'))));
  });

  it('lets an invited player accept by setting only their own response', async () => {
    await assertSucceeds(
      updateDoc(doc(authed('bob'), path('reservations/p1')), { responses: { p2: 'accepted' } }),
    );
  });

  it('lets an invited player decline the same way', async () => {
    await assertSucceeds(
      updateDoc(doc(authed('bob'), path('reservations/p1')), { responses: { p2: 'declined' } }),
    );
  });

  it("forbids an invitee writing someone else's response", async () => {
    await assertFails(
      updateDoc(doc(authed('bob'), path('reservations/p1')), { responses: { p3: 'accepted' } }),
    );
  });

  it('forbids an invitee touching another field', async () => {
    await assertFails(updateDoc(doc(authed('bob'), path('reservations/p1')), { taskId: 't2' }));
  });

  it('does not let an uninvolved member delete a reservation', async () => {
    await assertFails(deleteDoc(doc(authed('carol'), path('reservations/p1'))));
  });
});

describe('reward bids are secret', () => {
  it("denies any other member reading someone's sealed bid", async () => {
    await assertFails(getDoc(doc(authed('carol'), path('rewardBids/p1'))));
    await assertFails(getDoc(doc(authed('bob'), path('rewardBids/p1'))));
  });

  it('lets the bidder and an admin read it', async () => {
    await assertSucceeds(getDoc(doc(authed('alice'), path('rewardBids/p1'))));
    await assertSucceeds(getDoc(doc(authed('admin'), path('rewardBids/p1'))));
  });

  it('lets the bidder change and withdraw their own bid', async () => {
    await assertSucceeds(updateDoc(doc(authed('alice'), path('rewardBids/p1')), { amount: 50 }));
    await assertSucceeds(deleteDoc(doc(authed('alice'), path('rewardBids/p1'))));
  });

  it("forbids a member writing someone else's bid", async () => {
    await assertFails(updateDoc(doc(authed('carol'), path('rewardBids/p1')), { amount: 50 }));
    await assertFails(deleteDoc(doc(authed('carol'), path('rewardBids/p1'))));
  });

  it('freezes new and raised bids while the day is locked, but still allows withdrawal', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `turnuses/${T}`), {
        name: 'Demo',
        slug: 'demo',
        currentDay: 1,
        dayLocked: true,
      });
    });
    await assertFails(updateDoc(doc(authed('alice'), path('rewardBids/p1')), { amount: 50 }));
    await assertSucceeds(deleteDoc(doc(authed('alice'), path('rewardBids/p1'))));
  });
});

describe('same-day task pick', () => {
  const activeT1 = {
    taskId: 't1',
    name: 'T',
    description: '',
    difficulty: 1,
    coinReward: 150,
    partnerNames: [],
  };

  it('lets a player take an open task for today when the coins match the catalog', async () => {
    await assertSucceeds(
      updateDoc(doc(authed('alice'), path('players/p1')), {
        activeTask: activeT1,
        needsPick: false,
      }),
    );
  });

  it('rejects a pick that inflates the reward', async () => {
    await assertFails(
      updateDoc(doc(authed('alice'), path('players/p1')), {
        activeTask: { ...activeT1, coinReward: 9999 },
        needsPick: false,
      }),
    );
  });

  it('rejects taking a non-solo task for today', async () => {
    await assertFails(
      updateDoc(doc(authed('alice'), path('players/p1')), {
        activeTask: { ...activeT1, taskId: 'g1' },
        needsPick: false,
      }),
    );
  });

  it('lets the owner claim the task marker but not on behalf of someone else', async () => {
    await assertSucceeds(
      setDoc(doc(authed('alice'), path('taskClaims/1_t1')), {
        day: 1,
        taskId: 't1',
        playerId: 'p1',
      }),
    );
    await assertFails(
      setDoc(doc(authed('alice'), path('taskClaims/1_t2')), {
        day: 1,
        taskId: 't2',
        playerId: 'p2',
      }),
    );
  });

  it('freezes the pick and the claim while the day is locked', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `turnuses/${T}`), {
        name: 'Demo',
        slug: 'demo',
        currentDay: 1,
        dayLocked: true,
      });
    });
    await assertFails(
      updateDoc(doc(authed('alice'), path('players/p1')), {
        activeTask: activeT1,
        needsPick: false,
      }),
    );
    await assertFails(
      setDoc(doc(authed('alice'), path('taskClaims/1_t1')), {
        day: 1,
        taskId: 't1',
        playerId: 'p1',
      }),
    );
  });
});

describe('a player cannot tamper with their own document', () => {
  it('denies raising their own coins', async () => {
    await assertFails(updateDoc(doc(authed('alice'), path('players/p1')), { coins: 9999 }));
  });

  it('denies self-approval', async () => {
    await assertFails(updateDoc(doc(authed('alice'), path('players/p1')), { status: 'pending' }));
  });

  it('denies overwriting activeTask.coinReward', async () => {
    await assertFails(
      updateDoc(doc(authed('alice'), path('players/p1')), {
        activeTask: {
          taskId: 't1',
          name: 'T',
          description: '',
          category: 'c',
          difficulty: 1,
          coinReward: 9999,
          partnerNames: [],
        },
      }),
    );
  });

  it('denies a member approving a pending player', async () => {
    await assertFails(updateDoc(doc(authed('alice'), path('players/p5')), { status: 'approved' }));
  });
});

describe('character claiming', () => {
  it('requires a PIN even for a free, approved character', async () => {
    await assertFails(updateDoc(doc(authed('dan'), path('players/p3')), { ownerUids: ['dan'] }));
  });

  it('lets a member claim a free character with the correct PIN', async () => {
    const db = authed('dan');
    await assertSucceeds(setDoc(doc(db, path('claimAttempts/dan')), { pin: '4321' }));
    await assertSucceeds(updateDoc(doc(db, path('players/p3')), { ownerUids: ['dan'] }));
  });

  it('forbids claiming an owned character without a matching PIN', async () => {
    await assertFails(
      updateDoc(doc(authed('bob'), path('players/p1')), { ownerUids: ['alice', 'bob'] }),
    );
  });

  it('lets a second device join with the correct PIN', async () => {
    const db = authed('bob');
    await assertSucceeds(setDoc(doc(db, path('claimAttempts/bob')), { pin: '1234' }));
    await assertSucceeds(updateDoc(doc(db, path('players/p1')), { ownerUids: ['alice', 'bob'] }));
  });

  it('rejects a wrong PIN', async () => {
    const db = authed('bob');
    await assertSucceeds(setDoc(doc(db, path('claimAttempts/bob')), { pin: '0000' }));
    await assertFails(updateDoc(doc(db, path('players/p1')), { ownerUids: ['alice', 'bob'] }));
  });

  it('lets an owner release their own character (no PIN needed to leave)', async () => {
    await assertSucceeds(updateDoc(doc(authed('carol'), path('players/p4')), { ownerUids: [] }));
  });

  it('forbids stripping someone else from a character', async () => {
    await assertFails(updateDoc(doc(authed('dan'), path('players/p4')), { ownerUids: [] }));
  });
});

describe('admin-only writes', () => {
  it('denies a player writing tasks, rewards or the turnus', async () => {
    await assertFails(updateDoc(doc(authed('alice'), path('tasks/t1')), { active: false }));
    await assertFails(updateDoc(doc(authed('alice'), path('rewards/r1')), { price: 0 }));
    await assertFails(updateDoc(doc(authed('alice'), `turnuses/${T}`), { currentDay: 99 }));
  });

  it('lets an admin approve a pending player and edit the catalog', async () => {
    const db = authed('admin');
    await assertSucceeds(
      updateDoc(doc(db, path('players/p5')), { status: 'approved', coins: 0, needsPick: true }),
    );
    await assertSucceeds(updateDoc(doc(db, path('tasks/t1')), { active: false }));
    await assertSucceeds(
      setDoc(doc(db, path('private/config')), { playerCode: 'NEW1', adminCode: 'NEW2' }),
    );
  });

  it('lets an admin reject a pending player but never delete an approved one', async () => {
    await assertSucceeds(deleteDoc(doc(authed('admin'), path('players/p5'))));
    await assertFails(deleteDoc(doc(authed('admin'), path('players/p1'))));
  });

  it('lets an admin write an owned-reward purchase but denies a player', async () => {
    const purchase = {
      day: 1,
      buyerId: 'p1',
      buyerName: 'Alice',
      rewardId: 'r1',
      rewardName: { cs: 'R', en: '', de: '' },
      description: { cs: '', en: '', de: '' },
      price: 20,
      form: 'reward',
      targetIds: [],
      targetNames: [],
      refunded: false,
      createdAt: serverTimestamp(),
    };
    await assertSucceeds(setDoc(doc(authed('admin'), path('purchases/1_r1')), purchase));
    await assertFails(setDoc(doc(authed('alice'), path('purchases/1_r1b')), purchase));
  });

  it('does not let a player delete a character', async () => {
    await assertFails(deleteDoc(doc(authed('alice'), path('players/p5'))));
  });
});

describe('turnus entry', () => {
  it('rejects a wrong code', async () => {
    await assertFails(
      setDoc(doc(authed('newbie'), path('joinAttempts/newbie')), { code: 'WRONG' }),
    );
  });

  it('accepts the correct code and lets the visitor become a member', async () => {
    const db = authed('newbie');
    await assertSucceeds(setDoc(doc(db, path('joinAttempts/newbie')), { code: 'PLAY01' }));
    await assertSucceeds(setDoc(doc(db, path('members/newbie')), { role: 'player' }));
  });

  it('does not let a player-code joiner claim the admin role', async () => {
    const db = authed('newbie');
    await assertSucceeds(setDoc(doc(db, path('joinAttempts/newbie')), { code: 'PLAY01' }));
    await assertFails(setDoc(doc(db, path('members/newbie')), { role: 'admin' }));
  });
});
