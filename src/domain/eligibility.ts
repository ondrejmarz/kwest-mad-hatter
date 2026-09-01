import { err, ok, type Result } from '../lib/result';

import type { DomainError } from './errors';
import type { TaskId } from './ids';
import type { Player, Task, TurnusSettings } from './types';

/**
 * Task selection rules (spec 7). Reservation and same-day manual pick share the
 * base checks; the manual pick adds the daily lock and first-come exclusivity.
 */

export function canReserveTask(
  player: Player,
  task: Task,
  turnus: TurnusSettings,
): Result<void, DomainError> {
  if (!task.active) return err({ code: 'TASK_INACTIVE' });
  if (!turnus.nextDayCategories.includes(task.category)) {
    return err({ code: 'TASK_CATEGORY_CLOSED', category: task.category });
  }
  if (task.usedByPlayerIds.includes(player.id)) {
    return err({ code: 'TASK_ALREADY_USED_BY_PLAYER' });
  }
  return ok(undefined);
}

/**
 * `takenBy` maps a taskId to the name of the player who already holds it active
 * today, with the picking player excluded — that lookup is what makes the manual
 * pick first-come-first-served (spec 7).
 */
export function canPickTaskNow(
  player: Player,
  task: Task,
  turnus: TurnusSettings,
  takenBy: ReadonlyMap<TaskId, string>,
): Result<void, DomainError> {
  if (turnus.dayLocked) return err({ code: 'DAY_LOCKED' });
  if (!task.active) return err({ code: 'TASK_INACTIVE' });
  if (!turnus.currentDayCategories.includes(task.category)) {
    return err({ code: 'TASK_CATEGORY_CLOSED', category: task.category });
  }
  if (task.usedByPlayerIds.includes(player.id)) {
    return err({ code: 'TASK_ALREADY_USED_BY_PLAYER' });
  }
  const holder = takenBy.get(task.id);
  if (holder !== undefined) {
    return err({ code: 'TASK_TAKEN_TODAY', byPlayerName: holder });
  }
  return ok(undefined);
}
