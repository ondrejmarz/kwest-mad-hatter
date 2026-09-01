import { doc, type Firestore, setDoc, updateDoc } from 'firebase/firestore';

import type { LocalizedText, RewardForm } from '../domain/types';

import { defaultTargets } from './importCatalog';
import { rewardDoc, rewardsCol, taskDoc, tasksCol } from './paths';

/**
 * Admin single-item catalog edits behind the per-row pencil (spec 9.4). Plain writes,
 * not transactions, so they queue offline and sync later; rules restrict `tasks`/`rewards`
 * writes to admins. Coins arrive already resolved from the editor: `manualCoins` marks an
 * override so a later TSV re-import will not recompute them (spec 5). Reward target counts
 * are always derived from the form, matching the importer.
 */
export interface TaskFields {
  readonly name: LocalizedText;
  readonly description: LocalizedText;
  readonly categories: readonly LocalizedText[];
  readonly difficulty: number;
  readonly isPair: boolean;
  readonly coinReward: number;
  readonly coinPenalty: number;
  readonly manualCoins: boolean;
  readonly active: boolean;
}

export const createTask = (db: Firestore, t: string, fields: TaskFields): Promise<void> =>
  setDoc(doc(tasksCol(db, t)), { ...fields, usedByPlayerIds: [] });

export const updateTask = (
  db: Firestore,
  t: string,
  taskId: string,
  fields: TaskFields,
): Promise<void> => updateDoc(taskDoc(db, t, taskId), { ...fields });

export interface RewardFields {
  readonly name: LocalizedText;
  readonly description: LocalizedText;
  readonly categories: readonly LocalizedText[];
  readonly price: number;
  readonly form: RewardForm;
  readonly exclusivePerDay: boolean;
  readonly active: boolean;
}

export const createReward = (db: Firestore, t: string, fields: RewardFields): Promise<void> =>
  setDoc(doc(rewardsCol(db, t)), { ...fields, ...defaultTargets(fields.form) });

export const updateReward = (
  db: Firestore,
  t: string,
  rewardId: string,
  fields: RewardFields,
): Promise<void> =>
  updateDoc(rewardDoc(db, t, rewardId), { ...fields, ...defaultTargets(fields.form) });
