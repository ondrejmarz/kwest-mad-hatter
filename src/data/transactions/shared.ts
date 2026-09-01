import { type Firestore, type Transaction } from 'firebase/firestore';

import type { Player } from '../../domain/types';
import { invariant } from '../../lib/invariant';
import { playerDoc, turnusDoc } from '../paths';
import { parsePlayer } from '../schemas/player';
import { parseTurnus, type Turnus } from '../schemas/turnus';

/** Typed turnus read inside a transaction — a corrupt turnus is programmer error, so it throws. */
export async function readTurnus(tx: Transaction, db: Firestore, t: string): Promise<Turnus> {
  const snap = await tx.get(turnusDoc(db, t));
  const turnus = parseTurnus(snap.id, snap.data() ?? {});
  invariant(turnus !== null, 'turnus document is valid');
  return turnus;
}

/** Typed player read inside a transaction. */
export async function readPlayer(
  tx: Transaction,
  db: Firestore,
  t: string,
  playerId: string,
): Promise<Player> {
  const snap = await tx.get(playerDoc(db, t, playerId));
  const player = parsePlayer(snap.id, snap.data() ?? {});
  invariant(player !== null, 'player document is valid');
  return player;
}
