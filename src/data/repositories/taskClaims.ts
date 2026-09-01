import type { Firestore } from 'firebase/firestore';

import { taskClaimsCol } from '../paths';
import { parseTaskClaim, type TaskClaim } from '../schemas/taskClaim';
import { subscribeQuery, type Subscription } from '../subscriptions';

/**
 * Every same-day claim in the turnus (member-readable). The pending pair picks are a small subset,
 * so the provider filters this list for the player's own outgoing pick and any invite aimed at
 * them, rather than running two indexed queries.
 */
export const subscribeTaskClaims = (
  db: Firestore,
  t: string,
  onState: (state: Subscription<readonly TaskClaim[]>) => void,
): (() => void) => subscribeQuery(taskClaimsCol(db, t), parseTaskClaim, onState);
