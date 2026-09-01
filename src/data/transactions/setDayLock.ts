import { doc, type Firestore, writeBatch } from 'firebase/firestore';

import type { DomainError } from '../../domain/errors';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { eventsCol, turnusDoc } from '../paths';

import { actionEvent, type EventMeta } from './shared';

/** Admin freezes or reopens today's task selection and purchases (spec, decision). */
export async function setDayLock(
  db: Firestore,
  t: string,
  locked: boolean,
  day: number,
  meta: EventMeta,
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });
  const batch = writeBatch(db);
  batch.update(turnusDoc(db, t), { dayLocked: locked });
  batch.set(
    doc(eventsCol(db, t)),
    actionEvent(locked ? 'day_locked' : 'day_unlocked', day, {}, meta),
  );
  await batch.commit();
  return ok(undefined);
}
