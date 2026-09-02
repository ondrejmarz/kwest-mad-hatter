import type { Day, PlayerId, RewardId, TaskId } from '../ids';
import type { LedgerEntry } from '../ledger';
import type {
  ActiveTask,
  LocalizedText,
  Player,
  Purchase,
  Reservation,
  Reward,
  RewardBid,
  Task,
  TurnusSettings,
} from '../types';

/** Everything `resolveRollover` needs. Reservations are the day D+1 set (spec 6). */
export interface RolloverInput {
  readonly turnus: TurnusSettings;
  readonly players: readonly Player[];
  readonly tasks: readonly Task[];
  readonly reservations: readonly Reservation[];
  readonly rewards: readonly Reward[];
  readonly rewardBids: readonly RewardBid[];
  readonly completedPlayerIds: ReadonlySet<PlayerId>;
}

export type SettlementOutcome = 'completed' | 'failed' | 'no_task';

/** One player's day-D settlement (step 1). */
export interface Settlement {
  readonly playerId: PlayerId;
  readonly playerName: string;
  readonly coins: number;
  readonly delta: number;
  readonly outcome: SettlementOutcome;
  readonly usedTaskId: TaskId | null;
}

/** One atomic bid for a task on day D+1; a group is one claim for all its members (spec 6). */
export interface Claim {
  readonly taskId: TaskId;
  readonly taskName: LocalizedText;
  readonly playerIds: readonly PlayerId[];
  readonly balance: number;
  readonly createdAt: number;
  readonly key: string;
}

export interface PlayerUpdate {
  readonly playerId: PlayerId;
  readonly coins: number;
  readonly activeTask: ActiveTask | null;
  readonly needsPick: boolean;
}

export interface TaskUpdate {
  readonly taskId: TaskId;
  readonly usedByPlayerIds: readonly PlayerId[];
}

export interface PreviewSettlement {
  readonly playerId: PlayerId;
  readonly playerName: string;
  readonly delta: number;
  readonly outcome: SettlementOutcome;
}

export interface PreviewAssignment {
  readonly playerId: PlayerId;
  readonly playerName: string;
  readonly taskId: TaskId;
  readonly taskName: LocalizedText;
  readonly isGroup: boolean;
}

export interface PreviewLoss {
  readonly playerId: PlayerId;
  readonly playerName: string;
  readonly taskName: LocalizedText;
  readonly winnerName: string;
}

export interface PreviewWithoutTask {
  readonly playerId: PlayerId;
  readonly playerName: string;
}

export interface PreviewAuction {
  readonly rewardId: RewardId;
  readonly rewardName: LocalizedText;
  readonly winnerName: string;
  readonly amount: number;
}

/** Structured data for the admin summary screen — the same computation the write uses. */
export interface RolloverPreview {
  readonly settlements: readonly PreviewSettlement[];
  readonly assignments: readonly PreviewAssignment[];
  readonly losses: readonly PreviewLoss[];
  readonly withoutTask: readonly PreviewWithoutTask[];
  readonly auctions: readonly PreviewAuction[];
}

export interface TurnusUpdate {
  readonly currentDay: Day;
  readonly currentDayCategories: readonly string[];
  readonly nextDayCategories: readonly string[];
  readonly dayLocked: boolean;
}

/** One coin-history entry evaluation appends, tagged with the player it belongs to (spec 9.1). */
export interface LedgerAppend {
  readonly playerId: PlayerId;
  readonly entry: LedgerEntry;
}

export interface RolloverResult {
  readonly nextDay: Day;
  readonly turnus: TurnusUpdate;
  readonly playerUpdates: readonly PlayerUpdate[];
  readonly taskUpdates: readonly TaskUpdate[];
  /** Purchase docs to create for the auction winners (owned rewards, spec 8). */
  readonly purchases: readonly Purchase[];
  /** Coin-history entries to append: one per settled player, one per auction winner. */
  readonly ledger: readonly LedgerAppend[];
  readonly preview: RolloverPreview;
}
