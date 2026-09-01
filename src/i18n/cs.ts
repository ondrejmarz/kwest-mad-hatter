/**
 * Czech is the source-of-truth dictionary. Its inferred shape (`Dictionary`)
 * forces `en` and `de` to stay complete — a missing key fails typecheck.
 */
export const cs = {
  appName: 'Kwest',
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
    switchTurnus: 'Přepnout skupinu',
    language: 'Jazyk',
    menu: 'Menu',
    somethingWrong: 'Aplikace narazila na chybu.',
  },
  entry: {
    pickTitle: 'Na jaké dobrodružství se vydáš?',
    pickSubtitle: 'Vyber svoji skupinu a zadej přístupový kód.',
    empty: 'Zatím tu není žádná skupina.',
    codeTitle: 'Kód skupiny',
    codeHint: 'Zadej kód, který ti dal organizátor.',
    codeLabel: 'Kód',
    submit: 'Vstoupit',
    wrongCode: 'Neplatný kód. Zkus to znovu.',
    offline: 'Jsi offline! Připoj se a zkus to znovu.',
    unknownTurnus: 'Taková skupina neexistuje.',
    back: 'Zpět na výběr skupin',
  },
  admin: {
    unlockTitle: 'Admin přístup',
    unlockHint: 'Admin kód skupiny.',
    unlockSubmit: 'Odemknout',
    unlockWrong: 'Admin kód není platný.',
  },
  players: {
    addPlayer: 'Přidat hráče',
    needsPick: 'Nemá úkol',
    pending: 'Čeká na schválení',
    approve: 'Schválit',
    reject: 'Zamítnout',
    empty: 'Zatím tu nejsou žádní hráči.',
    createTitle: 'Nový hráč',
    nameLabel: 'Jméno',
    pinLabel: 'Záchranný PIN (4 číslice)',
    createSubmit: 'Přidat',
    invalidName: 'Zadej jméno.',
    invalidPin: 'PIN musí být 4 číslice.',
    claimTitle: 'Jsi to ty?',
    claimHint: 'Přihlásíš se jako {name} a příště už půjdeš rovnou dovnitř.',
    claimConfirm: 'Ano, jsem to já',
    recover: 'Tohle jsem já, ztratil jsem přístup',
    recoverTitle: 'Obnovit přístup',
    recoverHint: 'Zadej záchranný PIN, který sis zvolil při založení postavy.',
    recoverSubmit: 'Obnovit přístup',
    wrongPin: 'Špatný PIN.',
    alreadyClaimed: 'Tuhle postavu už někdo vlastní.',
    detailTitle: 'Detail hráče',
    you: 'Ty',
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
