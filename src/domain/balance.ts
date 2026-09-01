import type { Player, TurnusSettings } from './types';

/**
 * Powers the player-detail balance breakdown (spec 9.1): current coins, the swing
 * from today's task, and the resulting best/worst estimate. Purchases already left
 * the balance when they were bought, so they are baked into `current`.
 */
export interface BalanceProjection {
  readonly current: number;
  readonly taskReward: number;
  readonly taskPenalty: number;
  readonly noPickPenalty: number;
  readonly bestCase: number;
  readonly worstCase: number;
}

export function projectBalance(player: Player, turnus: TurnusSettings): BalanceProjection {
  const current = player.coins;
  const task = player.activeTask;
  const taskReward = task ? task.coinReward : 0;
  const taskPenalty = task ? task.coinPenalty : 0;
  // A player who never picks a task takes the no-pick penalty at evaluation (spec, C).
  const noPickPenalty = !task && player.status === 'approved' ? turnus.noPickPenalty : 0;

  const bestCase = current + taskReward;
  const rawWorst = current - (task ? taskPenalty : noPickPenalty);
  const worstCase = turnus.allowNegativeBalance ? rawWorst : Math.max(0, rawWorst);

  return { current, taskReward, taskPenalty, noPickPenalty, bestCase, worstCase };
}
