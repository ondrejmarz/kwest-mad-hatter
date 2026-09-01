import { type Firestore, query, where } from 'firebase/firestore';

import { purchasesCol } from '../paths';
import { parsePurchase, type PurchaseDoc } from '../schemas/purchase';
import { subscribeQuery, type Subscription } from '../subscriptions';

/** Today's purchases (spec 15.7) — filtered by day; the UI orders by `createdAt`. */
export const subscribePurchasesForDay = (
  db: Firestore,
  t: string,
  day: number,
  onState: (state: Subscription<readonly PurchaseDoc[]>) => void,
): (() => void) =>
  subscribeQuery(query(purchasesCol(db, t), where('day', '==', day)), parsePurchase, onState);

/** Every owned reward in the turnus — backs the "has a reward" chip on every player (spec 8). */
export const subscribeAllPurchases = (
  db: Firestore,
  t: string,
  onState: (state: Subscription<readonly PurchaseDoc[]>) => void,
): (() => void) => subscribeQuery(purchasesCol(db, t), parsePurchase, onState);
