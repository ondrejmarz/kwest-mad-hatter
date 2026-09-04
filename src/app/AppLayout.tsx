import { useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { AdminUnlockGesture } from '../features/admin/unlock/AdminUnlockGesture';
import { useSession } from '../features/session';
import { InviteBanner } from '../features/tasks/components/InviteBanner';
import { TodayPickBanner } from '../features/tasks/components/TodayPickBanner';
import { useTranslation } from '../i18n/LocaleProvider';
import { cx } from '../lib/cx';
import { useOnlineStatus } from '../platform/connectivity/useOnlineStatus';
import { useHorizontalSwipe, type SwipeDirection } from '../platform/gestures/useHorizontalSwipe';
import { ConnectionBanner } from '../ui/ConnectionBanner';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { NavBar, navItems } from '../ui/NavBar';

export function AppLayout() {
  const { t } = useTranslation();
  const online = useOnlineStatus();
  const { role, switchTurnus } = useSession();
  const location = useLocation();
  const navigate = useNavigate();

  const dragRef = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState(false);

  // Tab order mirrors the NavBar exactly, so a swipe steps to the visually adjacent tab.
  const tabs = useMemo(() => navItems(role === 'admin').map((item) => item.to), [role]);
  const currentIndex = tabs.indexOf(location.pathname);

  useHorizontalSwipe(dragRef, {
    enabled: currentIndex !== -1,
    hasNeighbor: (dir) =>
      dir === 'next' ? currentIndex >= 0 && currentIndex < tabs.length - 1 : currentIndex > 0,
    onCommit: (dir) => {
      const target = tabs[currentIndex + (dir === 'next' ? 1 : -1)];
      // The destination learns it arrived via a swipe so it can spring in from that side.
      if (target) navigate(target, { state: { swipe: dir } });
    },
  });

  // Leaving folds the tab bar up first (fast) and only then drops back to the turnus picker.
  const handleLeave = () => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(switchTurnus, 160);
  };

  const swipeDir = (location.state as { swipe?: SwipeDirection } | null)?.swipe;
  const swipeInClass =
    swipeDir === 'next' ? 'swipe-in-right' : swipeDir === 'prev' ? 'swipe-in-left' : undefined;

  return (
    // The shell is exactly one viewport tall and only `main` scrolls — so the header/nav are a
    // static flex row, not `position: sticky`. On iOS a sticky header rides the rubber-band
    // overscroll and detaches from the top; taking it out of the scroll container fixes that.
    <div className="mx-auto flex h-full max-w-lg flex-col bg-surface">
      {/* Header, offline banner and nav sit above the scroll area, so they never move. */}
      <div className="safe-top z-20 shrink-0 bg-surface-raised">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-y border-border px-4 py-3">
          {/* Leaving drops back to the turnus picker (spec 3). */}
          <button
            type="button"
            onClick={handleLeave}
            aria-label={t('common.switchTurnus')}
            className={cx(
              'tap-target justify-self-start text-content-muted',
              // Slides in from the left on entry, and back out fast — in step with the tab bar — on leave.
              leaving ? 'header-slot-out' : 'header-slot-in',
            )}
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
        {/* The tab bar unfolds from under the header on entry and folds back up fast on leave. */}
        <div className={cx('nav-reveal', leaving && 'nav-reveal--leaving')}>
          <div className="nav-reveal__inner">
            <NavBar showAdmin={role === 'admin'} />
          </div>
        </div>
      </div>
      {/* Only this area scrolls. `overflow-x-hidden` clips the content while it slides under a swipe.
          Bottom gap is consistent on every platform, plus the iPhone home-indicator inset. The
          invite cards ride at the top of the content on every screen. */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {/* The whole page content tracks a horizontal swipe; the keyed inner springs in on arrival. */}
        <div ref={dragRef} className="min-h-full will-change-transform">
          <TodayPickBanner />
          <InviteBanner />
          <div key={location.pathname} className={swipeInClass}>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
