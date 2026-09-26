import type { PlayerId, TaskId } from './ids';
import type { ActiveTask, Player, Task } from './types';

/** A co-member handed the same task (its id links the pair, its name is shown on the card). */
export interface TaskPartner {
  readonly id: PlayerId;
  readonly name: string;
}

/**
 * The denormalized task snapshot a player carries once a task is theirs (spec 4). Built the same
 * way wherever a task is handed out — a same-day pick, a same-day pair, or a reservation assigned at
 * evaluation — so the coin values always match the catalog. `partners` are the co-members (empty
 * for a solo task).
 */
export function buildActiveTask(task: Task, partners: readonly TaskPartner[]): ActiveTask {
  return {
    taskId: task.id,
    name: task.name,
    description: task.description,
    difficulty: task.difficulty,
    coinReward: task.coinReward,
    partnerIds: partners.map((partner) => partner.id),
    partnerNames: partners.map((partner) => partner.name),
  };
}

/**
 * The one partner of a pair task — the doc a transaction must read before a player leaves it. A
 * task shared by exactly two players is a pair; solo and larger group tasks have no single partner.
 */
export function pairPartnerOf(task: ActiveTask | null): PlayerId | null {
  if (task === null) return null;
  const [only, ...rest] = task.partnerIds;
  return only !== undefined && rest.length === 0 ? only : null;
}

/**
 * A pair is done together or not at all (spec 7). When a player swaps the pair task they hold in the
 * current round for `nextTaskId`, their partner loses it too. Returns the partner to release — unless
 * the partner moves to the same next task with them (`nextMembers`), or no longer holds the pair task.
 */
export function partnerToRelease(
  current: ActiveTask | null,
  nextTaskId: TaskId,
  nextMembers: readonly PlayerId[],
  partner: Player | null,
): PlayerId | null {
  const partnerId = pairPartnerOf(current);
  if (current === null || partnerId === null || current.taskId === nextTaskId) return null;
  if (nextMembers.includes(partnerId)) return null;
  if (partner === null || partner.id !== partnerId) return null;
  return partner.activeTask?.taskId === current.taskId ? partnerId : null;
}
