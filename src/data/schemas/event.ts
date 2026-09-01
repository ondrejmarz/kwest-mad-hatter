import type { DocumentData } from 'firebase/firestore';
import { z } from 'zod';

import { parseDoc, zTimestampMillis } from './shared';

/**
 * The public append-only audit log (spec 4, 15.13). The domain emits `type` + a
 * structured payload; the data layer stamps `actorUid`, a readable `actorLabel` and a
 * server timestamp. The UI renders the localized sentence from `type` + `payload`, so
 * no human text is stored. The type set grows across phases, hence a loose `type`.
 */
export const eventSchema = z.object({
  id: z.string(),
  type: z.string(),
  day: z.number(),
  actorUid: z.string(),
  actorLabel: z.string(),
  payload: z.record(z.string(), z.unknown()),
  createdAt: zTimestampMillis,
});

export type EventDoc = z.infer<typeof eventSchema>;

export const parseEvent = (id: string, data: DocumentData): EventDoc | null =>
  parseDoc(eventSchema, 'event', id, data);
