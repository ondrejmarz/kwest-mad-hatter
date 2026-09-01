import type { DocumentData } from 'firebase/firestore';
import { z } from 'zod';

import { parseDoc, zDay, zPlayerId, zTaskId } from './shared';

/**
 * A same-day task claim (spec 7): the first-come marker for `(day, task)`. A solo pick is claimed
 * and applied at once, so its marker just binds the task to its owner. A pair pick names an
 * `invitee` and stays `accepted: false` until the partner confirms — the marker keeps the task
 * locked meanwhile, and both members get the task when they accept. `id` is `"{day}_{taskId}"`.
 */
export const taskClaimSchema = z.object({
  id: z.string(),
  day: zDay,
  taskId: zTaskId,
  playerId: zPlayerId,
  invitee: zPlayerId.nullable().default(null),
  accepted: z.boolean().default(true),
});

export type TaskClaim = z.infer<typeof taskClaimSchema>;

export const parseTaskClaim = (id: string, data: DocumentData): TaskClaim | null =>
  parseDoc(taskClaimSchema, 'taskClaim', id, data);
