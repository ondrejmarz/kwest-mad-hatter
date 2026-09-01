import { collection, doc, type Firestore } from 'firebase/firestore';

/**
 * Every Firestore path lives here as a function (spec 15.6) — no path string appears
 * anywhere else. `db` is a parameter so tests can pass an emulator instance.
 *
 * Layout (spec 4, plus decisions): a turnus owns its game state; `private/**`,
 * `members/**`, `admin/**`, `ownerIndex` and `claimGuards` are read by rules only
 * (or admins), never by ordinary clients.
 */

// Global catalog templates, copied into a turnus on import.
export const catalogTasksCol = (db: Firestore) => collection(db, 'catalogTasks');
export const catalogRewardsCol = (db: Firestore) => collection(db, 'catalogRewards');

// Turnus root + code/membership docs used by rules.
export const turnusesCol = (db: Firestore) => collection(db, 'turnuses');
export const turnusDoc = (db: Firestore, t: string) => doc(db, 'turnuses', t);
export const configDoc = (db: Firestore, t: string) => doc(db, 'turnuses', t, 'private', 'config');
export const memberDoc = (db: Firestore, t: string, uid: string) =>
  doc(db, 'turnuses', t, 'members', uid);
export const roleDoc = (db: Firestore, t: string, uid: string) =>
  doc(db, 'turnuses', t, 'roles', uid);
export const joinAttemptDoc = (db: Firestore, t: string, uid: string) =>
  doc(db, 'turnuses', t, 'joinAttempts', uid);
export const claimAttemptDoc = (db: Firestore, t: string, uid: string) =>
  doc(db, 'turnuses', t, 'claimAttempts', uid);

// `uid -> playerId` reverse index so rules can resolve "my player" without a query.
export const ownerIndexDoc = (db: Firestore, t: string, uid: string) =>
  doc(db, 'turnuses', t, 'ownerIndex', uid);
// PIN-claim throttle guard, keyed by playerId (5 tries then a 15-minute lockout).
export const claimGuardDoc = (db: Firestore, t: string, playerId: string) =>
  doc(db, 'turnuses', t, 'claimGuards', playerId);
// One-shot full-undo snapshot, readable by admins only (kept off the hot turnus doc).
export const rollbackDoc = (db: Firestore, t: string) =>
  doc(db, 'turnuses', t, 'admin', 'rollback');

// Public game state within a turnus.
export const playersCol = (db: Firestore, t: string) => collection(db, 'turnuses', t, 'players');
export const playerDoc = (db: Firestore, t: string, playerId: string) =>
  doc(db, 'turnuses', t, 'players', playerId);
export const playerAuthDoc = (db: Firestore, t: string, playerId: string) =>
  doc(db, 'turnuses', t, 'players', playerId, 'private', 'auth');
export const tasksCol = (db: Firestore, t: string) => collection(db, 'turnuses', t, 'tasks');
export const taskDoc = (db: Firestore, t: string, taskId: string) =>
  doc(db, 'turnuses', t, 'tasks', taskId);
export const rewardsCol = (db: Firestore, t: string) => collection(db, 'turnuses', t, 'rewards');
export const rewardDoc = (db: Firestore, t: string, rewardId: string) =>
  doc(db, 'turnuses', t, 'rewards', rewardId);
export const reservationsCol = (db: Firestore, t: string) =>
  collection(db, 'turnuses', t, 'reservations');
export const reservationDoc = (db: Firestore, t: string, playerId: string) =>
  doc(db, 'turnuses', t, 'reservations', playerId);
export const reservationCountsDoc = (db: Firestore, t: string, day: number) =>
  doc(db, 'turnuses', t, 'reservationCounts', String(day));
export const rewardBidsCol = (db: Firestore, t: string) =>
  collection(db, 'turnuses', t, 'rewardBids');
export const rewardBidDoc = (db: Firestore, t: string, playerId: string) =>
  doc(db, 'turnuses', t, 'rewardBids', playerId);
export const rewardBidCountsDoc = (db: Firestore, t: string, day: number) =>
  doc(db, 'turnuses', t, 'rewardBidCounts', String(day));
// First-come marker for a same-day task pick, one doc per (day, task). Create-only for players, so
// the first writer wins the task for the day; the id encodes both so it is unique per day.
export const taskClaimDoc = (db: Firestore, t: string, day: number, taskId: string) =>
  doc(db, 'turnuses', t, 'taskClaims', `${day}_${taskId}`);
export const purchasesCol = (db: Firestore, t: string) =>
  collection(db, 'turnuses', t, 'purchases');
export const purchaseDoc = (db: Firestore, t: string, id: string) =>
  doc(db, 'turnuses', t, 'purchases', id);
export const eventsCol = (db: Firestore, t: string) => collection(db, 'turnuses', t, 'events');
export const eventDoc = (db: Firestore, t: string, id: string) =>
  doc(db, 'turnuses', t, 'events', id);
