import type { DocumentData } from 'firebase/firestore';
import { z } from 'zod';

import { parseDoc, zDay, zPlayerId, zTaskId } from './shared';

/**
 * A same-day task claim (spec 7): the first-come marker for `(day, task)`. A solo pick is claimed
 * and applied at once, so its marker just binds the task to its owner. A pair pick names an
 * `invitee` and stays `accepted: false` until the partner confirms — the marker keeps the task
 * locked meanwhile, and both members get the task when they accept. A partner who declines marks it
 * `declined` instead of deleting it, so both members can still see the answer; a declined marker no
 * longer holds the task and the next claim simply overwrites it. `id` is `"{day}_{taskId}"`.
 */
export const taskClaimSchema = z.object({
  id: z.string(),
  day: zDay,
  taskId: zTaskId,
  playerId: zPlayerId,
  invitee: zPlayerId.nullable().default(null),
  accepted: z.boolean().default(true),
  declined: z.boolean().default(false),
});

export type TaskClaim = z.infer<typeof taskClaimSchema>;

/** Whether a claim still keeps its task from others this round — a declined pair invite does not. */
export function holdsTask(claim: Pick<TaskClaim, 'declined'>): boolean {
  return !claim.declined;
}

export const parseTaskClaim = (id: string, data: DocumentData): TaskClaim | null =>
  parseDoc(taskClaimSchema, 'taskClaim', id, data);
