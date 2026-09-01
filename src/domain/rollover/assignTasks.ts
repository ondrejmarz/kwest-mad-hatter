import { invariant } from '../../lib/invariant';
import { gameEvent, type GameEvent } from '../events';
import type { Day, PlayerId, TaskId } from '../ids';
import type { ActiveTask, Task } from '../types';

import type { Claim, PreviewAssignment, PreviewLoss } from './types';

export interface AssignmentResult {
  readonly activeTaskById: ReadonlyMap<PlayerId, ActiveTask>;
  readonly events: readonly GameEvent[];
  readonly assignments: readonly PreviewAssignment[];
  readonly losses: readonly PreviewLoss[];
}

/**
 * Step 3.4 (spec 6): walk claims in order and hand each a still-free task. A pair
 * wins for both partners, each with the full reward; losers fall through with no
 * task and pick up `needsPick` back in `resolveRollover`.
 */
export function assignTasks(
  sortedClaims: readonly Claim[],
  tasksById: ReadonlyMap<TaskId, Task>,
  nameById: ReadonlyMap<PlayerId, string>,
  nextDay: Day,
): AssignmentResult {
  const activeTaskById = new Map<PlayerId, ActiveTask>();
  const takenTasks = new Set<TaskId>();
  const winnerByTask = new Map<TaskId, string>();
  const events: GameEvent[] = [];
  const assignments: PreviewAssignment[] = [];
  const losses: PreviewLoss[] = [];

  for (const claim of sortedClaims) {
    if (takenTasks.has(claim.taskId)) {
      const winnerName = winnerByTask.get(claim.taskId);
      invariant(winnerName !== undefined, 'a taken task recorded its winner');
      for (const playerId of claim.playerIds) {
        events.push(gameEvent.reservationLost(nextDay, playerId, claim.taskId, winnerName));
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
      activeTaskById.set(playerId, buildActiveTask(task, partnerFor(claim, playerId, nameById)));
      events.push(gameEvent.reservationAssigned(nextDay, playerId, claim.taskId, claim.isPair));
      assignments.push({
        playerId,
        playerName: nameOf(nameById, playerId),
        taskId: claim.taskId,
        taskName: claim.taskName,
        isPair: claim.isPair,
      });
    }
  }

  return { activeTaskById, events, assignments, losses };
}

function partnerFor(
  claim: Claim,
  playerId: PlayerId,
  nameById: ReadonlyMap<PlayerId, string>,
): { readonly id: PlayerId; readonly name: string } | undefined {
  if (!claim.isPair) return undefined;
  const other = claim.playerIds.find((id) => id !== playerId);
  invariant(other !== undefined, 'a pair claim contains a partner');
  return { id: other, name: nameOf(nameById, other) };
}

function buildActiveTask(
  task: Task,
  partner: { readonly id: PlayerId; readonly name: string } | undefined,
): ActiveTask {
  const base: Omit<ActiveTask, 'partnerId' | 'partnerName'> = {
    taskId: task.id,
    name: task.name,
    description: task.description,
    difficulty: task.difficulty,
    coinReward: task.coinReward,
    coinPenalty: task.coinPenalty,
    isPair: task.isPair,
  };
  if (partner === undefined) return base;
  return { ...base, partnerId: partner.id, partnerName: partner.name };
}

function nameOf(nameById: ReadonlyMap<PlayerId, string>, playerId: PlayerId): string {
  const name = nameById.get(playerId);
  invariant(name !== undefined, 'every approved player has a name');
  return name;
}
