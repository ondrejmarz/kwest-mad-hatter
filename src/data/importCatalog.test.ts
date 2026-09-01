import { describe, expect, it } from 'vitest';

import {
  defaultTargets,
  parseGroupSize,
  parseLocalized,
  parseRewards,
  parseTasks,
  serializeLocalized,
  splitByName,
} from './importCatalog';

/** Trilingual literal with the import's default: missing translations stay empty (not mirrored). */
const L = (cs: string, en = '', de = ''): { cs: string; en: string; de: string } => ({
  cs,
  en,
  de,
});

describe('parseTasks', () => {
  it('parses trilingual name/description, difficulty, a size range, and trailing tags', () => {
    const tsv =
      'Nosič vody|Water carrier|Wasserträger\tNosíš kbelík|Carry a bucket\t2\t2-3\t💪 Výdrž|Endurance|Ausdauer\tParta\r\n';
    expect(parseTasks(tsv)).toEqual([
      {
        name: L('Nosič vody', 'Water carrier', 'Wasserträger'),
        description: L('Nosíš kbelík', 'Carry a bucket'),
        difficulty: 2,
        minPlayers: 2,
        maxPlayers: 3,
        categories: [L('💪 Výdrž', 'Endurance', 'Ausdauer'), L('Parta')],
      },
    ]);
  });

  it('takes an exact size, clamps difficulty, drops nameless/blank rows', () => {
    const tsv = 'Scénka\tU ohně\t9\t4\tScénka\n\t\t2\t1\tX\n   \n';
    expect(parseTasks(tsv)).toEqual([
      {
        name: L('Scénka'),
        description: L('U ohně'),
        difficulty: 6,
        minPlayers: 4,
        maxPlayers: 4,
        categories: [L('Scénka')],
      },
    ]);
  });

  it('is solo when no size tag is present, all trailing cells are categories', () => {
    expect(parseTasks('Úklid\tZameteš\t3\tPořádek\tVenku\n')).toEqual([
      {
        name: L('Úklid'),
        description: L('Zameteš'),
        difficulty: 3,
        minPlayers: 1,
        maxPlayers: 1,
        categories: [L('Pořádek'), L('Venku')],
      },
    ]);
  });

  it('finds the size tag even after a category', () => {
    expect(parseTasks('Štafeta\tBěh\t4\tSport\t3-5\n')).toEqual([
      {
        name: L('Štafeta'),
        description: L('Běh'),
        difficulty: 4,
        minPlayers: 3,
        maxPlayers: 5,
        categories: [L('Sport')],
      },
    ]);
  });
});

describe('parseGroupSize', () => {
  it('reads solo, exact and range sizes', () => {
    expect(parseGroupSize('')).toEqual({ minPlayers: 1, maxPlayers: 1 });
    expect(parseGroupSize('3')).toEqual({ minPlayers: 3, maxPlayers: 3 });
    expect(parseGroupSize('2-4')).toEqual({ minPlayers: 2, maxPlayers: 4 });
    expect(parseGroupSize('2:4')).toEqual({ minPlayers: 2, maxPlayers: 4 });
  });
});

describe('parseRewards', () => {
  it('maps the Czech forms, parses price, keeps trilingual name + tags', () => {
    const tsv = 'Dezert|Dessert|Dessert\tNavíc\t150\tOdměna\tJídlo|Food|Essen';
    expect(parseRewards(tsv)).toEqual([
      {
        name: L('Dezert', 'Dessert', 'Dessert'),
        description: L('Navíc'),
        price: 150,
        form: 'reward',
        categories: [L('Jídlo', 'Food', 'Essen')],
      },
    ]);
  });

  it('falls back to reward for an unknown form and 0 for a bad price', () => {
    expect(parseRewards('X\td\tabc\tNěco')).toEqual([
      { name: L('X'), description: L('d'), price: 0, form: 'reward', categories: [] },
    ]);
  });
});

describe('parseLocalized / serializeLocalized', () => {
  it('splits cs|en|de and keeps a stray pipe in the German part', () => {
    expect(parseLocalized('A|B|C|D')).toEqual({ cs: 'A', en: 'B', de: 'C|D' });
    expect(parseLocalized('Solo')).toEqual({ cs: 'Solo', en: '', de: '' });
  });

  it('serializes back, dropping empty translations', () => {
    expect(serializeLocalized(L('Solo'))).toBe('Solo');
    expect(serializeLocalized(L('A', 'B', 'C'))).toBe('A|B|C');
  });
});

describe('defaultTargets', () => {
  it('needs exactly one target only for "punish someone"', () => {
    expect(defaultTargets('punish_someone')).toEqual({ minTargets: 1, maxTargets: 1 });
    expect(defaultTargets('reward')).toEqual({ minTargets: 0, maxTargets: 0 });
    expect(defaultTargets('punish_all')).toEqual({ minTargets: 0, maxTargets: 0 });
  });
});

describe('splitByName', () => {
  it('separates create vs update by the Czech name (spec 10 re-import)', () => {
    const { toCreate, toUpdate } = splitByName(
      [{ name: L('A') }, { name: L('B') }, { name: L('C') }],
      new Set(['B']),
    );
    expect(toCreate.map((x) => x.name.cs)).toEqual(['A', 'C']);
    expect(toUpdate.map((x) => x.name.cs)).toEqual(['B']);
  });
});
