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

const SAMPLE_PLAYERS = ['Jana', 'Kuba', 'Míša', 'Tom', 'Eliška'];

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

  // Fictional codes so a dev can enter the turnus (spec 3, 15.14 — no real codes).
  await setDoc(doc(db, 'turnuses', 'demo', 'private', 'config'), {
    playerCode: 'HRAC24',
    adminCode: 'SEFKA7',
  });

  // Global catalog templates (source for the import feature) plus turnus-scoped copies,
  // so the demo turnus is immediately playable.
  await Promise.all(
    tasks.map((task, index) => {
      const coinReward = 100 + task.difficulty * COINS_PER_DIFFICULTY;
      const catalog = {
        ...task,
        coinReward,
        coinPenalty: Math.round(coinReward * PENALTY_RATIO),
        manualCoins: false,
        active: true,
      };
      return Promise.all([
        setDoc(doc(collection(db, 'catalogTasks'), `task-${index}`), catalog),
        setDoc(doc(collection(db, 'turnuses', 'demo', 'tasks'), `task-${index}`), {
          ...catalog,
          usedByPlayerIds: [],
        }),
      ]);
    }),
  );

  await Promise.all(
    rewards.map((reward, index) => {
      const catalog = {
        ...reward,
        minTargets: reward.form === 'punish_someone' ? 1 : 0,
        maxTargets: reward.form === 'punish_someone' ? 1 : 0,
        exclusivePerDay: false,
        active: true,
      };
      return Promise.all([
        setDoc(doc(collection(db, 'catalogRewards'), `reward-${index}`), catalog),
        setDoc(doc(collection(db, 'turnuses', 'demo', 'rewards'), `reward-${index}`), catalog),
      ]);
    }),
  );

  // A few approved, unclaimed characters (recovery PIN 0000 for the demo).
  await Promise.all(
    SAMPLE_PLAYERS.flatMap((name, index) => [
      setDoc(doc(collection(db, 'turnuses', 'demo', 'players'), `player-${index}`), {
        name,
        coins: 0,
        status: 'approved',
        ownerUids: [],
        needsPick: true,
        activeTask: null,
        createdByUid: 'seed',
      }),
      setDoc(doc(db, 'turnuses', 'demo', 'players', `player-${index}`, 'private', 'auth'), {
        recoveryPin: '0000',
      }),
    ]),
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

  console.log(
    `Seeded turnus "demo" (codes HRAC24 / SEFKA7): ${tasks.length} tasks, ${rewards.length} rewards, ${SAMPLE_PLAYERS.length} players.`,
  );
}

main().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});
