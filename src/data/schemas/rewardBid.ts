import type { DocumentData } from 'firebase/firestore';
import { z } from 'zod';

import type { RewardBid } from '../../domain/types';

import {
  parseDoc,
  reportSchemaError,
  zDay,
  zPlayerId,
  zRewardId,
  zTimestampMillis,
} from './shared';

/**
 * A sealed auction bid, keyed by its bidder's playerId (the doc id) — a player bids on at most one
 * reward at a time, exactly like a reservation, so the bidder's id is the natural key. Bids are
 * secret: rules expose one only to its bidder and admins, never the amount to anyone else (spec 8).
 */
export const rewardBidSchema = z.object({
  playerId: zPlayerId,
  day: zDay,
  rewardId: zRewardId,
  amount: z.number(),
  createdAt: zTimestampMillis,
});

export const parseRewardBid = (id: string, data: DocumentData): RewardBid | null => {
  const parsed = rewardBidSchema.safeParse({ playerId: id, ...data });
  if (!parsed.success) {
    reportSchemaError('rewardBid', id, parsed.error);
    return null;
  }
  return parsed.data as RewardBid;
};

/** Public aggregate interest per reward — a count only, never bidders or amounts (spec 8). */
export const rewardBidCountsSchema = z.object({
  counts: z.record(z.string(), z.number()),
});
export type RewardBidCounts = z.infer<typeof rewardBidCountsSchema>;

export const parseRewardBidCounts = (id: string, data: DocumentData): RewardBidCounts | null =>
  parseDoc(rewardBidCountsSchema, 'rewardBidCounts', id, data);
