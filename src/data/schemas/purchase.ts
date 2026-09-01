import type { DocumentData } from 'firebase/firestore';
import { z } from 'zod';

import { parseDoc, zDay, zLocalizedText, zPlayerId, zRewardId, zTimestampMillis } from './shared';

/**
 * A purchase (spec 4). Superset of the pure `Purchase` type by `createdAt`, which the
 * UI uses to order today's purchases. `punish_all` carries no explicit targets; the
 * UI treats it as everyone-but-the-buyer (spec 8).
 */
export const purchaseSchema = z.object({
  id: z.string(),
  day: zDay,
  buyerId: zPlayerId,
  buyerName: z.string(),
  rewardId: zRewardId,
  rewardName: zLocalizedText,
  description: zLocalizedText,
  price: z.number(),
  form: z.enum(['reward', 'punish_someone', 'punish_all']),
  targetIds: z.array(zPlayerId).readonly(),
  targetNames: z.array(z.string()).readonly(),
  refunded: z.boolean(),
  createdAt: zTimestampMillis,
});

export type PurchaseDoc = z.infer<typeof purchaseSchema>;

export const parsePurchase = (id: string, data: DocumentData): PurchaseDoc | null =>
  parseDoc(purchaseSchema, 'purchase', id, data);
