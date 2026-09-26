import { holdsTask, type TaskClaim } from '../../data/schemas/taskClaim';
import type { PlayerId, TaskId } from '../../domain/ids';
import type { LocalizedText, Player, Task } from '../../domain/types';
import { localize } from '../../i18n/localize';
import type { Locale } from '../../i18n/translate';
import { csCollator } from '../../lib/collator';
import { byNumber, byText } from '../../lib/sort';

/** The task list's sort options (spec 9.2), in dropdown order. */
export const TASK_SORTS = [
  'nameAsc',
  'nameDesc',
  'difficultyAsc',
  'difficultyDesc',
  'coinsDesc',
  'coinsAsc',
] as const;
export type TaskSort = (typeof TASK_SORTS)[number];

export function taskComparator(sort: TaskSort, locale: Locale): (a: Task, b: Task) => number {
  switch (sort) {
    case 'nameAsc':
      return byText((task) => localize(task.name, locale), 'asc');
    case 'nameDesc':
      return byText((task) => localize(task.name, locale), 'desc');
    case 'difficultyAsc':
      return byNumber((task) => task.difficulty, 'asc');
    case 'difficultyDesc':
      return byNumber((task) => task.difficulty, 'desc');
    case 'coinsDesc':
      return byNumber((task) => task.coinReward, 'desc');
    case 'coinsAsc':
      return byNumber((task) => task.coinReward, 'asc');
  }
}

/** Distinct category tags across the tasks, keyed by their canonical `cs` identity, sorted. */
export function taskCategories(tasks: readonly Task[], locale: Locale): readonly LocalizedText[] {
  const byCs = new Map<string, LocalizedText>();
  for (const task of tasks) {
    for (const category of task.categories) {
      if (!byCs.has(category.cs)) byCs.set(category.cs, category);
    }
  }
  return [...byCs.values()].sort((a, b) =>
    csCollator.compare(localize(a, locale), localize(b, locale)),
  );
}

/**
 * Which tasks someone else holds in the current round, with the holder's name (spec 7) — it powers
 * the "taken" chip and gates taking a task for the round. A task is taken when another player has it
 * as their active task, and also while another player's same-round pair invite on it waits for an
 * answer, since its claim marker already locks the task; a declined one frees it. Invites this player
 * sent or received don't count: those are theirs to answer. Derived from live public data, not a
 * separate listener.
 */
export function takenInRoundBy(
  players: readonly Player[],
  claims: readonly TaskClaim[],
  myPlayerId: PlayerId | null,
  currentDay: number | null,
): ReadonlyMap<TaskId, string> {
  const taken = new Map<TaskId, string>();
  for (const player of players) {
    if (player.activeTask !== null && player.id !== myPlayerId) {
      taken.set(player.activeTask.taskId, player.name);
    }
  }
  const nameById = new Map(players.map((player) => [player.id, player.name] as const));
  for (const claim of claims) {
    const pending =
      claim.day === currentDay && claim.invitee !== null && !claim.accepted && holdsTask(claim);
    const mine = claim.playerId === myPlayerId || claim.invitee === myPlayerId;
    if (pending && !mine && !taken.has(claim.taskId)) {
      taken.set(claim.taskId, nameById.get(claim.playerId) ?? '');
    }
  }
  return taken;
}
