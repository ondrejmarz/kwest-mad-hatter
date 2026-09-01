import { Outlet } from 'react-router-dom';

import { AdminUnlockGesture } from '../features/admin/unlock/AdminUnlockGesture';
import { useSession } from '../features/session';
import { InviteBanner } from '../features/tasks/components/InviteBanner';
import { useTranslation } from '../i18n/LocaleProvider';
import { useOnlineStatus } from '../platform/connectivity/useOnlineStatus';
import { ConnectionBanner } from '../ui/ConnectionBanner';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { NavBar } from '../ui/NavBar';

export function AppLayout() {
  const { t } = useTranslation();
  const online = useOnlineStatus();
  const { role, switchTurnus } = useSession();

  return (
    // The shell is exactly one viewport tall and only `main` scrolls — so the header/nav are a
    // static flex row, not `position: sticky`. On iOS a sticky header rides the rubber-band
    // overscroll and detaches from the top; taking it out of the scroll container fixes that.
    <div className="mx-auto flex h-full max-w-lg flex-col bg-surface">
      {/* Header, offline banner and nav sit above the scroll area, so they never move. */}
      <div className="safe-top z-20 shrink-0 bg-surface-raised">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border px-4 py-3">
          {/* Leaving drops back to the turnus picker (spec 3). */}
          <button
            type="button"
            onClick={switchTurnus}
            aria-label={t('common.switchTurnus')}
            className="tap-target justify-self-start text-content-muted"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 -scale-x-100"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
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
      {/* Only this area scrolls. Bottom gap is consistent on every platform, plus the iPhone
          home-indicator inset. The invite cards ride at the top of the content on every screen. */}
      <main className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <InviteBanner />
        <Outlet />
      </main>
    </div>
  );
}
