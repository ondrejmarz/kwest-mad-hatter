import { type Firestore, writeBatch } from 'firebase/firestore';

import type { DomainError } from '../../domain/errors';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { memberDoc, roleDoc } from '../paths';

/**
 * Step down from admin back to a regular player (spec 3c) — the reverse of the hidden admin unlock.
 * Both the members doc (rules-only) and the mirrored roles doc drop to `player` in one batch; the
 * rules allow this self-downgrade without the admin code, since reducing your own privileges is
 * always safe. The turnus keeps its admin code, so admin can be unlocked again later.
 */
export async function leaveAdmin(
  db: Firestore,
  t: string,
  uid: string,
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });
  const batch = writeBatch(db);
  batch.update(memberDoc(db, t, uid), { role: 'player' });
  batch.update(roleDoc(db, t, uid), { role: 'player' });
  try {
    await batch.commit();
    return ok(undefined);
  } catch {
    return err({ code: 'REQUIRES_ONLINE' });
  }
}
