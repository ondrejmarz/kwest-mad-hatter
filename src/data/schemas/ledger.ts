import type { DocumentData } from 'firebase/firestore';
import { z } from 'zod';

import { parseDoc, zDay, zLocalizedText, zTimestampMillis } from './shared';

/**
 * A coin-history entry (spec 9.1). A superset of the pure `LedgerEntry` by three storage-only
 * fields: `id`, `createdAt` (server-stamped, orders the history) and `seq` (append order within one
 * transaction, breaking `createdAt` ties so a settlement precedes the reward it paid for). Written
 * only by admin-run transactions; rules expose it to the character's owner and admins.
 */
const entryBase = {
  day: zDay,
  delta: z.number(),
  seq: z.number().default(0),
  createdAt: zTimestampMillis,
};

export const ledgerEntrySchema = z.discriminatedUnion('kind', [
  z.object({
    id: z.string(),
    kind: z.literal('task'),
    taskName: zLocalizedText,
    outcome: z.enum(['completed', 'failed', 'no_task']),
    ...entryBase,
  }),
  z.object({
    id: z.string(),
    kind: z.literal('reward'),
    rewardName: zLocalizedText,
    form: z.enum(['reward', 'punish_someone', 'punish_all']),
    ...entryBase,
  }),
  z.object({
    id: z.string(),
    kind: z.literal('adjust'),
    note: z.string().default(''),
    ...entryBase,
  }),
]);

export type LedgerEntryDoc = z.infer<typeof ledgerEntrySchema>;

export const parseLedgerEntry = (id: string, data: DocumentData): LedgerEntryDoc | null =>
  parseDoc(ledgerEntrySchema, 'ledgerEntry', id, data);
