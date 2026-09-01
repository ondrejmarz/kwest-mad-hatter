/**
 * Coin derivation (spec 5). Kept in one place because the coefficients are still
 * being balanced. `coinReward` and `coinPenalty` can be overridden per task in the
 * admin UI; overridden values are not recomputed when coefficients change.
 */

export function deriveReward(difficulty: number, coinsPerDifficulty: number): number {
  return 100 + difficulty * coinsPerDifficulty;
}

export function derivePenalty(reward: number, penaltyRatio: number): number {
  return Math.round(reward * penaltyRatio);
}

/** Clamps a balance to zero when the turnus forbids going negative (spec 6, step 1). */
export function applyFloor(coins: number, allowNegativeBalance: boolean): number {
  return allowNegativeBalance ? coins : Math.max(0, coins);
}
