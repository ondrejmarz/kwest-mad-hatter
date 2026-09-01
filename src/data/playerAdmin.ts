import { type Firestore, updateDoc } from 'firebase/firestore';

import { playerDoc } from './paths';

/**
 * Admin renames a character (spec 9.4). A plain write (rules allow admins to update any
 * player field); coin changes go through the `adjustCoins` transaction instead, since
 * those must be floored and written to the audit log with a note.
 */
export const renamePlayer = (
  db: Firestore,
  t: string,
  playerId: string,
  name: string,
): Promise<void> => updateDoc(playerDoc(db, t, playerId), { name });
