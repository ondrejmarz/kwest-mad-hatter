import { Outlet } from 'react-router-dom';

import { useTranslation } from '../i18n/LocaleProvider';
import { cx } from '../lib/cx';
import { useOnlineStatus } from '../platform/connectivity/useOnlineStatus';
import { ConnectionBanner } from '../ui/ConnectionBanner';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { NavBar } from '../ui/NavBar';

export function AppLayout() {
  const { t } = useTranslation();
  const online = useOnlineStatus();
  // The real round number comes from the turnus document in a later phase.
  const day = 1;

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col bg-surface">
      <header className="safe-top sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-surface-raised px-4 py-3">
        <span className="text-lg font-semibold text-content">{t('appName')}</span>
        <LanguageSwitcher />
      </header>
      <NavBar />
      <div className="flex items-center justify-between bg-surface px-4 py-1 text-xs text-content-muted">
        <span>{t('round.label', { day })}</span>
        <span
          aria-hidden
          className={cx('text-base leading-none', online ? 'text-success' : 'text-warning')}
        >
          ●
        </span>
      </div>
      <ConnectionBanner online={online} message={t('connection.offline')} />
      <main className="safe-bottom flex-1 px-4 py-4">
        <Outlet />
      </main>
    </div>
  );
}
