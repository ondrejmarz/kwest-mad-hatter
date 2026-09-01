import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { PlayersScreen } from '../features/players';
import { RewardsScreen } from '../features/rewards';
import { RulesScreen } from '../features/rules';
import { TasksScreen } from '../features/tasks';
import { Spinner } from '../ui/Spinner';

import { AppLayout } from './AppLayout';
import { RouteError } from './ErrorBoundary';

// The whole admin feature is lazy — most users never load it (spec 15.13).
const AdminScreen = lazy(() =>
  import('../features/admin').then((module) => ({ default: module.AdminScreen })),
);

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/players" replace /> },
      { path: 'players', element: <PlayersScreen /> },
      { path: 'tasks', element: <TasksScreen /> },
      { path: 'rewards', element: <RewardsScreen /> },
      { path: 'rules', element: <RulesScreen /> },
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
]);
