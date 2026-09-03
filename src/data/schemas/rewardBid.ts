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
 * A sealed auction bid — one doc per (player, reward), so a player may bid on several rewards a day
 * (up to `maxActiveRewardsPerPlayer`). The doc id is `${playerId}_${rewardId}`; both ids are stored
 * as fields, so the parser reads them from the data. Bids are secret: rules expose one only to its
 * bidder and admins, never the amount to anyone else (spec 8).
 */
export const rewardBidSchema = z.object({
  playerId: zPlayerId,
  day: zDay,
  rewardId: zRewardId,
  amount: z.number(),
  targetIds: z.array(zPlayerId).readonly().default([]),
  createdAt: zTimestampMillis,
});

export const parseRewardBid = (id: string, data: DocumentData): RewardBid | null => {
  const parsed = rewardBidSchema.safeParse(data);
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

/** Public live tally of how many current bids aim at each player — a count only, no bidders (spec 8). */
export const punishTargetCountsSchema = z.object({
  counts: z.record(z.string(), z.number()),
});
export type PunishTargetCounts = z.infer<typeof punishTargetCountsSchema>;

export const parsePunishTargetCounts = (
  id: string,
  data: DocumentData,
): PunishTargetCounts | null => parseDoc(punishTargetCountsSchema, 'punishTargetCounts', id, data);
