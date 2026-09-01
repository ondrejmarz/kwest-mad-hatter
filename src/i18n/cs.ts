/**
 * Czech is the source-of-truth dictionary. Its inferred shape (`Dictionary`)
 * forces `en` and `de` to stay complete — a missing key fails typecheck.
 */
export const cs = {
  appName: 'Táborová hra',
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
    offline: 'Offline! Změny se odešlou po připojení',
    fromCache: 'Zobrazuji uložená data',
  },
  common: {
    loading: 'Načítám…',
    retry: 'Zkusit znovu',
    switchTurnus: 'Přepnout turnus',
    language: 'Jazyk',
    somethingWrong: 'Aplikace narazila na chybu.',
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
