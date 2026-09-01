import type { DocumentData } from 'firebase/firestore';
import { z } from 'zod';

import type { Player } from '../../domain/types';

import { parseDoc, zPlayerId, zTaskId } from './shared';

/** Denormalized task snapshot stored on the player (spec 4). */
export const activeTaskSchema = z.object({
  taskId: zTaskId,
  name: z.string(),
  description: z.string(),
  category: z.string(),
  difficulty: z.number(),
  coinReward: z.number(),
  coinPenalty: z.number(),
  isPair: z.boolean(),
  partnerId: zPlayerId.optional(),
  partnerName: z.string().optional(),
  detail: z.string().optional(),
});

export const playerSchema = z.object({
  id: zPlayerId,
  name: z.string(),
  coins: z.number(),
  status: z.enum(['pending', 'approved']),
  ownerUids: z.array(z.string()).readonly(),
  needsPick: z.boolean(),
  activeTask: activeTaskSchema.nullable(),
});

/** Recovery PIN lives in a private subdoc that no client (not even the owner) may read. */
export const playerAuthSchema = z.object({
  recoveryPin: z.string().regex(/^\d{4}$/),
});

export const parsePlayer = (id: string, data: DocumentData): Player | null =>
  parseDoc(playerSchema, 'player', id, data) as Player | null;
