import { doc, type Firestore, getDocs, writeBatch } from 'firebase/firestore';

import { derivePenalty, deriveReward } from '../domain/coins';
import type { RewardForm } from '../domain/types';

import { rewardDoc, rewardsCol, taskDoc, tasksCol } from './paths';
import { parseReward, parseTaskDoc } from './schemas/catalog';

/**
 * TSV catalog import (spec 10). Pasting from a spreadsheet, tab-separated. Matching is by
 * name so a re-import updates existing rows without losing their state — `usedByPlayerIds`,
 * `active` and overridden coins (`manualCoins`) are preserved; auto coins are recomputed.
 */
export interface ParsedTask {
  readonly name: string;
  readonly description: string;
  readonly difficulty: number;
  readonly isPair: boolean;
  readonly category: string;
}

export interface ParsedReward {
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly form: RewardForm;
}

function rows(tsv: string): string[] {
  return tsv
    .split('\n')
    .map((line) => line.replace(/\r$/, ''))
    .filter((line) => line.trim().length > 0);
}

function clampDifficulty(raw: string): number {
  const value = Number.parseInt(raw, 10);
  return Number.isNaN(value) ? 1 : Math.min(6, Math.max(1, value));
}

export function parseTasks(tsv: string): ParsedTask[] {
  return rows(tsv)
    .map((line) => {
      const [name = '', description = '', difficulty = '', pair = '', category = ''] =
        line.split('\t');
      return {
        name: name.trim(),
        description: description.trim(),
        difficulty: clampDifficulty(difficulty),
        isPair: pair.trim().toLowerCase() === 'ano',
        category: category.trim() || 'Ostatní',
      };
    })
    .filter((task) => task.name.length > 0);
}

const REWARD_FORMS: Record<string, RewardForm> = {
  'Trest pro někoho': 'punish_someone',
  'Trest pro všechny': 'punish_all',
  Odměna: 'reward',
};

/**
 * Target counts implied by a reward's form: only "punish someone" needs exactly one
 * target picked at purchase; a plain reward and "punish all" carry none. Shared by the
 * importer and the admin reward editor so both stay in step (spec 9.3).
 */
export function defaultTargets(form: RewardForm): { minTargets: number; maxTargets: number } {
  return form === 'punish_someone'
    ? { minTargets: 1, maxTargets: 1 }
    : { minTargets: 0, maxTargets: 0 };
}

export function parseRewards(tsv: string): ParsedReward[] {
  return rows(tsv)
    .map((line) => {
      const [name = '', description = '', price = '', form = ''] = line.split('\t');
      return {
        name: name.trim(),
        description: description.trim(),
        price: Math.max(0, Number.parseInt(price, 10) || 0),
        form: REWARD_FORMS[form.trim()] ?? 'reward',
      };
    })
    .filter((reward) => reward.name.length > 0);
}

/** Split parsed rows into new vs. existing by name — drives the import preview (spec 10). */
export function splitByName<P extends { readonly name: string }>(
  parsed: readonly P[],
  existingNames: ReadonlySet<string>,
): { toCreate: readonly P[]; toUpdate: readonly P[] } {
  const toCreate: P[] = [];
  const toUpdate: P[] = [];
  for (const item of parsed) {
    (existingNames.has(item.name) ? toUpdate : toCreate).push(item);
  }
  return { toCreate, toUpdate };
}

export async function applyTaskImport(
  db: Firestore,
  t: string,
  parsed: readonly ParsedTask[],
  coinsPerDifficulty: number,
  penaltyRatio: number,
): Promise<{ created: number; updated: number }> {
  const snap = await getDocs(tasksCol(db, t));
  const existing = new Map<string, { id: string; manualCoins: boolean }>();
  for (const docSnap of snap.docs) {
    const parsedDoc = parseTaskDoc(docSnap.id, docSnap.data());
    if (parsedDoc)
      existing.set(parsedDoc.name, { id: docSnap.id, manualCoins: parsedDoc.manualCoins });
  }

  const batch = writeBatch(db);
  let created = 0;
  let updated = 0;
  for (const task of parsed) {
    const coinReward = deriveReward(task.difficulty, coinsPerDifficulty);
    const coinPenalty = derivePenalty(coinReward, penaltyRatio);
    const match = existing.get(task.name);
    if (match) {
      const fields: Record<string, unknown> = {
        name: task.name,
        description: task.description,
        difficulty: task.difficulty,
        isPair: task.isPair,
        category: task.category,
      };
      if (!match.manualCoins) {
        fields.coinReward = coinReward;
        fields.coinPenalty = coinPenalty;
      }
      batch.update(taskDoc(db, t, match.id), fields);
      updated += 1;
    } else {
      batch.set(doc(tasksCol(db, t)), {
        ...task,
        coinReward,
        coinPenalty,
        usedByPlayerIds: [],
        active: true,
        manualCoins: false,
      });
      created += 1;
    }
  }
  await batch.commit();
  return { created, updated };
}

export async function applyRewardImport(
  db: Firestore,
  t: string,
  parsed: readonly ParsedReward[],
): Promise<{ created: number; updated: number }> {
  const snap = await getDocs(rewardsCol(db, t));
  const existing = new Map<string, string>();
  for (const docSnap of snap.docs) {
    const reward = parseReward(docSnap.id, docSnap.data());
    if (reward) existing.set(reward.name, docSnap.id);
  }

  const batch = writeBatch(db);
  let created = 0;
  let updated = 0;
  for (const reward of parsed) {
    const id = existing.get(reward.name);
    if (id !== undefined) {
      batch.update(rewardDoc(db, t, id), {
        name: reward.name,
        description: reward.description,
        price: reward.price,
        form: reward.form,
      });
      updated += 1;
    } else {
      batch.set(doc(rewardsCol(db, t)), {
        ...reward,
        ...defaultTargets(reward.form),
        exclusivePerDay: false,
        active: true,
      });
      created += 1;
    }
  }
  await batch.commit();
  return { created, updated };
}
