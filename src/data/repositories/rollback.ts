import { type Firestore } from 'firebase/firestore';

import { rollbackDoc } from '../paths';
import { subscribeDoc, type Subscription } from '../subscriptions';

/**
 * Whether a one-shot undo snapshot is waiting (spec 6, decision A4) — admin only. The
 * snapshot body is never read by the client; the admin just needs to know an undo is
 * available, so the parser collapses the document to `true` (and `null` when it is gone).
 */
export const subscribeRollbackPresence = (
  db: Firestore,
  t: string,
  onState: (state: Subscription<true | null>) => void,
): (() => void) => subscribeDoc(rollbackDoc(db, t), () => true as const, onState);
