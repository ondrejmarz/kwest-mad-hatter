import { arrayRemove, type Firestore, writeBatch } from 'firebase/firestore';

import type { DomainError } from '../../domain/errors';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { ownerIndexDoc, playerDoc } from '../paths';

/**
 * A device releases the character it owns (spec 3b) — the inverse of `claimPlayer`, with no PIN
 * (the `releasesOwnership` rule lets a member drop only their own uid). One batch: remove this uid
 * from the player's `ownerUids` and delete the reverse index, so "my player" resolves to none again.
 */
export async function unclaimPlayer(
  db: Firestore,
  t: string,
  playerId: string,
  uid: string,
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });

  const batch = writeBatch(db);
  batch.update(playerDoc(db, t, playerId), { ownerUids: arrayRemove(uid) });
  batch.delete(ownerIndexDoc(db, t, uid));

  try {
    await batch.commit();
    return ok(undefined);
  } catch {
    return err({ code: 'REQUIRES_ONLINE' });
  }
}
