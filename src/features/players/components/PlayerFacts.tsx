import type { PurchaseDoc } from '../../../data/schemas/purchase';
import type { PlayerId } from '../../../domain/ids';

/**
 * The rewards a player has won and the punishments they are a target of, split out of the public
 * purchases (not refunded). Both a roster row and the profile read the same split, so the views
 * always agree. A won reward is any purchase the player made — a plain reward or a punishment they
 * bought; being a target only comes from someone else's `punish_someone`. (The visual cards live in
 * `PlayerFactCards`.)
 *
 * Only the LATEST evaluation's purchases count — a reward is won at the evening evaluation of a day
 * and "belongs" to the next one, so on day D the relevant purchases are those stamped `day === D-1`;
 * older ones are history (they live in the ledger, not on the card). `currentDay` is the turnus'
 * live day; `null` while it is still loading yields nothing rather than stale rewards from every day.
 */
export function selectPlayerFacts(
  purchases: readonly PurchaseDoc[],
  playerId: PlayerId,
  currentDay: number | null,
): { won: PurchaseDoc[]; targetedBy: PurchaseDoc[] } {
  const won: PurchaseDoc[] = [];
  const targetedBy: PurchaseDoc[] = [];
  if (currentDay === null) return { won, targetedBy };
  const rewardDay = currentDay - 1;
  for (const purchase of purchases) {
    if (purchase.refunded) continue;
    if (purchase.day !== rewardDay) continue;
    if (purchase.buyerId === playerId) won.push(purchase);
    if (purchase.form === 'punish_someone' && purchase.targetIds.includes(playerId)) {
      targetedBy.push(purchase);
    }
  }
  return { won, targetedBy };
}
