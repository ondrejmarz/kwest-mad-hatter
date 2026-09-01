import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { AdminUnlockGesture } from '../features/admin/unlock/AdminUnlockGesture';
import { useSession } from '../features/session';
import { useTranslation } from '../i18n/LocaleProvider';
import { useOnlineStatus } from '../platform/connectivity/useOnlineStatus';
import { Button } from '../ui/Button';
import { ConnectionBanner } from '../ui/ConnectionBanner';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { NavBar } from '../ui/NavBar';
import { Sheet } from '../ui/Sheet';

export function AppLayout() {
  const { t } = useTranslation();
  const online = useOnlineStatus();
  const { role, switchTurnus } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col bg-surface">
      {/* Header, offline banner and nav stay pinned to the top together. */}
      <div className="safe-top sticky top-0 z-20 bg-surface-raised">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border px-4 py-3">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t('common.menu')}
            className="tap-target justify-self-start text-lg text-content-muted"
          >
            ☰
          </button>
          {/* A long press on the title reveals the hidden admin unlock (spec 3c). */}
          <AdminUnlockGesture>
            <span className="text-lg font-semibold text-content">{t('appName')}</span>
          </AdminUnlockGesture>
          <div className="justify-self-end">
            <LanguageSwitcher />
          </div>
        </header>
        <ConnectionBanner online={online} message={t('connection.offline')} />
        <NavBar showAdmin={role === 'admin'} />
      </div>
      <main className="safe-bottom flex-1 px-4 py-4">
        <Outlet />
      </main>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title={t('common.menu')}>
        <Button variant="secondary" onClick={switchTurnus}>
          {t('common.switchTurnus')}
        </Button>
      </Sheet>
    </div>
  );
}
