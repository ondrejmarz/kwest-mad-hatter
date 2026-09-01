import type { ActiveTask, Task } from './types';

/**
 * The denormalized task snapshot a player carries once a task is theirs (spec 4). Built the same
 * way wherever a task is handed out — a same-day pick, a same-day pair, or a reservation assigned at
 * evaluation — so the coin values always match the catalog. `partnerNames` lists the co-members
 * (empty for a solo task).
 */
export function buildActiveTask(task: Task, partnerNames: readonly string[]): ActiveTask {
  return {
    taskId: task.id,
    name: task.name,
    description: task.description,
    difficulty: task.difficulty,
    coinReward: task.coinReward,
    partnerNames,
  };
}
