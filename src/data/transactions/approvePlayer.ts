import { doc, type Firestore, runTransaction } from 'firebase/firestore';

import type { DomainError } from '../../domain/errors';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { eventsCol, playerDoc } from '../paths';

import { actionEvent, type EventMeta, readTurnus } from './shared';

/** Admin approves a pending player: starting coins and a pick prompt (spec 9.4). */
export async function approvePlayer(
  db: Firestore,
  t: string,
  playerId: string,
  meta: EventMeta,
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });
  await runTransaction(db, async (tx) => {
    const turnus = await readTurnus(tx, db, t);
    tx.update(playerDoc(db, t, playerId), {
      status: 'approved',
      coins: turnus.startingCoins,
      needsPick: true,
    });
    tx.set(
      doc(eventsCol(db, t)),
      actionEvent('player_approved', turnus.currentDay, { playerId }, meta),
    );
  });
  return ok(undefined);
}
