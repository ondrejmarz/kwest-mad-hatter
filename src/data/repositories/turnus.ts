import { type Firestore, getDocs, limit, query, where } from 'firebase/firestore';

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

/** Turnus entry resolves the bookmarkable `/t/{slug}` URL to a turnus (spec 3). */
export async function getTurnusBySlug(db: Firestore, slug: string): Promise<Turnus | null> {
  const snap = await getDocs(query(turnusesCol(db), where('slug', '==', slug), limit(1)));
  const first = snap.docs[0];
  return first ? parseTurnus(first.id, first.data({ serverTimestamps: 'estimate' })) : null;
}

/** The turnus picker lists every non-archived turnus (spec 3a). */
export async function listTurnuses(db: Firestore): Promise<readonly Turnus[]> {
  const snap = await getDocs(query(turnusesCol(db), where('archived', '==', false)));
  return snap.docs
    .map((docSnap) => parseTurnus(docSnap.id, docSnap.data({ serverTimestamps: 'estimate' })))
    .filter((turnus): turnus is Turnus => turnus !== null);
}
