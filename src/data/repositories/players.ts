import type { Firestore } from 'firebase/firestore';

import type { Player } from '../../domain/types';
import { playersCol } from '../paths';
import { parsePlayer } from '../schemas/player';
import { subscribeQuery, type Subscription } from '../subscriptions';

/** The main-screen players listener (spec 15.7) — pending and approved; the UI splits them. */
export const subscribePlayers = (
  db: Firestore,
  t: string,
  onState: (state: Subscription<readonly Player[]>) => void,
): (() => void) => subscribeQuery(playersCol(db, t), parsePlayer, onState);
