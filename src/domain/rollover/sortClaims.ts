import type { Claim } from './types';

/**
 * Deterministic claim order (spec 6, step 3): poorer first, then earlier reservation,
 * then lexicographic by player key. Never random, so two runs of the same input agree.
 */
export function compareClaims(a: Claim, b: Claim): number {
  if (a.balance !== b.balance) return a.balance - b.balance;
  if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
  if (a.key < b.key) return -1;
  if (a.key > b.key) return 1;
  return 0;
}

export function sortClaims(claims: readonly Claim[]): readonly Claim[] {
  return [...claims].sort(compareClaims);
}
