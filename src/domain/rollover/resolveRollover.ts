import { unique } from '../../lib/arrays';
import { invariant } from '../../lib/invariant';
import type { GameEvent } from '../events';
import { Day, type PlayerId, type TaskId } from '../ids';

import { assignTasks } from './assignTasks';
import { buildClaims } from './buildClaims';
import { settleDay } from './settleDay';
import { sortClaims } from './sortClaims';
import type {
  PlayerUpdate,
  PreviewWithoutTask,
  RollbackSnapshot,
  RolloverInput,
  RolloverResult,
  TaskUpdate,
} from './types';

/**
 * Day evaluation (spec 6) — the one function that decides the game loop:
 * settle -> rank reservations on post-settle coins -> assign -> advance -> snapshot.
 * The admin preview screen runs this exact function, so it shows what will happen.
 */
export function resolveRollover(input: RolloverInput): RolloverResult {
  const { turnus, players, tasks, reservations, completedPlayerIds } = input;
  const currentDay = turnus.currentDay;
  const nextDay = Day(currentDay + 1);

  const approved = players.filter((player) => player.status === 'approved');
  const nameById = new Map(approved.map((player) => [player.id, player.name] as const));
  const tasksById = new Map(tasks.map((task) => [task.id, task] as const));
  const nameOf = (playerId: PlayerId): string => {
    const name = nameById.get(playerId);
    invariant(name !== undefined, 'every approved player has a name');
    return name;
  };

  // Step 1 — settle day D.
  const settlements = settleDay(approved, completedPlayerIds, turnus);
  const coinsById = new Map(
    settlements.map((settlement) => [settlement.playerId, settlement.coins] as const),
  );

  // Step 3 — assign reservations for D+1, ranked on the post-settle balances.
  const { claims, expiredEvents } = buildClaims(reservations, coinsById, nextDay);
  const assignment = assignTasks(sortClaims(claims), tasksById, nameById, nextDay);

  const playerUpdates: readonly PlayerUpdate[] = approved.map((player) => {
    const coins = coinsById.get(player.id);
    invariant(coins !== undefined, 'every approved player was settled');
    const activeTask = assignment.activeTaskById.get(player.id) ?? null;
    return { playerId: player.id, coins, activeTask, needsPick: activeTask === null };
  });

  // Failed tasks are marked used too — you do not get to retry a task you flunked (spec 6).
  const addedByTask = new Map<TaskId, PlayerId[]>();
  for (const settlement of settlements) {
    if (settlement.usedTaskId !== null) {
      const list = addedByTask.get(settlement.usedTaskId) ?? [];
      list.push(settlement.playerId);
      addedByTask.set(settlement.usedTaskId, list);
    }
  }
  const taskUpdates: readonly TaskUpdate[] = [...addedByTask].map(([taskId, added]) => {
    const task = tasksById.get(taskId);
    invariant(task !== undefined, 'a settled task exists in the catalog');
    return { taskId, usedByPlayerIds: unique([...task.usedByPlayerIds, ...added]) };
  });

  // Step 5 — snapshot the pre-evaluation state of everything we mutate (full undo).
  const changedTaskIds = new Set(taskUpdates.map((update) => update.taskId));
  const rollbackSnapshot: RollbackSnapshot = {
    currentDay,
    currentDayCategories: turnus.currentDayCategories,
    dayLocked: turnus.dayLocked,
    players: approved.map((player) => ({
      playerId: player.id,
      coins: player.coins,
      activeTask: player.activeTask,
      needsPick: player.needsPick,
    })),
    tasks: tasks
      .filter((task) => changedTaskIds.has(task.id))
      .map((task) => ({ taskId: task.id, usedByPlayerIds: task.usedByPlayerIds })),
    reservations,
  };

  const withoutTask: readonly PreviewWithoutTask[] = playerUpdates
    .filter((update) => update.activeTask === null)
    .map((update) => ({ playerId: update.playerId, playerName: nameOf(update.playerId) }));

  const events: readonly GameEvent[] = [
    ...settlements.map((settlement) => settlement.event),
    ...expiredEvents,
    ...assignment.events,
  ];

  // Step 4 — advance the round: tomorrow's categories become today's, and the day unlocks.
  return {
    nextDay,
    turnus: {
      currentDay: nextDay,
      currentDayCategories: turnus.nextDayCategories,
      dayLocked: false,
    },
    playerUpdates,
    taskUpdates,
    events,
    rollbackSnapshot,
    preview: {
      settlements: settlements.map((settlement) => ({
        playerId: settlement.playerId,
        playerName: settlement.playerName,
        delta: settlement.delta,
        outcome: settlement.outcome,
      })),
      assignments: assignment.assignments,
      losses: assignment.losses,
      withoutTask,
    },
  };
}
