import { doc, type Firestore, writeBatch } from 'firebase/firestore';

import type { DomainError } from '../../domain/errors';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { eventsCol, playerAuthDoc, playerDoc } from '../paths';

import { actionEvent, type EventMeta } from './shared';

/** Admin rejects a pending player (spec 9.4): remove the character and its auth doc. */
export async function rejectPlayer(
  db: Firestore,
  t: string,
  playerId: string,
  day: number,
  meta: EventMeta,
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });
  const batch = writeBatch(db);
  batch.delete(playerDoc(db, t, playerId));
  batch.delete(playerAuthDoc(db, t, playerId));
  batch.set(doc(eventsCol(db, t)), actionEvent('player_rejected', day, { playerId }, meta));
  await batch.commit();
  return ok(undefined);
}
