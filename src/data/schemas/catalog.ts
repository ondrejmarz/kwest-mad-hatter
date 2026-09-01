import type { DocumentData } from 'firebase/firestore';
import { z } from 'zod';

import type { Reward, Task } from '../../domain/types';

import { parseDoc, zPlayerId, zRewardId, zTaskId } from './shared';

/**
 * Turnus-scoped catalog copies (spec 4). `manualCoins` marks a task whose coins were
 * overridden by an admin and must not be recomputed when coefficients change (spec 5);
 * it lives only on the document, not in the pure `Task` type.
 */
export const taskSchema = z.object({
  id: zTaskId,
  name: z.string(),
  description: z.string(),
  category: z.string(),
  difficulty: z.number(),
  isPair: z.boolean(),
  coinReward: z.number(),
  coinPenalty: z.number(),
  usedByPlayerIds: z.array(zPlayerId).readonly(),
  active: z.boolean(),
  manualCoins: z.boolean(),
});

export type TaskDoc = z.infer<typeof taskSchema>;

export const parseTask = (id: string, data: DocumentData): Task | null =>
  parseDoc(taskSchema, 'task', id, data) as Task | null;

/** Full document incl. `manualCoins` — used by the importer to preserve overridden coins. */
export const parseTaskDoc = (id: string, data: DocumentData): TaskDoc | null =>
  parseDoc(taskSchema, 'task', id, data);

export const rewardSchema = z.object({
  id: zRewardId,
  name: z.string(),
  description: z.string(),
  price: z.number(),
  form: z.enum(['reward', 'punish_someone', 'punish_all']),
  minTargets: z.number(),
  maxTargets: z.number(),
  exclusivePerDay: z.boolean(),
  active: z.boolean(),
});

export const parseReward = (id: string, data: DocumentData): Reward | null =>
  parseDoc(rewardSchema, 'reward', id, data) as Reward | null;
