import type { Dictionary } from './cs';

export const en: Dictionary = {
  appName: 'Camp Game',
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
    offline: 'Offline! Changes sync once you reconnect',
    fromCache: 'Showing cached data',
  },
  common: {
    loading: 'Loading…',
    retry: 'Try again',
    switchTurnus: 'Switch camp',
    language: 'Language',
    somethingWrong: 'The app hit an error.',
  },
  screens: {
    playersPlaceholder: 'The player list arrives in a later phase.',
    tasksPlaceholder: 'The task catalog arrives in a later phase.',
    rewardsPlaceholder: 'Rewards arrive in a later phase.',
    rulesPlaceholder: 'The game rules arrive in a later phase.',
    adminPlaceholder: 'The admin area arrives in a later phase.',
  },
};
