import { deleteDoc, type Firestore } from 'firebase/firestore';

import type { DomainError } from '../../domain/errors';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { taskClaimDoc } from '../paths';

/**
 * Drop a pending same-day pair pick (spec 7): the invited partner declines, or the initiator cancels
 * before it is accepted. Deleting the claim frees the task for others. The rules let either member
 * of the claim delete it.
 */
export async function declinePairPick(
  db: Firestore,
  t: string,
  taskId: string,
  day: number,
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });
  await deleteDoc(taskClaimDoc(db, t, day, taskId));
  return ok(undefined);
}
