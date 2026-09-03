import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useRouteError } from 'react-router-dom';

import { useTranslation } from '../i18n/LocaleProvider';
import { Button } from '../ui/Button';

/**
 * The single error screen for the whole app: a message and one recovery button that does a full
 * page reload. Reload (not a soft React re-render) is the only escape an installed PWA has — it has
 * no browser reload control, so without it a hard error strands the user until they kill the app.
 * Shared by both catch mechanisms below so every error state looks and behaves the same.
 */
function ErrorScreen({ message, actionLabel }: { message: string; actionLabel: string }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-content">{message}</p>
      <Button variant="secondary" onClick={() => window.location.reload()}>
        {actionLabel}
      </Button>
    </div>
  );
}

interface Props {
  title: string;
  retryLabel: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

class ErrorBoundaryInner extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Uncaught error:', error, info);
  }

  override render(): ReactNode {
    if (this.state.error) {
      return <ErrorScreen message={this.props.title} actionLabel={this.props.retryLabel} />;
    }
    return this.props.children;
  }
}

/**
 * Catches render errors React Router's `errorElement` can't — anything thrown outside a route (the
 * top-level wrap around `RouterProvider`) or inside a boundary placed within a route. Must render
 * inside LocaleProvider.
 */
export function AppErrorBoundary({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <ErrorBoundaryInner title={t('common.somethingWrong')} retryLabel={t('common.retry')}>
      {children}
    </ErrorBoundaryInner>
  );
}

/** The router's `errorElement` for route/loader failures — same screen as the class boundary. */
export function RouteError() {
  const error = useRouteError();
  const { t } = useTranslation();
  console.error('Route error:', error);
  return <ErrorScreen message={t('common.somethingWrong')} actionLabel={t('common.retry')} />;
}
