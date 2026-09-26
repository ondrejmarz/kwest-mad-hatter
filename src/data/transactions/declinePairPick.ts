import { type Firestore, updateDoc } from 'firebase/firestore';

import type { DomainError } from '../../domain/errors';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { taskClaimDoc } from '../paths';

/**
 * The invited partner declines a same-day pair pick (spec 7). The claim is marked `declined` rather
 * than deleted, so the initiator sees the answer too; a declined claim no longer holds the task, so
 * it is free for others at once. The rules let only the invitee flip it, and only while pending.
 */
export async function declinePairPick(
  db: Firestore,
  t: string,
  taskId: string,
  day: number,
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });
  await updateDoc(taskClaimDoc(db, t, day, taskId), { declined: true });
  return ok(undefined);
}
