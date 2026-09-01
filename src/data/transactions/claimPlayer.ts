import {
  arrayRemove,
  arrayUnion,
  deleteDoc,
  doc,
  type Firestore,
  getDoc,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

import type { DomainError } from '../../domain/errors';
import { invariant } from '../../lib/invariant';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { claimAttemptDoc, eventsCol, ownerIndexDoc, playerDoc } from '../paths';
import { parsePlayer } from '../schemas/player';

import { actionEvent } from './shared';

/**
 * A device claims a character (spec 3b). Every claim needs the 4-digit PIN set at character
 * creation — the rules verify a claimAttempt against the private auth doc — so nobody grabs the
 * wrong character. One device owns one character: claiming a new one releases the previous. The
 * release, the add and the reverse index are one batch; the ownerIndex rule sees the new
 * ownerUids via getAfter. (The 5-try/15-min lockout guard is deferred hardening.)
 */
export async function claimPlayer(
  db: Firestore,
  t: string,
  playerId: string,
  uid: string,
  actorLabel: string,
  day: number,
  pin: string,
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });

  const snap = await getDoc(playerDoc(db, t, playerId));
  const player = parsePlayer(snap.id, snap.data() ?? {});
  invariant(player !== null, 'claimed player exists and is valid');

  if (player.status !== 'approved') return err({ code: 'PLAYER_NOT_APPROVED' });
  if (player.ownerUids.includes(uid)) return ok(undefined);

  // One device owns one character — release the previous one, if any.
  const indexSnap = await getDoc(ownerIndexDoc(db, t, uid));
  const previousPlayerId = indexSnap.exists() ? (indexSnap.data().playerId as string) : null;

  await setDoc(claimAttemptDoc(db, t, uid), { pin });
  const batch = writeBatch(db);
  if (previousPlayerId !== null && previousPlayerId !== playerId) {
    batch.update(playerDoc(db, t, previousPlayerId), { ownerUids: arrayRemove(uid) });
  }
  batch.update(playerDoc(db, t, playerId), { ownerUids: arrayUnion(uid) });
  batch.set(ownerIndexDoc(db, t, uid), { playerId });
  batch.set(
    doc(eventsCol(db, t)),
    actionEvent('player_claimed', day, { playerId }, { actorUid: uid, actorLabel }),
  );

  try {
    await batch.commit();
    return ok(undefined);
  } catch {
    // The rules denied it — a wrong PIN (the only gate the user controls).
    return err({ code: 'PLAYER_ALREADY_CLAIMED' });
  } finally {
    await deleteDoc(claimAttemptDoc(db, t, uid)).catch(() => undefined);
  }
}
