import { deleteDoc, type Firestore } from 'firebase/firestore';

import type { DomainError } from '../../domain/errors';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { taskClaimDoc } from '../paths';

/**
 * The initiator calls off a same-day pair pick before the partner answers (spec 7). Deleting the
 * claim frees the task for others; the rules let either member of the claim delete it.
 */
export async function cancelPairPick(
  db: Firestore,
  t: string,
  taskId: string,
  day: number,
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });
  await deleteDoc(taskClaimDoc(db, t, day, taskId));
  return ok(undefined);
}
