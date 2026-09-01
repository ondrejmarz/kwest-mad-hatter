import { doc, type Firestore, writeBatch } from 'firebase/firestore';

import type { DomainError } from '../../domain/errors';
import { err, ok, type Result } from '../../lib/result';
import { isOnline } from '../../platform/connectivity/isOnline';
import { eventsCol, turnusDoc } from '../paths';

import { actionEvent, type EventMeta } from './shared';

/**
 * Admin sets the categories open for tomorrow's reservations, and (to bootstrap day 1)
 * may set today's categories directly (spec, decision A5).
 */
export async function setCategories(
  db: Firestore,
  t: string,
  categories: { readonly nextDay?: readonly string[]; readonly currentDay?: readonly string[] },
  day: number,
  meta: EventMeta,
): Promise<Result<void, DomainError>> {
  if (!isOnline()) return err({ code: 'REQUIRES_ONLINE' });
  const update: Record<string, unknown> = {};
  if (categories.nextDay !== undefined) update.nextDayCategories = categories.nextDay;
  if (categories.currentDay !== undefined) update.currentDayCategories = categories.currentDay;

  const batch = writeBatch(db);
  batch.update(turnusDoc(db, t), update);
  batch.set(doc(eventsCol(db, t)), actionEvent('categories_set', day, { ...update }, meta));
  await batch.commit();
  return ok(undefined);
}
