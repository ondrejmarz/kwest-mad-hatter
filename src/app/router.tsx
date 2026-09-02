import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { PlayersScreen } from '../features/players';
import { RewardsScreen } from '../features/rewards';
import { RulesScreen } from '../features/rules';
import { TasksScreen } from '../features/tasks';
import { TurnusEntryRoute, TurnusEntryScreen } from '../features/turnus-entry';
import { Spinner } from '../ui/Spinner';

import { AppLayout } from './AppLayout';
import { AppErrorBoundary, RouteError } from './ErrorBoundary';
import { RequireAdmin } from './guards/RequireAdmin';
import { RequireTurnus } from './guards/RequireTurnus';
import { GameProviders } from './providers/GameProviders';

// The whole admin feature is lazy — most users never load it (spec 15.13). The dynamic import is
// retried a few times: the admin chunk is fetched the first time a device opens the admin area,
// often moments after unlocking admin, when a transient network hiccup or a just-activated service
// worker can drop the request. React caches a lazy rejection permanently, so without the retry a
// single blip would wedge the admin tab on the error screen until a full reload.
const AdminScreen = lazy(async () => {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
    try {
      return { default: (await import('../features/admin')).AdminScreen };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
});

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
                    // A recoverable boundary (with a working retry) rather than the bare route
                    // error, so a transient first-load hiccup can be dismissed in place instead of
                    // stranding the admin on the error screen until they leave and come back.
                    element: (
                      <AppErrorBoundary>
                        {/* Centre the chunk-loading spinner like every in-content loader
                            (and the admin screen's own), so it matches instead of sitting
                            top-left while the lazy admin bundle downloads. */}
                        <Suspense
                          fallback={
                            <div className="flex justify-center py-10">
                              <Spinner />
                            </div>
                          }
                        >
                          <AdminScreen />
                        </Suspense>
                      </AppErrorBoundary>
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
