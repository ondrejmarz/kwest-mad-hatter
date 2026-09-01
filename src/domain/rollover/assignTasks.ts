import { invariant } from '../../lib/invariant';
import { buildActiveTask } from '../activeTask';
import type { PlayerId, TaskId } from '../ids';
import type { ActiveTask, Task } from '../types';

import type { Claim, PreviewAssignment, PreviewLoss } from './types';

export interface AssignmentResult {
  readonly activeTaskById: ReadonlyMap<PlayerId, ActiveTask>;
  readonly assignments: readonly PreviewAssignment[];
  readonly losses: readonly PreviewLoss[];
}

/**
 * Step 3.4 (spec 6): walk claims in order and hand each a still-free task. A group wins for all
 * its members, each with the full reward and the others listed as partners; losers fall through
 * with no task and pick up `needsPick` back in `resolveRollover`.
 */
export function assignTasks(
  sortedClaims: readonly Claim[],
  tasksById: ReadonlyMap<TaskId, Task>,
  nameById: ReadonlyMap<PlayerId, string>,
): AssignmentResult {
  const activeTaskById = new Map<PlayerId, ActiveTask>();
  const takenTasks = new Set<TaskId>();
  const winnerByTask = new Map<TaskId, string>();
  const assignments: PreviewAssignment[] = [];
  const losses: PreviewLoss[] = [];

  for (const claim of sortedClaims) {
    const isGroup = claim.playerIds.length > 1;

    if (takenTasks.has(claim.taskId)) {
      const winnerName = winnerByTask.get(claim.taskId);
      invariant(winnerName !== undefined, 'a taken task recorded its winner');
      for (const playerId of claim.playerIds) {
        losses.push({
          playerId,
          playerName: nameOf(nameById, playerId),
          taskName: claim.taskName,
          winnerName,
        });
      }
      continue;
    }

    const task = tasksById.get(claim.taskId);
    invariant(task !== undefined, 'a claimed task exists in the catalog');
    takenTasks.add(claim.taskId);
    winnerByTask.set(claim.taskId, claim.playerIds.map((id) => nameOf(nameById, id)).join(' & '));

    for (const playerId of claim.playerIds) {
      const partnerNames = claim.playerIds
        .filter((id) => id !== playerId)
        .map((id) => nameOf(nameById, id));
      activeTaskById.set(playerId, buildActiveTask(task, partnerNames));
      assignments.push({
        playerId,
        playerName: nameOf(nameById, playerId),
        taskId: claim.taskId,
        taskName: claim.taskName,
        isGroup,
      });
    }
  }

  return { activeTaskById, assignments, losses };
}

function nameOf(nameById: ReadonlyMap<PlayerId, string>, playerId: PlayerId): string {
  const name = nameById.get(playerId);
  invariant(name !== undefined, 'every approved player has a name');
  return name;
}
