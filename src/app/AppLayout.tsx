import { Outlet } from 'react-router-dom';

import { useTranslation } from '../i18n/LocaleProvider';
import { useOnlineStatus } from '../platform/connectivity/useOnlineStatus';
import { ConnectionBanner } from '../ui/ConnectionBanner';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { NavBar } from '../ui/NavBar';

export function AppLayout() {
  const { t } = useTranslation();
  const online = useOnlineStatus();

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col bg-surface">
      {/* Header, offline banner and nav stay pinned to the top together. */}
      <div className="safe-top sticky top-0 z-20 bg-surface-raised">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border px-4 py-3">
          <span aria-hidden />
          <span className="text-center text-lg font-semibold text-content">{t('appName')}</span>
          <div className="justify-self-end">
            <LanguageSwitcher />
          </div>
        </header>
        <ConnectionBanner online={online} message={t('connection.offline')} />
        <NavBar />
      </div>
      <main className="safe-bottom flex-1 px-4 py-4">
        <Outlet />
      </main>
    </div>
  );
}
