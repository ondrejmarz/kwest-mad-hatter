import { type Firestore, runTransaction } from 'firebase/firestore';

import type { DomainError } from '../../domain/errors';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { playerDoc } from '../paths';

import { readTurnus } from './shared';

/** Admin approves a pending player: starting coins and a pick prompt (spec 9.4). */
export async function approvePlayer(
  db: Firestore,
  t: string,
  playerId: string,
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });
  await runTransaction(db, async (tx) => {
    const turnus = await readTurnus(tx, db, t);
    tx.update(playerDoc(db, t, playerId), {
      status: 'approved',
      coins: turnus.startingCoins,
      needsPick: true,
    });
  });
  return ok(undefined);
}
