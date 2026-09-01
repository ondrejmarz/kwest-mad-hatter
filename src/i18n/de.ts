import type { Dictionary } from './cs';

export const de: Dictionary = {
  appName: 'Lagerspiel',
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
    offline: 'Offline! Änderungen werden nach der Verbindung gesendet',
    fromCache: 'Zwischengespeicherte Daten',
  },
  common: {
    loading: 'Lädt…',
    retry: 'Erneut versuchen',
    switchTurnus: 'Lager wechseln',
    language: 'Sprache',
    somethingWrong: 'Die App ist auf einen Fehler gestoßen.',
  },
  screens: {
    playersPlaceholder: 'Die Spielerliste folgt in einer späteren Phase.',
    tasksPlaceholder: 'Der Aufgabenkatalog folgt in einer späteren Phase.',
    rewardsPlaceholder: 'Belohnungen folgen in einer späteren Phase.',
    rulesPlaceholder: 'Die Spielregeln folgen in einer späteren Phase.',
    adminPlaceholder: 'Der Admin-Bereich folgt in einer späteren Phase.',
  },
};
