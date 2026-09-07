import type { PurchaseDoc } from '../../../data/schemas/purchase';
import type { PlayerId } from '../../../domain/ids';

/**
 * The rewards a player has won and the punishments they are a target of, split out of the public
 * purchases (not refunded). Both a roster row and the profile read the same split, so the views
 * always agree. A won reward is any purchase the player made — a plain reward or a punishment they
 * bought; being a target only comes from someone else's `punish_someone`. (The visual cards live in
 * `PlayerFactCards`.)
 */
export function selectPlayerFacts(
  purchases: readonly PurchaseDoc[],
  playerId: PlayerId,
): { won: PurchaseDoc[]; targetedBy: PurchaseDoc[] } {
  const won: PurchaseDoc[] = [];
  const targetedBy: PurchaseDoc[] = [];
  for (const purchase of purchases) {
    if (purchase.refunded) continue;
    if (purchase.buyerId === playerId) won.push(purchase);
    if (purchase.form === 'punish_someone' && purchase.targetIds.includes(playerId)) {
      targetedBy.push(purchase);
    }
  }
  return { won, targetedBy };
}
