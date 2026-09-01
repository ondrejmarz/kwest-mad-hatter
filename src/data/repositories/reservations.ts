import { type Firestore, query, where } from 'firebase/firestore';

import type { Reservation } from '../../domain/types';
import { reservationCountsDoc, reservationDoc, reservationsCol } from '../paths';
import {
  parseReservation,
  parseReservationCounts,
  type ReservationCounts,
} from '../schemas/reservation';
import { subscribeDoc, subscribeQuery, type Subscription } from '../subscriptions';

/** My own reservation for tomorrow (spec 9.1). */
export const subscribeMyReservation = (
  db: Firestore,
  t: string,
  playerId: string,
  onState: (state: Subscription<Reservation | null>) => void,
): (() => void) => subscribeDoc(reservationDoc(db, t, playerId), parseReservation, onState);

/** Every reservation for tomorrow — admin only (rules deny a plain member this whole set). */
export const subscribeAllReservations = (
  db: Firestore,
  t: string,
  onState: (state: Subscription<readonly Reservation[]>) => void,
): (() => void) => subscribeQuery(reservationsCol(db, t), parseReservation, onState);

/** Pair invites awaiting my response — only pending ones still carry `invitePartnerId`. */
export const subscribePendingInvites = (
  db: Firestore,
  t: string,
  myPlayerId: string,
  onState: (state: Subscription<readonly Reservation[]>) => void,
): (() => void) =>
  subscribeQuery(
    query(reservationsCol(db, t), where('invitePartnerId', '==', myPlayerId)),
    parseReservation,
    onState,
  );

/** Public per-task interest counts (no names, spec 7). */
export const subscribeReservationCounts = (
  db: Firestore,
  t: string,
  day: number,
  onState: (state: Subscription<ReservationCounts | null>) => void,
): (() => void) => subscribeDoc(reservationCountsDoc(db, t, day), parseReservationCounts, onState);
