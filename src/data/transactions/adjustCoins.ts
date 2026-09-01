import { type Firestore, runTransaction } from 'firebase/firestore';

import { applyFloor } from '../../domain/coins';
import type { DomainError } from '../../domain/errors';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { playerDoc } from '../paths';

import { readPlayer, readTurnus } from './shared';

/**
 * Admin manual coin change (spec 9.4) — needed for effects the game decides off-app
 * (e.g. "Raketa"). Respects the floor rule.
 */
export async function adjustCoins(
  db: Firestore,
  t: string,
  playerId: string,
  delta: number,
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });
  await runTransaction(db, async (tx) => {
    const turnus = await readTurnus(tx, db, t);
    const player = await readPlayer(tx, db, t, playerId);
    const coins = applyFloor(player.coins + delta, turnus.allowNegativeBalance);
    tx.update(playerDoc(db, t, playerId), { coins });
  });
  return ok(undefined);
}
