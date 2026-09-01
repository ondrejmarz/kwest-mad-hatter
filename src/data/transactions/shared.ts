import { type Firestore, serverTimestamp, type Transaction } from 'firebase/firestore';

import type { GameEvent } from '../../domain/events';
import type { Player } from '../../domain/types';
import { invariant } from '../../lib/invariant';
import { playerDoc, turnusDoc } from '../paths';
import { parsePlayer } from '../schemas/player';
import { parseTurnus, type Turnus } from '../schemas/turnus';

/**
 * Every transaction writes an audit event in the same commit (spec 15.6). `createdAt` is
 * always a server timestamp; the UI renders the localized sentence from `type` + `payload`,
 * so no human text is stored (spec 15.13).
 */
export interface EventMeta {
  readonly actorUid: string;
  readonly actorLabel: string;
}

const stamp = (
  type: string,
  day: number,
  payload: Record<string, unknown>,
  meta: EventMeta,
): Record<string, unknown> => ({
  type,
  day,
  payload,
  actorUid: meta.actorUid,
  actorLabel: meta.actorLabel,
  createdAt: serverTimestamp(),
});

/** A data-layer action event (purchase, approval, adjustment, ...). */
export const actionEvent = (
  type: string,
  day: number,
  payload: Record<string, unknown>,
  meta: EventMeta,
): Record<string, unknown> => stamp(type, day, payload, meta);

/** A domain-emitted rollover event (spec 6), flattened into `type` + `payload`. */
export const domainEvent = (event: GameEvent, meta: EventMeta): Record<string, unknown> => {
  const { type, day, ...payload } = event;
  return stamp(type, day, payload, meta);
};

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
