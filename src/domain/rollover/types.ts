import type { GameEvent } from '../events';
import type { Day, PlayerId, TaskId } from '../ids';
import type { ActiveTask, Player, Reservation, Task, TurnusSettings } from '../types';

/** Everything `resolveRollover` needs. Reservations are the day D+1 set (spec 6). */
export interface RolloverInput {
  readonly turnus: TurnusSettings;
  readonly players: readonly Player[];
  readonly tasks: readonly Task[];
  readonly reservations: readonly Reservation[];
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
  readonly event: GameEvent;
}

/** One atomic bid for a task on day D+1; a pair is one claim for two players (spec 6). */
export interface Claim {
  readonly taskId: TaskId;
  readonly taskName: string;
  readonly isPair: boolean;
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

export interface PlayerSnapshot {
  readonly playerId: PlayerId;
  readonly coins: number;
  readonly activeTask: ActiveTask | null;
  readonly needsPick: boolean;
}

/** Everything evaluation mutated, captured for a one-shot full undo (spec, decision A4). */
export interface RollbackSnapshot {
  readonly currentDay: Day;
  readonly currentDayCategories: readonly string[];
  readonly dayLocked: boolean;
  readonly players: readonly PlayerSnapshot[];
  readonly tasks: readonly TaskUpdate[];
  readonly reservations: readonly Reservation[];
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
  readonly taskName: string;
  readonly isPair: boolean;
}

export interface PreviewLoss {
  readonly playerId: PlayerId;
  readonly playerName: string;
  readonly taskName: string;
  readonly winnerName: string;
}

export interface PreviewWithoutTask {
  readonly playerId: PlayerId;
  readonly playerName: string;
}

/** Structured data for the admin summary screen — the same computation the write uses. */
export interface RolloverPreview {
  readonly settlements: readonly PreviewSettlement[];
  readonly assignments: readonly PreviewAssignment[];
  readonly losses: readonly PreviewLoss[];
  readonly withoutTask: readonly PreviewWithoutTask[];
}

export interface TurnusUpdate {
  readonly currentDay: Day;
  readonly currentDayCategories: readonly string[];
  readonly dayLocked: boolean;
}

export interface RolloverResult {
  readonly nextDay: Day;
  readonly turnus: TurnusUpdate;
  readonly playerUpdates: readonly PlayerUpdate[];
  readonly taskUpdates: readonly TaskUpdate[];
  readonly events: readonly GameEvent[];
  readonly rollbackSnapshot: RollbackSnapshot;
  readonly preview: RolloverPreview;
}
