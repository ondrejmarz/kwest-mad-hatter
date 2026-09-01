import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useRouteError } from 'react-router-dom';

import { useTranslation } from '../i18n/LocaleProvider';

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

  private readonly handleRetry = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex min-h-full flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-content">{this.props.title}</p>
          <button type="button" className="text-accent underline" onClick={this.handleRetry}>
            {this.props.retryLabel}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Localized wrapper — must render inside LocaleProvider. */
export function AppErrorBoundary({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <ErrorBoundaryInner title={t('common.somethingWrong')} retryLabel={t('common.retry')}>
      {children}
    </ErrorBoundaryInner>
  );
}

export function RouteError() {
  const error = useRouteError();
  const { t } = useTranslation();
  console.error('Route error:', error);
  return <div className="p-6 text-center text-content">{t('common.somethingWrong')}</div>;
}
