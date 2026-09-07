import { RouterProvider } from 'react-router-dom';

import { OrientationGate } from '../ui/OrientationGate';

import { AppErrorBoundary } from './ErrorBoundary';
import { AppProviders } from './providers/AppProviders';
import { router } from './router';

export function App() {
  return (
    <AppProviders>
      <OrientationGate />
      <AppErrorBoundary>
        <RouterProvider router={router} />
      </AppErrorBoundary>
    </AppProviders>
  );
}
