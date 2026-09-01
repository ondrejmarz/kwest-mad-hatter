import { type Firestore } from 'firebase/firestore';

import type { RewardBid } from '../../domain/types';
import { punishTargetCountsDoc, rewardBidCountsDoc, rewardBidDoc, rewardBidsCol } from '../paths';
import {
  parsePunishTargetCounts,
  parseRewardBid,
  parseRewardBidCounts,
  type PunishTargetCounts,
  type RewardBidCounts,
} from '../schemas/rewardBid';
import { subscribeDoc, subscribeQuery, type Subscription } from '../subscriptions';

/** My own sealed bid for today's auction (spec 8). */
export const subscribeMyBid = (
  db: Firestore,
  t: string,
  playerId: string,
  onState: (state: Subscription<RewardBid | null>) => void,
): (() => void) => subscribeDoc(rewardBidDoc(db, t, playerId), parseRewardBid, onState);

/** Every bid — admin only (rules deny a plain member this whole set), read for evaluation. */
export const subscribeAllBids = (
  db: Firestore,
  t: string,
  onState: (state: Subscription<readonly RewardBid[]>) => void,
): (() => void) => subscribeQuery(rewardBidsCol(db, t), parseRewardBid, onState);

/** Public per-reward interest counts (no bidders, no amounts, spec 8). */
export const subscribeRewardBidCounts = (
  db: Firestore,
  t: string,
  day: number,
  onState: (state: Subscription<RewardBidCounts | null>) => void,
): (() => void) => subscribeDoc(rewardBidCountsDoc(db, t, day), parseRewardBidCounts, onState);

/** Public live per-target punishment tally, so a target can be greyed out once it hits the cap (spec 8). */
export const subscribePunishTargetCounts = (
  db: Firestore,
  t: string,
  day: number,
  onState: (state: Subscription<PunishTargetCounts | null>) => void,
): (() => void) =>
  subscribeDoc(punishTargetCountsDoc(db, t, day), parsePunishTargetCounts, onState);
