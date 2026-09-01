import { taskTypeKey } from '../lib/group';
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
  if (!isCategoryOpen(task, turnus.nextDayCategories)) {
    return err({ code: 'TASK_CATEGORY_CLOSED' });
  }
  if (task.usedByPlayerIds.includes(player.id)) {
    return err({ code: 'TASK_ALREADY_USED_BY_PLAYER' });
  }
  return ok(undefined);
}

/**
 * A task is open when any one of its category tags is in the open set, or when its task type is —
 * the open set carries both real tags (matched by their canonical `cs` identity) and the reserved
 * type keys, so opening a type opens every task of that kind (spec 7).
 */
function isCategoryOpen(task: Task, openCategories: readonly string[]): boolean {
  if (task.categories.some((category) => openCategories.includes(category.cs))) return true;
  return openCategories.includes(taskTypeKey(task.minPlayers, task.maxPlayers));
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
  if (!isCategoryOpen(task, turnus.currentDayCategories)) {
    return err({ code: 'TASK_CATEGORY_CLOSED' });
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
