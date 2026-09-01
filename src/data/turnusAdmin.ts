import { type Firestore, updateDoc } from 'firebase/firestore';

import { turnusDoc } from './paths';

/**
 * Admin edits of the turnus game parameters (spec 9.4). A plain write (not a transaction) — it
 * queues offline and syncs later; the rules already restrict a turnus update to its admin. Only the
 * tunable knobs are here; identity (name/slug), the round counter and the day lock are game state,
 * changed by their own actions, never this form.
 */
export interface TurnusSettingsFields {
  readonly startingCoins: number;
  readonly failPenalty: number;
  readonly noPickPenalty: number;
  readonly allowNegativeBalance: boolean;
  readonly maxActiveRewardsPerPlayer: number;
  readonly maxActivePunishesPerPlayer: number;
}

export const updateTurnusSettings = (
  db: Firestore,
  t: string,
  fields: TurnusSettingsFields,
): Promise<void> => updateDoc(turnusDoc(db, t), { ...fields });
