import { doc, type Firestore, writeBatch } from 'firebase/firestore';

import type { DomainError } from '../../domain/errors';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { playerAuthDoc, playersCol } from '../paths';

/**
 * "Add player" (spec 9.1): anyone in the turnus creates a pending character with a recovery
 * PIN; it waits for admin approval. Player doc and its private auth doc are one atomic batch.
 */
export async function createPlayer(
  db: Firestore,
  t: string,
  name: string,
  pin: string,
  createdByUid: string,
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });
  const ref = doc(playersCol(db, t));
  const batch = writeBatch(db);
  batch.set(ref, {
    name,
    coins: 0,
    status: 'pending',
    ownerUids: [],
    needsPick: false,
    activeTask: null,
    createdByUid,
  });
  batch.set(playerAuthDoc(db, t, ref.id), { recoveryPin: pin });
  await batch.commit();
  return ok(undefined);
}
