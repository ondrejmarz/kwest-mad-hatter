import { err, ok, type Result } from '../lib/result';

import { buildActiveTask } from './activeTask';
import { canPickTaskNow } from './eligibility';
import type { DomainError } from './errors';
import type { TaskId } from './ids';
import type { ActiveTask, Player, Task, TurnusSettings } from './types';

/**
 * Same-day task pick (spec 7): a player who has no task for today claims one first-come. Eligibility
 * is the pure `canPickTaskNow` (day unlocked, task active, its category open today, not already used
 * by this player, and not already taken today); on success we build the denormalized `ActiveTask`
 * snapshot to store on the player. Same-day picks are always solo — groups form through reservations.
 */
export function pickTaskNow(
  player: Player,
  task: Task,
  turnus: TurnusSettings,
  takenBy: ReadonlyMap<TaskId, string>,
): Result<ActiveTask, DomainError> {
  const eligible = canPickTaskNow(player, task, turnus, takenBy);
  if (!eligible.ok) return err(eligible.error);
  return ok(buildActiveTask(task, []));
}
