import type { PlayerId, RewardId } from '../ids';

/** One winning `punish_someone` auction, with the buyer's intended targets from their bid. */
export interface PunishWin {
  readonly rewardId: RewardId;
  readonly buyerId: PlayerId;
  readonly amount: number;
  readonly createdAt: number;
  readonly minTargets: number;
  readonly maxTargets: number;
  readonly picks: readonly PlayerId[];
}

/**
 * A tiny FNV-1a-style hash of `id` mixed with `seed`. It gives the auto-fill a stable but
 * seed-dependent order, so the filler picks rotate day to day instead of always landing on the
 * lowest-id players — fair, yet without reaching for `Math.random` (the domain must stay pure).
 */
function shuffleKey(id: string, seed: number): number {
  let h = (2166136261 ^ seed) >>> 0;
  for (let i = 0; i < id.length; i += 1) {
    h = Math.imul(h ^ id.charCodeAt(i), 16777619) >>> 0;
  }
  return h;
}

/**
 * Decide the final targets of each winning `punish_someone` (spec 8). Winners are handled
 * highest-bid-first (ties: earlier bid, then id), so when two punishments want the same person the
 * bigger spender claims them. A person may be targeted at most `cap` times a day
 * (`maxActivePunishesPerPlayer`); a buyer's over-capped picks are dropped and the shortfall topped
 * up to `minTargets` from whoever is still free — least-targeted first, then a `seed`-shuffled order
 * (the day) so the auto-fill spreads fairly across players. Targets are always approved players
 * other than the buyer.
 */
export function assignPunishTargets(
  punishWins: readonly PunishWin[],
  cap: number,
  approvedIds: readonly PlayerId[],
  seed: number,
): ReadonlyMap<RewardId, readonly PlayerId[]> {
  const pool = new Set(approvedIds);
  const count = new Map<PlayerId, number>();
  const result = new Map<RewardId, readonly PlayerId[]>();

  const ordered = [...punishWins].sort(
    (a, b) => b.amount - a.amount || a.createdAt - b.createdAt || (a.buyerId < b.buyerId ? -1 : 1),
  );

  for (const win of ordered) {
    const assigned: PlayerId[] = [];
    const free = (id: PlayerId): boolean =>
      id !== win.buyerId && pool.has(id) && !assigned.includes(id) && (count.get(id) ?? 0) < cap;

    for (const pick of win.picks) {
      if (assigned.length >= win.maxTargets) break;
      if (free(pick)) assigned.push(pick);
    }
    if (assigned.length < win.minTargets) {
      const fillers = [...approvedIds]
        .filter(free)
        .sort(
          (a, b) =>
            (count.get(a) ?? 0) - (count.get(b) ?? 0) || shuffleKey(a, seed) - shuffleKey(b, seed),
        );
      for (const filler of fillers) {
        if (assigned.length >= win.minTargets) break;
        assigned.push(filler);
      }
    }
    for (const id of assigned) count.set(id, (count.get(id) ?? 0) + 1);
    result.set(win.rewardId, assigned);
  }

  return result;
}
