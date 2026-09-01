import { RouterProvider } from 'react-router-dom';

import { AppErrorBoundary } from './ErrorBoundary';
import { AppProviders } from './providers/AppProviders';
import { router } from './router';

export function App() {
  return (
    <AppProviders>
      <AppErrorBoundary>
        <RouterProvider router={router} />
      </AppErrorBoundary>
    </AppProviders>
  );
}
