import { type Firestore, limit, orderBy, query } from 'firebase/firestore';

import { eventsCol } from '../paths';
import { type EventDoc, parseEvent } from '../schemas/event';
import { subscribeQuery, type Subscription } from '../subscriptions';

/** The audit log, newest first (spec 15.13). */
export const subscribeRecentEvents = (
  db: Firestore,
  t: string,
  max: number,
  onState: (state: Subscription<readonly EventDoc[]>) => void,
): (() => void) =>
  subscribeQuery(
    query(eventsCol(db, t), orderBy('createdAt', 'desc'), limit(max)),
    parseEvent,
    onState,
  );
