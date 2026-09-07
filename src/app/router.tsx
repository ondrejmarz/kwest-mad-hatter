import { createBrowserRouter, Navigate } from 'react-router-dom';

import { PlayersScreen } from '../features/players';
import { ProfileScreen } from '../features/profile';
import { RewardsScreen } from '../features/rewards';
import { TasksScreen } from '../features/tasks';
import {
  EntryAboutScreen,
  EntryContactScreen,
  EntryRulesScreen,
  EntryTabsLayout,
  TurnusPickerScreen,
} from '../features/turnus-entry';

import { AppLayout } from './AppLayout';
import { RouteError } from './ErrorBoundary';
import { RequireTurnus } from './guards/RequireTurnus';
import { GameProviders } from './providers/GameProviders';

export const router = createBrowserRouter([
  {
    // The pre-turnus shell: a tabbed picker (Skupiny / Pravidla / Kontakt / Aplikace). The layout
    // itself gates — a device that already belongs to its remembered turnus is sent straight in.
    path: '/enter',
    element: <EntryTabsLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <TurnusPickerScreen /> },
      { path: 'rules', element: <EntryRulesScreen /> },
      { path: 'contact', element: <EntryContactScreen /> },
      { path: 'about', element: <EntryAboutScreen /> },
    ],
  },
  {
    element: <RequireTurnus />,
    errorElement: <RouteError />,
    children: [
      {
        // Live turnus/players listeners wrap the whole game shell.
        element: <GameProviders />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { index: true, element: <Navigate to="/players" replace /> },
              { path: 'players', element: <PlayersScreen /> },
              { path: 'tasks', element: <TasksScreen /> },
              { path: 'rewards', element: <RewardsScreen /> },
              // Admin actions live on Profil+ (an admin-only section of the profile), lazily loaded
              // there — there is no separate admin route anymore.
              { path: 'profile', element: <ProfileScreen /> },
            ],
          },
        ],
      },
    ],
  },
]);
