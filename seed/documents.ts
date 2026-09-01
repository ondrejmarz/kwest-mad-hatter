import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Builds the demo turnus, catalog and characters as plain `{ path, data }` documents.
 * Storage-agnostic on purpose: the emulator seed writes these through the client SDK,
 * the cloud seed through firebase-admin. Keeping the shape in one place stops the two
 * paths from drifting.
 */
export const FAIL_PENALTY = 100;

const here = dirname(fileURLToPath(import.meta.url));

export interface SeedDocument {
  readonly path: string;
  readonly data: Record<string, unknown>;
}

interface Loc {
  cs: string;
  en: string;
  de: string;
}

/** The seed catalog is authored in Czech; en/de stay empty and fall back to cs at display. */
const loc = (cs: string): Loc => ({ cs, en: '', de: '' });

interface SeedTask {
  name: Loc;
  description: Loc;
  difficulty: number;
  minPlayers: number;
  maxPlayers: number;
  categories: Loc[];
}

interface SeedReward {
  name: Loc;
  description: Loc;
  price: number;
  form: 'reward' | 'punish_someone' | 'punish_all';
  categories: Loc[];
}

const SAMPLE_PLAYERS = ['Jana', 'Kuba', 'Míša', 'Tom', 'Eliška'];

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
      name: loc(name.trim()),
      description: loc(description.trim()),
      difficulty: Number.parseInt(difficultyRaw, 10) || 1,
      minPlayers: pairRaw.trim().toLowerCase() === 'ano' ? 2 : 1,
      maxPlayers: pairRaw.trim().toLowerCase() === 'ano' ? 2 : 1,
      categories: [loc(category.trim() || 'Ostatní')],
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
      name: loc(name.trim()),
      description: loc(description.trim()),
      price: Number.parseInt(priceRaw, 10) || 0,
      form: forms[formRaw.trim()] ?? 'reward',
      categories: [],
    };
  });
}

/**
 * Reads the TSV catalogs and returns every document the demo turnus needs, in write order.
 */
export function buildSeedDocuments(): SeedDocument[] {
  const tasks = parseTasks(readFileSync(join(here, 'tasks.tsv'), 'utf8'));
  const rewards = parseRewards(readFileSync(join(here, 'rewards.tsv'), 'utf8'));
  const turnuses = [
    {
      id: 'demo',
      name: 'Testovací skupina, kód ANALKA',
      playerCode: 'ANALKA',
      adminCode: 'ADMIN0',
    },
    {
      id: '27turnus1',
      name: '1. turnus 2027',
      playerCode: '846929',
      adminCode: 'ADMIN1',
    },
    {
      id: '27turnus2',
      name: '2. turnus 2027',
      playerCode: '094629',
      adminCode: 'ADMIN2',
    },
    {
      id: '27turnus3',
      name: '3. turnus 2027',
      playerCode: '984255',
      adminCode: 'ADMIN3',
    },
    {
      id: '27turnus4',
      name: '4. turnus 2027',
      playerCode: '182413',
      adminCode: 'ADMIN4',
    },
    {
      id: '27turnus5',
      name: '5. turnus 2027',
      playerCode: '947389',
      adminCode: 'ADMIN5',
    },
    {
      id: '26turnus4vanoce',
      name: 'Vánoční sraz 4. turnus',
      playerCode: '271226',
      adminCode: 'ADMIN26',
    },
    {
      id: '26adaptak',
      name: 'Adaptační Kurz 2026 Beta',
      playerCode: '100926',
      adminCode: 'ADMIN26',
    },
  ];
  const docs: SeedDocument[] = [];

  turnuses.forEach((turnus) => {
    docs.push({
      path: `turnuses/${turnus.id}`,
      data: {
        name: turnus.name,
        slug: turnus.id,
        currentDay: 1,
        archived: false,
        startingCoins: 0,
        failPenalty: FAIL_PENALTY,
        allowNegativeBalance: true,
        noPickPenalty: 100,
        maxActiveRewardsPerPlayer: 1,
        maxActivePunishesPerPlayer: 1,
        dayLocked: false,
        nextDayCategories: [],
        currentDayCategories: [],
      },
    });

    docs.push({
      path: `turnuses/${turnus.id}/private/config`,
      data: {
        playerCode: turnus.playerCode,
        adminCode: turnus.adminCode,
      },
    });

    tasks.forEach((task, index) => {
      const coinReward = 80 + task.difficulty * 20;

      const catalog = {
        ...task,
        coinReward,
        manualCoins: false,
        active: true,
      };

      // Globální katalog stačí vytvořit jednou.
      if (turnus.id === turnuses[0].id) {
        docs.push({
          path: `catalogTasks/task-${index}`,
          data: catalog,
        });
      }

      docs.push({
        path: `turnuses/${turnus.id}/tasks/task-${index}`,
        data: {
          ...catalog,
          usedByPlayerIds: [],
        },
      });
    });

    rewards.forEach((reward, index) => {
      const catalog = {
        ...reward,
        minTargets: reward.form === 'punish_someone' ? 1 : 0,
        maxTargets: reward.form === 'punish_someone' ? 1 : 0,
        exclusivePerDay: false,
        active: true,
      };

      // Globální katalog také pouze jednou.
      if (turnus.id === turnuses[0].id) {
        docs.push({
          path: `catalogRewards/reward-${index}`,
          data: catalog,
        });
      }

      docs.push({
        path: `turnuses/${turnus.id}/rewards/reward-${index}`,
        data: catalog,
      });
    });

    SAMPLE_PLAYERS.forEach((name, index) => {
      docs.push({
        path: `turnuses/${turnus.id}/players/player-${index}`,
        data: {
          name,
          coins: 0,
          status: 'approved',
          ownerUids: [],
          needsPick: true,
          activeTask: null,
          createdByUid: 'seed',
        },
      });

      docs.push({
        path: `turnuses/${turnus.id}/players/player-${index}/private/auth`,
        data: {
          recoveryPin: '0000',
        },
      });
    });
  });

  return docs;
}

export const seedSummary = (docs: SeedDocument[]): string => {
  const tasks = docs.filter((d) => d.path.startsWith('turnuses/demo/tasks/')).length;
  const rewards = docs.filter((d) => d.path.startsWith('turnuses/demo/rewards/')).length;
  const players = docs.filter((d) => /^turnuses\/demo\/players\/player-\d+$/.test(d.path)).length;
  return `turnus "demo" (codes ANALKA / ADMIN0): ${tasks} tasks, ${rewards} rewards, ${players} players`;
};
