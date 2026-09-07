import { type Firestore, getDoc, getDocs, query, where } from 'firebase/firestore';

import { roleDoc, turnusDoc, turnusesCol } from '../paths';
import { parseRole, parseTurnus, type Role, type Turnus } from '../schemas/turnus';
import { subscribeDoc, type Subscription } from '../subscriptions';

export const subscribeTurnus = (
  db: Firestore,
  t: string,
  onState: (state: Subscription<Turnus | null>) => void,
): (() => void) => subscribeDoc(turnusDoc(db, t), parseTurnus, onState);

/** The client learns its own role from `roles/{uid}` (members are rules-only, spec 4). */
export const subscribeMyRole = (
  db: Firestore,
  t: string,
  uid: string,
  onState: (state: Subscription<Role | null>) => void,
): (() => void) => subscribeDoc(roleDoc(db, t, uid), parseRole, onState);

/**
 * A one-shot read of this device's role in a turnus (spec 3) — used to skip the code prompt when a
 * device already belongs to the group it tapped. `null` means "not a member" (needs the code).
 */
export async function getMyRole(db: Firestore, t: string, uid: string): Promise<Role | null> {
  const snap = await getDoc(roleDoc(db, t, uid));
  return snap.exists() ? parseRole(snap.id, snap.data()) : null;
}

/** The turnus picker lists every non-archived turnus (spec 3a). */
export async function listTurnuses(db: Firestore): Promise<readonly Turnus[]> {
  const snap = await getDocs(query(turnusesCol(db), where('archived', '==', false)));
  return snap.docs
    .map((docSnap) => parseTurnus(docSnap.id, docSnap.data({ serverTimestamps: 'estimate' })))
    .filter((turnus): turnus is Turnus => turnus !== null);
}
