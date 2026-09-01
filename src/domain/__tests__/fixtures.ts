import { Day, PlayerId, RewardId, TaskId } from '../ids';
import type {
  ActiveTask,
  LocalizedText,
  Player,
  Reservation,
  Reward,
  Task,
  TurnusSettings,
} from '../types';

/** Test data builders (spec 15.10) — never hand-write domain objects in tests. */

/** A trilingual text; unspecified languages mirror `cs` (the fallback the UI applies). */
export const loc = (cs: string, en = cs, de = cs): LocalizedText => ({ cs, en, de });

export const makeTurnus = (over: Partial<TurnusSettings> = {}): TurnusSettings => ({
  currentDay: Day(1),
  startingCoins: 0,
  coinsPerDifficulty: 50,
  penaltyRatio: 0.5,
  allowNegativeBalance: true,
  maxActiveRewardsPerPlayer: 1,
  maxActivePunishesPerPlayer: 1,
  noPickPenalty: 100,
  nextDayCategories: [],
  currentDayCategories: [],
  dayLocked: false,
  ...over,
});

export const makeActiveTask = (over: Partial<ActiveTask> = {}): ActiveTask => ({
  taskId: TaskId('t1'),
  name: loc('Sweep the yard'),
  description: loc(''),
  difficulty: 1,
  coinReward: 150,
  coinPenalty: 75,
  partnerNames: [],
  ...over,
});

export const makePlayer = (over: Partial<Player> = {}): Player => ({
  id: PlayerId('p1'),
  name: 'Jana',
  coins: 100,
  status: 'approved',
  ownerUids: [],
  needsPick: false,
  activeTask: null,
  ...over,
});

export const makeTask = (over: Partial<Task> = {}): Task => ({
  id: TaskId('t1'),
  name: loc('Sweep the yard'),
  description: loc(''),
  categories: [loc('chores')],
  difficulty: 1,
  minPlayers: 1,
  maxPlayers: 1,
  coinReward: 150,
  coinPenalty: 75,
  usedByPlayerIds: [],
  active: true,
  ...over,
});

export const makeReward = (over: Partial<Reward> = {}): Reward => ({
  id: RewardId('r1'),
  name: loc('Reseat someone'),
  description: loc(''),
  categories: [],
  price: 50,
  form: 'reward',
  minTargets: 0,
  maxTargets: 0,
  exclusivePerDay: false,
  active: true,
  ...over,
});

export const makeReservation = (over: Partial<Reservation> = {}): Reservation => ({
  playerId: PlayerId('p1'),
  day: Day(2),
  taskId: TaskId('t1'),
  taskName: loc('Sweep the yard'),
  minPlayers: 1,
  maxPlayers: 1,
  invitees: [],
  responses: {},
  createdAt: 1000,
  ...over,
});
