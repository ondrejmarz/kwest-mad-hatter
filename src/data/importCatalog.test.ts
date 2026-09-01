import { describe, expect, it } from 'vitest';

import {
  defaultTargets,
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
  it('parses trilingual name/description, difficulty, pair, and trailing tags', () => {
    const tsv =
      'Nosič vody|Water carrier|Wasserträger\tNosíš kbelík|Carry a bucket\t2\tNe\t💪 Výdrž|Endurance|Ausdauer\tParta\r\n';
    expect(parseTasks(tsv)).toEqual([
      {
        name: L('Nosič vody', 'Water carrier', 'Wasserträger'),
        description: L('Nosíš kbelík', 'Carry a bucket'),
        difficulty: 2,
        isPair: false,
        categories: [L('💪 Výdrž', 'Endurance', 'Ausdauer'), L('Parta')],
      },
    ]);
  });

  it('pair from "Ano", clamps difficulty, drops nameless/blank rows', () => {
    const tsv = 'Scénka\tU ohně\t9\tAno\tScénka\n\t\t2\tNe\tX\n   \n';
    expect(parseTasks(tsv)).toEqual([
      {
        name: L('Scénka'),
        description: L('U ohně'),
        difficulty: 6,
        isPair: true,
        categories: [L('Scénka')],
      },
    ]);
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
