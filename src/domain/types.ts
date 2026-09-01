import type { Day, PlayerId, RewardId, TaskId } from './ids';

/**
 * Plain domain model. These types are framework-free and never imported from
 * Firestore's SDK — the data layer validates snapshots with zod and maps them
 * onto these shapes (a compatibility test keeps the two in sync, spec 15.6).
 * Time and ordering enter as plain numbers (`createdAt` millis), never Date.
 */

export type RewardForm = 'reward' | 'punish_someone' | 'punish_all';

export type PlayerStatus = 'pending' | 'approved';

/** Denormalized snapshot of a task at the moment it was assigned to a player. */
export interface ActiveTask {
  readonly taskId: TaskId;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly difficulty: number;
  readonly coinReward: number;
  readonly coinPenalty: number;
  readonly isPair: boolean;
  readonly partnerId?: PlayerId;
  readonly partnerName?: string;
  readonly detail?: string;
}

export interface Player {
  readonly id: PlayerId;
  readonly name: string;
  readonly coins: number;
  readonly status: PlayerStatus;
  readonly ownerUids: readonly string[];
  readonly needsPick: boolean;
  readonly activeTask: ActiveTask | null;
}

export interface Task {
  readonly id: TaskId;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly difficulty: number;
  readonly isPair: boolean;
  readonly coinReward: number;
  readonly coinPenalty: number;
  readonly usedByPlayerIds: readonly PlayerId[];
  readonly active: boolean;
}

export interface Reward {
  readonly id: RewardId;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly form: RewardForm;
  readonly minTargets: number;
  readonly maxTargets: number;
  readonly exclusivePerDay: boolean;
  readonly active: boolean;
}

/** A reservation lives under its initiator's playerId; a pair names the partner. */
export interface Reservation {
  readonly playerId: PlayerId;
  readonly day: Day;
  readonly taskId: TaskId;
  readonly taskName: string;
  readonly isPair: boolean;
  readonly partnerId?: PlayerId;
  readonly partnerName?: string;
  readonly confirmed: boolean;
  readonly invitePartnerId?: PlayerId | null;
  readonly createdAt: number;
}

export interface Purchase {
  readonly id: string;
  readonly day: Day;
  readonly buyerId: PlayerId;
  readonly buyerName: string;
  readonly rewardId: RewardId;
  readonly rewardName: string;
  readonly description: string;
  readonly price: number;
  readonly form: RewardForm;
  readonly targetIds: readonly PlayerId[];
  readonly targetNames: readonly string[];
  readonly refunded: boolean;
}

/** The subset of turnus fields the pure game logic needs. */
export interface TurnusSettings {
  readonly currentDay: Day;
  readonly startingCoins: number;
  readonly coinsPerDifficulty: number;
  readonly penaltyRatio: number;
  readonly allowNegativeBalance: boolean;
  readonly maxActiveRewardsPerPlayer: number;
  readonly maxActivePunishesPerPlayer: number;
  readonly noPickPenalty: number;
  readonly nextDayCategories: readonly string[];
  readonly currentDayCategories: readonly string[];
  readonly dayLocked: boolean;
}
