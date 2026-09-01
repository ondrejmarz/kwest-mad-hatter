import {
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
 * A device claims a character (spec 3b). An empty, approved character needs no PIN; adding a
 * device to an owned character sends a PIN attempt the rules verify against the private auth
 * doc. Player + reverse index are written in one batch so the ownerIndex rule sees the new
 * ownerUids via getAfter. (The 5-try/15-min lockout guard lands with the phase-4 claim UI.)
 */
export async function claimPlayer(
  db: Firestore,
  t: string,
  playerId: string,
  uid: string,
  actorLabel: string,
  day: number,
  pin?: string,
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });

  const snap = await getDoc(playerDoc(db, t, playerId));
  const player = parsePlayer(snap.id, snap.data() ?? {});
  invariant(player !== null, 'claimed player exists and is valid');

  if (player.status !== 'approved') return err({ code: 'PLAYER_NOT_APPROVED' });
  if (player.ownerUids.includes(uid)) return ok(undefined);
  if (player.ownerUids.length > 0 && pin === undefined) {
    return err({ code: 'PLAYER_ALREADY_CLAIMED' });
  }

  if (pin !== undefined) {
    await setDoc(claimAttemptDoc(db, t, uid), { pin });
  }
  const batch = writeBatch(db);
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
    // Non-empty owner set with a wrong PIN — the rules denied the write.
    return err({ code: 'PLAYER_ALREADY_CLAIMED' });
  } finally {
    if (pin !== undefined) {
      await deleteDoc(claimAttemptDoc(db, t, uid)).catch(() => undefined);
    }
  }
}
