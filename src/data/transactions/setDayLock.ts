import { type Firestore, updateDoc } from 'firebase/firestore';

import type { DomainError } from '../../domain/errors';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { turnusDoc } from '../paths';

/** Admin freezes or reopens today's task selection and purchases (spec, decision). */
export async function setDayLock(
  db: Firestore,
  t: string,
  locked: boolean,
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });
  await updateDoc(turnusDoc(db, t), { dayLocked: locked });
  return ok(undefined);
}
