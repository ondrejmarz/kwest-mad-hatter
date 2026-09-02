import { type Firestore } from 'firebase/firestore';

import { playerLedgerCol } from '../paths';
import { type LedgerEntryDoc, parseLedgerEntry } from '../schemas/ledger';
import { subscribeQuery, type Subscription } from '../subscriptions';

/**
 * A player's coin history (spec 9.1) — every entry, unordered; the view sorts by `createdAt`/`seq`.
 * Rules expose the collection only to the character's owner and admins, so this runs on the own
 * card (or for an admin), never for a foreign player.
 */
export const subscribePlayerLedger = (
  db: Firestore,
  t: string,
  playerId: string,
  onState: (state: Subscription<readonly LedgerEntryDoc[]>) => void,
): (() => void) => subscribeQuery(playerLedgerCol(db, t, playerId), parseLedgerEntry, onState);
