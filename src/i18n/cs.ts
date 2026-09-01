/**
 * Czech is the source-of-truth dictionary. Its inferred shape (`Dictionary`)
 * forces `en` and `de` to stay complete — a missing key fails typecheck.
 */
export const cs = {
  appName: 'Kvest',
  nav: {
    players: 'Hráči',
    tasks: 'Úkoly',
    rewards: 'Odměny',
    rules: 'Pravidla',
    admin: 'Admin',
  },
  round: {
    label: 'Kolo {day}',
  },
  connection: {
    online: 'Připojeno',
    offline: 'Offline! Změny se odešlou po připojení',
    fromCache: 'Zobrazuji uložená data',
  },
  common: {
    loading: 'Načítám…',
    retry: 'Zkusit znovu',
    switchTurnus: 'Přepnout turnus',
    language: 'Jazyk',
    menu: 'Menu',
    somethingWrong: 'Aplikace narazila na chybu.',
  },
  entry: {
    pickTitle: 'Vyber turnus',
    pickSubtitle: 'Vyber svůj tábor a zadej přístupový kód.',
    empty: 'Zatím tu není žádný turnus.',
    codeTitle: 'Kód turnusu',
    codeHint: 'Zadej kód, který ti dal vedoucí.',
    codeLabel: 'Kód',
    submit: 'Vstoupit',
    wrongCode: 'Neplatný kód. Zkus to znovu.',
    offline: 'Jsi offline — připoj se a zkus to znovu.',
    unknownTurnus: 'Takový turnus neexistuje.',
    back: 'Zpět na výběr turnusu',
  },
  admin: {
    unlockTitle: 'Admin přístup',
    unlockHint: 'Zadej admin kód turnusu.',
    unlockSubmit: 'Odemknout',
    unlockWrong: 'Neplatný admin kód.',
  },
  screens: {
    playersPlaceholder: 'Seznam hráčů se objeví v další fázi.',
    tasksPlaceholder: 'Katalog úkolů se objeví v další fázi.',
    rewardsPlaceholder: 'Odměny se objeví v další fázi.',
    rulesPlaceholder: 'Pravidla hry se objeví v další fázi.',
    adminPlaceholder: 'Admin rozhraní se objeví v další fázi.',
  },
};

export type Dictionary = typeof cs;
