import type { Day, PlayerId, TaskId } from './ids';

/**
 * Typed audit events (spec 4, 15.13). The domain emits `type` + structured payload;
 * the UI renders the human sentence, and the data layer stamps `serverTimestamp` and
 * a readable `actorLabel` at write time. `coins` is the signed delta applied.
 */
export type GameEvent =
  | {
      readonly type: 'task_completed';
      readonly day: Day;
      readonly playerId: PlayerId;
      readonly taskId: TaskId;
      readonly coins: number;
    }
  | {
      readonly type: 'task_failed';
      readonly day: Day;
      readonly playerId: PlayerId;
      readonly taskId: TaskId;
      readonly coins: number;
    }
  | {
      readonly type: 'no_task_penalty';
      readonly day: Day;
      readonly playerId: PlayerId;
      readonly coins: number;
    }
  | {
      readonly type: 'reservation_assigned';
      readonly day: Day;
      readonly playerId: PlayerId;
      readonly taskId: TaskId;
    }
  | {
      readonly type: 'reservation_lost';
      readonly day: Day;
      readonly playerId: PlayerId;
      readonly taskId: TaskId;
      readonly winnerName: string;
    }
  | {
      readonly type: 'reservation_expired';
      readonly day: Day;
      readonly playerId: PlayerId;
      readonly taskId: TaskId;
    };

export type GameEventType = GameEvent['type'];

export const gameEvent = {
  taskCompleted: (day: Day, playerId: PlayerId, taskId: TaskId, coins: number): GameEvent => ({
    type: 'task_completed',
    day,
    playerId,
    taskId,
    coins,
  }),
  taskFailed: (day: Day, playerId: PlayerId, taskId: TaskId, coins: number): GameEvent => ({
    type: 'task_failed',
    day,
    playerId,
    taskId,
    coins,
  }),
  noTaskPenalty: (day: Day, playerId: PlayerId, coins: number): GameEvent => ({
    type: 'no_task_penalty',
    day,
    playerId,
    coins,
  }),
  reservationAssigned: (day: Day, playerId: PlayerId, taskId: TaskId): GameEvent => ({
    type: 'reservation_assigned',
    day,
    playerId,
    taskId,
  }),
  reservationLost: (
    day: Day,
    playerId: PlayerId,
    taskId: TaskId,
    winnerName: string,
  ): GameEvent => ({
    type: 'reservation_lost',
    day,
    playerId,
    taskId,
    winnerName,
  }),
  reservationExpired: (day: Day, playerId: PlayerId, taskId: TaskId): GameEvent => ({
    type: 'reservation_expired',
    day,
    playerId,
    taskId,
  }),
};
