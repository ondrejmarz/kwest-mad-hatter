import type { Dictionary } from './cs';

export const en: Dictionary = {
  appName: 'Kvest',
  nav: {
    players: 'Players',
    tasks: 'Tasks',
    rewards: 'Rewards',
    rules: 'Rules',
    admin: 'Admin',
  },
  round: {
    label: 'Round {day}',
  },
  connection: {
    online: 'Connected',
    offline: 'Offline! Changes sync once you reconnect',
    fromCache: 'Showing cached data',
  },
  common: {
    loading: 'Loading…',
    retry: 'Try again',
    switchTurnus: 'Switch camp',
    language: 'Language',
    menu: 'Menu',
    somethingWrong: 'The app hit an error.',
  },
  entry: {
    pickTitle: 'Choose a camp',
    pickSubtitle: 'Pick your camp and enter its access code.',
    empty: 'No camps yet.',
    codeTitle: 'Camp code',
    codeHint: 'Enter the code your counselor gave you.',
    codeLabel: 'Code',
    submit: 'Enter',
    wrongCode: 'Invalid code. Try again.',
    offline: 'You are offline — reconnect and try again.',
    unknownTurnus: 'That camp does not exist.',
    back: 'Back to camp selection',
  },
  admin: {
    unlockTitle: 'Admin access',
    unlockHint: 'Enter the camp admin code.',
    unlockSubmit: 'Unlock',
    unlockWrong: 'Invalid admin code.',
  },
  screens: {
    playersPlaceholder: 'The player list arrives in a later phase.',
    tasksPlaceholder: 'The task catalog arrives in a later phase.',
    rewardsPlaceholder: 'Rewards arrive in a later phase.',
    rulesPlaceholder: 'The game rules arrive in a later phase.',
    adminPlaceholder: 'The admin area arrives in a later phase.',
  },
};
