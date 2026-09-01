/**
 * Coin derivation (spec 5). One fixed formula, `80 + 20 * difficulty`, so the easiest task pays 100
 * and the hardest (difficulty 6) pays 200. `coinReward` can still be overridden per task in the
 * admin UI (`manualCoins`); the penalty for failing a task is a flat, turnus-wide constant
 * (`failPenalty`), the same for everyone regardless of the task, applied at settlement.
 */

export function deriveReward(difficulty: number): number {
  return 80 + difficulty * 20;
}

/** Clamps a balance to zero when the turnus forbids going negative (spec 6, step 1). */
export function applyFloor(coins: number, allowNegativeBalance: boolean): number {
  return allowNegativeBalance ? coins : Math.max(0, coins);
}
