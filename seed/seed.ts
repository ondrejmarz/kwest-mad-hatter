import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, setDoc, type Firestore } from 'firebase/firestore';

/**
 * Seeds the Firestore emulator with a demo turnus and fictional catalog.
 * Uses the rules-unit-testing "security rules disabled" context so no
 * firebase-admin dependency is needed. Run via `npm run seed` (or automatically
 * as part of `npm run dev`).
 */
const PROJECT_ID = 'demo-tabor';
const HOST = '127.0.0.1';
const PORT = 8080;
const COINS_PER_DIFFICULTY = 50;
const PENALTY_RATIO = 0.5;

const here = dirname(fileURLToPath(import.meta.url));

interface SeedTask {
  name: string;
  description: string;
  difficulty: number;
  isPair: boolean;
  category: string;
}

interface SeedReward {
  name: string;
  description: string;
  price: number;
  form: 'reward' | 'punish_someone' | 'punish_all';
}

function nonEmptyLines(tsv: string): string[] {
  return tsv
    .split('\n')
    .map((line) => line.replace(/\r$/, ''))
    .filter((line) => line.trim().length > 0);
}

function parseTasks(tsv: string): SeedTask[] {
  return nonEmptyLines(tsv).map((line) => {
    const [name = '', description = '', difficultyRaw = '', pairRaw = '', category = ''] =
      line.split('\t');
    return {
      name: name.trim(),
      description: description.trim(),
      difficulty: Number.parseInt(difficultyRaw, 10) || 1,
      isPair: pairRaw.trim().toLowerCase() === 'ano',
      category: category.trim() || 'Ostatní',
    };
  });
}

function parseRewards(tsv: string): SeedReward[] {
  const forms: Record<string, SeedReward['form']> = {
    'Trest pro někoho': 'punish_someone',
    'Trest pro všechny': 'punish_all',
    Odměna: 'reward',
  };
  return nonEmptyLines(tsv).map((line) => {
    const [name = '', description = '', priceRaw = '', formRaw = ''] = line.split('\t');
    return {
      name: name.trim(),
      description: description.trim(),
      price: Number.parseInt(priceRaw, 10) || 0,
      form: forms[formRaw.trim()] ?? 'reward',
    };
  });
}

async function waitForEmulator(): Promise<void> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      await fetch(`http://${HOST}:${PORT}/`);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error(`Firestore emulator not reachable at ${HOST}:${PORT}`);
}

async function writeSeed(db: Firestore, tasks: SeedTask[], rewards: SeedReward[]): Promise<void> {
  await setDoc(doc(db, 'turnuses', 'demo'), {
    name: 'Ukázkový turnus',
    slug: 'demo',
    currentDay: 1,
    archived: false,
    startingCoins: 0,
    coinsPerDifficulty: COINS_PER_DIFFICULTY,
    penaltyRatio: PENALTY_RATIO,
    allowNegativeBalance: true,
    noPickPenalty: 100,
    maxActiveRewardsPerPlayer: 1,
    maxActivePunishesPerPlayer: 1,
    dayLocked: false,
    lockTime: '08:30',
    nextDayCategories: [],
    currentDayCategories: [],
  });

  await Promise.all(
    tasks.map((task, index) => {
      const coinReward = 100 + task.difficulty * COINS_PER_DIFFICULTY;
      return setDoc(doc(collection(db, 'catalogTasks'), `task-${index}`), {
        ...task,
        coinReward,
        coinPenalty: Math.round(coinReward * PENALTY_RATIO),
        manualCoins: false,
        active: true,
      });
    }),
  );

  await Promise.all(
    rewards.map((reward, index) =>
      setDoc(doc(collection(db, 'catalogRewards'), `reward-${index}`), {
        ...reward,
        minTargets: reward.form === 'punish_someone' ? 1 : 0,
        maxTargets: reward.form === 'punish_someone' ? 1 : 0,
        exclusivePerDay: false,
        active: true,
      }),
    ),
  );
}

async function main(): Promise<void> {
  await waitForEmulator();
  const tasks = parseTasks(readFileSync(join(here, 'tasks.tsv'), 'utf8'));
  const rewards = parseRewards(readFileSync(join(here, 'rewards.tsv'), 'utf8'));

  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: HOST,
      port: PORT,
      rules: readFileSync(join(here, '..', 'firestore.rules'), 'utf8'),
    },
  });

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await writeSeed(context.firestore() as unknown as Firestore, tasks, rewards);
  });
  await testEnv.cleanup();

  console.log(`Seeded ${tasks.length} tasks and ${rewards.length} rewards into the emulator.`);
}

main().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});
