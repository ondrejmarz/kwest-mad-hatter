import { doc, type Firestore, runTransaction, serverTimestamp } from 'firebase/firestore';

import { applyFloor } from '../../domain/coins';
import type { DomainError } from '../../domain/errors';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { playerDoc, playerLedgerCol } from '../paths';

import { readPlayer, readTurnus } from './shared';

/**
 * Admin manual coin change (spec 9.4) — needed for effects the game decides off-app
 * (e.g. "Raketa"). Respects the floor rule and records the change, with the organizer's `note`, in
 * the player's coin history (spec 9.1); the quick +/- steps pass no note.
 */
export async function adjustCoins(
  db: Firestore,
  t: string,
  playerId: string,
  delta: number,
  note = '',
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });
  await runTransaction(db, async (tx) => {
    const turnus = await readTurnus(tx, db, t);
    const player = await readPlayer(tx, db, t, playerId);
    const coins = applyFloor(player.coins + delta, turnus.allowNegativeBalance);
    tx.update(playerDoc(db, t, playerId), { coins });
    // Record the real, post-floor movement; a change flattened to nothing by the floor writes no
    // entry, so the opening balance derived as `coins − Σ delta` stays exact.
    const applied = coins - player.coins;
    if (applied !== 0) {
      tx.set(doc(playerLedgerCol(db, t, playerId)), {
        kind: 'adjust',
        day: turnus.currentDay,
        delta: applied,
        note,
        seq: 0,
        createdAt: serverTimestamp(),
      });
    }
  });
  return ok(undefined);
}
