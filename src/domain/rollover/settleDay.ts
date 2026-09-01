import { applyFloor } from '../coins';
import { gameEvent } from '../events';
import type { PlayerId } from '../ids';
import type { Player, TurnusSettings } from '../types';

import type { Settlement } from './types';

/**
 * Step 1 (spec 6): pay out completed tasks, penalize failed ones, and dock players
 * who never picked. The balance is floored here so step 3 ranks "who is poorer" on
 * the coins players actually end the day with (spec 6, step 3).
 */
export function settleDay(
  approved: readonly Player[],
  completedPlayerIds: ReadonlySet<PlayerId>,
  turnus: TurnusSettings,
): readonly Settlement[] {
  return approved.map((player) => {
    const before = player.coins;
    const task = player.activeTask;

    if (task === null) {
      const coins = applyFloor(before - turnus.noPickPenalty, turnus.allowNegativeBalance);
      const delta = coins - before;
      return {
        playerId: player.id,
        playerName: player.name,
        coins,
        delta,
        outcome: 'no_task',
        usedTaskId: null,
        event: gameEvent.noTaskPenalty(turnus.currentDay, player.id, delta),
      };
    }

    const completed = completedPlayerIds.has(player.id);
    const nominal = completed ? task.coinReward : -task.coinPenalty;
    const coins = applyFloor(before + nominal, turnus.allowNegativeBalance);
    const delta = coins - before;
    return {
      playerId: player.id,
      playerName: player.name,
      coins,
      delta,
      outcome: completed ? 'completed' : 'failed',
      usedTaskId: task.taskId,
      event: completed
        ? gameEvent.taskCompleted(turnus.currentDay, player.id, task.taskId, delta)
        : gameEvent.taskFailed(turnus.currentDay, player.id, task.taskId, delta),
    };
  });
}
