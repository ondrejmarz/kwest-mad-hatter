import { describe, expect, it } from 'vitest';

import { defaultTargets, parseRewards, parseTasks, splitByName } from './importCatalog';

describe('parseTasks', () => {
  it('parses tab-separated rows; pair from "Ano", CRLF stripped', () => {
    const tsv =
      'Nosič vody\tNosíš kbelík\t1\tNe\t💪 Výdrž\r\nScénka\tU ohně\t3\tAno\t🎭 Scénka\r\n';
    expect(parseTasks(tsv)).toEqual([
      {
        name: 'Nosič vody',
        description: 'Nosíš kbelík',
        difficulty: 1,
        isPair: false,
        category: '💪 Výdrž',
      },
      { name: 'Scénka', description: 'U ohně', difficulty: 3, isPair: true, category: '🎭 Scénka' },
    ]);
  });

  it('clamps difficulty to 1..6, defaults empty category, drops nameless/blank rows', () => {
    const tsv = 'A\td\t9\t\t\n\n   \nB\td\t0\tNe\tKat\n\td\t2\tNe\tKat';
    expect(parseTasks(tsv)).toEqual([
      { name: 'A', description: 'd', difficulty: 6, isPair: false, category: 'Ostatní' },
      { name: 'B', description: 'd', difficulty: 1, isPair: false, category: 'Kat' },
    ]);
  });
});

describe('parseRewards', () => {
  it('maps the Czech forms and parses price', () => {
    const tsv =
      'Dezert\tNavíc\t150\tOdměna\nRozesazení\tPřesadíš\t300\tTrest pro někoho\nBudíček\tVšem\t80\tTrest pro všechny';
    expect(parseRewards(tsv)).toEqual([
      { name: 'Dezert', description: 'Navíc', price: 150, form: 'reward' },
      { name: 'Rozesazení', description: 'Přesadíš', price: 300, form: 'punish_someone' },
      { name: 'Budíček', description: 'Všem', price: 80, form: 'punish_all' },
    ]);
  });

  it('falls back to reward for an unknown form and 0 for a bad price', () => {
    expect(parseRewards('X\td\tabc\tNěco')).toEqual([
      { name: 'X', description: 'd', price: 0, form: 'reward' },
    ]);
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
  it('separates create vs update by name (spec 10 re-import)', () => {
    const { toCreate, toUpdate } = splitByName(
      [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
      new Set(['B']),
    );
    expect(toCreate.map((x) => x.name)).toEqual(['A', 'C']);
    expect(toUpdate.map((x) => x.name)).toEqual(['B']);
  });
});
