import { type Firestore, writeBatch } from 'firebase/firestore';

import type { DomainError } from '../../domain/errors';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { playerAuthDoc, playerDoc } from '../paths';

/** Admin rejects a pending player (spec 9.4): remove the character and its auth doc. */
export async function rejectPlayer(
  db: Firestore,
  t: string,
  playerId: string,
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });
  const batch = writeBatch(db);
  batch.delete(playerDoc(db, t, playerId));
  batch.delete(playerAuthDoc(db, t, playerId));
  await batch.commit();
  return ok(undefined);
}
