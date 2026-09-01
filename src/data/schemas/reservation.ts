import type { DocumentData } from 'firebase/firestore';
import { z } from 'zod';

import type { Reservation } from '../../domain/types';

import {
  parseDoc,
  reportSchemaError,
  zDay,
  zLocalizedText,
  zPlayerId,
  zTaskId,
  zTimestampMillis,
} from './shared';

/**
 * A reservation is keyed by its initiator's playerId (the doc id), so the parser maps
 * the id onto `playerId` rather than an `id` field. Reservations are secret — rules
 * expose them only to the initiator, the invited partner and admins (spec 4, 11).
 */
export const reservationSchema = z.object({
  playerId: zPlayerId,
  day: zDay,
  taskId: zTaskId,
  taskName: zLocalizedText,
  minPlayers: z.number(),
  maxPlayers: z.number(),
  invitees: z.array(zPlayerId).readonly(),
  responses: z.record(z.string(), z.enum(['accepted', 'declined'])),
  createdAt: zTimestampMillis,
});

export const parseReservation = (id: string, data: DocumentData): Reservation | null => {
  const parsed = reservationSchema.safeParse({ playerId: id, ...data });
  if (!parsed.success) {
    reportSchemaError('reservation', id, parsed.error);
    return null;
  }
  return parsed.data as Reservation;
};

/** Public aggregate interest per task — counts only, never names (spec 4, 7). */
export const reservationCountsSchema = z.object({
  counts: z.record(z.string(), z.number()),
});
export type ReservationCounts = z.infer<typeof reservationCountsSchema>;

export const parseReservationCounts = (id: string, data: DocumentData): ReservationCounts | null =>
  parseDoc(reservationCountsSchema, 'reservationCounts', id, data);
