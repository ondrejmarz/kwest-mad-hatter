import type { Claim } from './types';

/** The fields a deterministic ranking needs — a `Claim`, or one group task's reserver. */
export interface Rankable {
  readonly balance: number;
  readonly createdAt: number;
  readonly key: string;
}

/**
 * Deterministic order (spec 6, step 3): poorer first, then earlier reservation, then lexicographic
 * by key. Never random, so two runs of the same input agree. Shared by claim ordering and by the
 * per-task pooling of group reservations (who fills the last seats).
 */
export function compareClaims(a: Rankable, b: Rankable): number {
  if (a.balance !== b.balance) return a.balance - b.balance;
  if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
  if (a.key < b.key) return -1;
  if (a.key > b.key) return 1;
  return 0;
}

export function sortClaims(claims: readonly Claim[]): readonly Claim[] {
  return [...claims].sort(compareClaims);
}
