import { type DocumentData, Timestamp } from 'firebase/firestore';
import { z } from 'zod';

import { Day, PlayerId, RewardId, TaskId, TurnusId } from '../../domain/ids';

/**
 * Zod is the single source of truth for the shape of data read from Firestore
 * (spec 15.6). Ids are branded on the way out via the domain constructors, so a
 * parsed document already carries `PlayerId`/`TaskId`/... — no casting downstream.
 * The domain types are NOT inferred from zod (domain must not depend on zod); a
 * compatibility test keeps the two shapes in sync instead.
 */
export const zPlayerId = z.string().min(1).transform(PlayerId);
export const zTaskId = z.string().min(1).transform(TaskId);
export const zRewardId = z.string().min(1).transform(RewardId);
export const zTurnusId = z.string().min(1).transform(TurnusId);
export const zDay = z.number().int().transform(Day);

/**
 * Trilingual user text (spec 1). `cs` is required — it is the fallback and the category
 * identity; `en`/`de` default to empty so a document written in one language still parses,
 * and the UI falls back to `cs` at display.
 */
export const zLocalizedText = z.object({
  cs: z.string(),
  en: z.string().default(''),
  de: z.string().default(''),
});

/**
 * Firestore `serverTimestamp()` reads back as a `Timestamp`; the domain works in
 * plain millis (spec 15.5). Repositories read with `serverTimestamps: 'estimate'`
 * so a just-written pending value is a local estimate, never null.
 */
export const zTimestampMillis = z.instanceof(Timestamp).transform((value) => value.toMillis());

/**
 * A single malformed document (a manual console edit at midnight at camp) must never
 * crash a screen — converters log and skip it instead (spec 15.6).
 */
export function reportSchemaError(kind: string, id: string, error: z.ZodError): void {
  // Surface bad data without crashing the UI (spec 15.6).
  console.error(`[schema] dropping invalid ${kind} "${id}":`, error.issues);
}

/**
 * Validate a snapshot (`{ id, ...data }`) against a schema. On failure it logs and
 * returns null so a repository can skip the document — one bad row never crashes a
 * screen (spec 15.6). Callers re-assert the branded domain type.
 */
export function parseDoc<S extends z.ZodType>(
  schema: S,
  kind: string,
  id: string,
  data: DocumentData,
): z.infer<S> | null {
  const parsed = schema.safeParse({ id, ...data });
  if (!parsed.success) {
    reportSchemaError(kind, id, parsed.error);
    return null;
  }
  return parsed.data;
}
