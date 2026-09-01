import { doc, type Firestore, getDocs, writeBatch } from 'firebase/firestore';

import { derivePenalty, deriveReward } from '../domain/coins';
import type { LocalizedText, RewardForm } from '../domain/types';

import { rewardDoc, rewardsCol, taskDoc, tasksCol } from './paths';
import { parseReward, parseTaskDoc } from './schemas/catalog';

/**
 * TSV catalog import (spec 10). Pasting from a spreadsheet, tab-separated. Every localized
 * value — name, description and each category tag — is one cell written `cs|en|de` (en/de
 * optional, filled from cs at display). Categories are the trailing cells, any number of them,
 * to the end of the line. Matching is by the Czech name so a re-import updates existing rows
 * without losing their state — `usedByPlayerIds`, `active` and overridden coins (`manualCoins`)
 * are preserved; auto coins are recomputed.
 *
 *   task:   name ⇥ description ⇥ difficulty ⇥ pair(Ano/Ne) ⇥ tag ⇥ tag ⇥ …
 *   reward: name ⇥ description ⇥ price ⇥ form ⇥ tag ⇥ tag ⇥ …
 */
export interface ParsedTask {
  readonly name: LocalizedText;
  readonly description: LocalizedText;
  readonly difficulty: number;
  readonly isPair: boolean;
  readonly categories: readonly LocalizedText[];
}

export interface ParsedReward {
  readonly name: LocalizedText;
  readonly description: LocalizedText;
  readonly price: number;
  readonly form: RewardForm;
  readonly categories: readonly LocalizedText[];
}

function rows(tsv: string): string[] {
  return tsv
    .split('\n')
    .map((line) => line.replace(/\r$/, ''))
    .filter((line) => line.trim().length > 0);
}

/**
 * One `cs|en|de` cell → a trilingual value. `cs` is everything before the first pipe; `de`
 * is everything after the second, so a stray pipe in the (longer) German text survives.
 * Missing languages stay empty and fall back to `cs` at display.
 */
export function parseLocalized(cell: string): LocalizedText {
  const parts = cell.split('|');
  return {
    cs: (parts[0] ?? '').trim(),
    en: (parts[1] ?? '').trim(),
    de: parts.slice(2).join('|').trim(),
  };
}

/** Inverse of `parseLocalized` for the admin editors: `cs` alone when there is no translation. */
export function serializeLocalized(text: LocalizedText): string {
  return text.en === '' && text.de === '' ? text.cs : `${text.cs}|${text.en}|${text.de}`;
}

/** Parse a category-tags textarea (one `cs|en|de` per line) — the admin editors' tag input. */
export function parseLocalizedLines(text: string): LocalizedText[] {
  return text
    .split('\n')
    .map(parseLocalized)
    .filter((tag) => tag.cs.length > 0);
}

function parseTags(cells: readonly string[]): LocalizedText[] {
  return cells.map(parseLocalized).filter((tag) => tag.cs.length > 0);
}

function clampDifficulty(raw: string): number {
  const value = Number.parseInt(raw, 10);
  return Number.isNaN(value) ? 1 : Math.min(6, Math.max(1, value));
}

export function parseTasks(tsv: string): ParsedTask[] {
  return rows(tsv)
    .map((line) => {
      const [name = '', description = '', difficulty = '', pair = '', ...tags] = line.split('\t');
      return {
        name: parseLocalized(name),
        description: parseLocalized(description),
        difficulty: clampDifficulty(difficulty),
        isPair: pair.trim().toLowerCase() === 'ano',
        categories: parseTags(tags),
      };
    })
    .filter((task) => task.name.cs.length > 0);
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
      const [name = '', description = '', price = '', form = '', ...tags] = line.split('\t');
      return {
        name: parseLocalized(name),
        description: parseLocalized(description),
        price: Math.max(0, Number.parseInt(price, 10) || 0),
        form: REWARD_FORMS[form.trim()] ?? 'reward',
        categories: parseTags(tags),
      };
    })
    .filter((reward) => reward.name.cs.length > 0);
}

/**
 * Split parsed rows into new vs. existing by their Czech name (the row identity) — drives the
 * import preview (spec 10). `existingNames` holds the `name.cs` of the current catalog.
 */
export function splitByName<P extends { readonly name: LocalizedText }>(
  parsed: readonly P[],
  existingNames: ReadonlySet<string>,
): { toCreate: readonly P[]; toUpdate: readonly P[] } {
  const toCreate: P[] = [];
  const toUpdate: P[] = [];
  for (const item of parsed) {
    (existingNames.has(item.name.cs) ? toUpdate : toCreate).push(item);
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
      existing.set(parsedDoc.name.cs, { id: docSnap.id, manualCoins: parsedDoc.manualCoins });
  }

  const batch = writeBatch(db);
  let created = 0;
  let updated = 0;
  for (const task of parsed) {
    const coinReward = deriveReward(task.difficulty, coinsPerDifficulty);
    const coinPenalty = derivePenalty(coinReward, penaltyRatio);
    const match = existing.get(task.name.cs);
    if (match) {
      const fields: Record<string, unknown> = {
        name: task.name,
        description: task.description,
        categories: task.categories,
        difficulty: task.difficulty,
        isPair: task.isPair,
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
    if (reward) existing.set(reward.name.cs, docSnap.id);
  }

  const batch = writeBatch(db);
  let created = 0;
  let updated = 0;
  for (const reward of parsed) {
    const id = existing.get(reward.name.cs);
    if (id !== undefined) {
      batch.update(rewardDoc(db, t, id), {
        name: reward.name,
        description: reward.description,
        categories: reward.categories,
        price: reward.price,
        form: reward.form,
        ...defaultTargets(reward.form),
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
