import type { Dictionary } from './cs';

export const de: Dictionary = {
  appName: 'Kvest',
  nav: {
    players: 'Spieler',
    tasks: 'Aufgaben',
    rewards: 'Belohnungen',
    rules: 'Regeln',
    admin: 'Admin',
  },
  round: {
    label: 'Runde {day}',
  },
  connection: {
    online: 'Verbunden',
    offline: 'Offline! Änderungen werden nach der Verbindung gesendet',
    fromCache: 'Zwischengespeicherte Daten',
  },
  common: {
    loading: 'Lädt…',
    retry: 'Erneut versuchen',
    switchTurnus: 'Lager wechseln',
    language: 'Sprache',
    menu: 'Menü',
    somethingWrong: 'Die App ist auf einen Fehler gestoßen.',
  },
  entry: {
    pickTitle: 'Lager wählen',
    pickSubtitle: 'Wähle dein Lager und gib den Zugangscode ein.',
    empty: 'Noch keine Lager.',
    codeTitle: 'Lagercode',
    codeHint: 'Gib den Code von deinem Betreuer ein.',
    codeLabel: 'Code',
    submit: 'Beitreten',
    wrongCode: 'Ungültiger Code. Versuch es erneut.',
    offline: 'Du bist offline — verbinde dich und versuch es erneut.',
    unknownTurnus: 'Dieses Lager existiert nicht.',
    back: 'Zurück zur Lagerauswahl',
  },
  admin: {
    unlockTitle: 'Admin-Zugang',
    unlockHint: 'Gib den Admin-Code des Lagers ein.',
    unlockSubmit: 'Entsperren',
    unlockWrong: 'Ungültiger Admin-Code.',
  },
  screens: {
    playersPlaceholder: 'Die Spielerliste folgt in einer späteren Phase.',
    tasksPlaceholder: 'Der Aufgabenkatalog folgt in einer späteren Phase.',
    rewardsPlaceholder: 'Belohnungen folgen in einer späteren Phase.',
    rulesPlaceholder: 'Die Spielregeln folgen in einer späteren Phase.',
    adminPlaceholder: 'Der Admin-Bereich folgt in einer späteren Phase.',
  },
};
