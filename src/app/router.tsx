import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { PlayersScreen } from '../features/players';
import { RewardsScreen } from '../features/rewards';
import { RulesScreen } from '../features/rules';
import { TasksScreen } from '../features/tasks';
import { TurnusEntryRoute, TurnusEntryScreen } from '../features/turnus-entry';
import { Spinner } from '../ui/Spinner';

import { AppLayout } from './AppLayout';
import { RouteError } from './ErrorBoundary';
import { RequireAdmin } from './guards/RequireAdmin';
import { RequireTurnus } from './guards/RequireTurnus';
import { GameProviders } from './providers/GameProviders';

// The whole admin feature is lazy — most users never load it (spec 15.13).
const AdminScreen = lazy(() =>
  import('../features/admin').then((module) => ({ default: module.AdminScreen })),
);

export const router = createBrowserRouter([
  { path: '/t/:slug', element: <TurnusEntryRoute />, errorElement: <RouteError /> },
  { path: '/enter', element: <TurnusEntryScreen />, errorElement: <RouteError /> },
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
              { path: 'rules', element: <RulesScreen /> },
              {
                element: <RequireAdmin />,
                children: [
                  {
                    path: 'admin',
                    element: (
                      <Suspense fallback={<Spinner />}>
                        <AdminScreen />
                      </Suspense>
                    ),
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);
