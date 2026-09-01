import type { DocumentData } from 'firebase/firestore';
import { z } from 'zod';

import { parseDoc } from './shared';

/**
 * One bidder's punishment history (spec 8): the set of players they have ever aimed a
 * `punish_someone` bid at this turnus, keyed by target id. A (bidder, target) pair may be chosen
 * only once — win or lose — so the dialog disables targets already in here. The doc id is the
 * bidder's playerId; `targets` defaults to empty for a bidder who has never punished.
 */
export const punishHistorySchema = z.object({
  targets: z.record(z.string(), z.boolean()).default({}),
});

export type PunishHistory = z.infer<typeof punishHistorySchema>;

export const parsePunishHistory = (id: string, data: DocumentData): PunishHistory | null =>
  parseDoc(punishHistorySchema, 'punishHistory', id, data);

/** The target ids marked true — the players this bidder has already punished. */
export const usedTargetsOf = (history: PunishHistory | null): readonly string[] =>
  history === null ? [] : Object.keys(history.targets).filter((id) => history.targets[id] === true);
