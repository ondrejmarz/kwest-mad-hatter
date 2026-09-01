import { deleteDoc, type Firestore, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';

import type { DomainError } from '../../domain/errors';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { joinAttemptDoc, memberDoc, roleDoc } from '../paths';
import type { Role } from '../schemas/turnus';

/**
 * Turnus entry (spec 3, 11). The client never sees the codes: it writes a joinAttempt, and
 * the rules reject a wrong code as a denied write. Because the client cannot tell which code
 * matched, it tries the player role first, then admin — the rules accept only the right one.
 */
export async function joinTurnus(
  db: Firestore,
  t: string,
  uid: string,
  code: string,
): Promise<Result<Role, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });

  try {
    await setDoc(joinAttemptDoc(db, t, uid), { code });
  } catch {
    return err({ code: 'INVALID_CODE' });
  }

  let joined: Role | null = null;
  for (const role of ['player', 'admin'] as const) {
    const batch = writeBatch(db);
    batch.set(memberDoc(db, t, uid), { role, joinedAt: serverTimestamp() });
    batch.set(roleDoc(db, t, uid), { role });
    try {
      await batch.commit();
      joined = role;
      break;
    } catch {
      // Wrong role for the matched code — try the next candidate.
    }
  }

  await deleteDoc(joinAttemptDoc(db, t, uid)).catch(() => undefined);
  return joined === null ? err({ code: 'INVALID_CODE' }) : ok(joined);
}
