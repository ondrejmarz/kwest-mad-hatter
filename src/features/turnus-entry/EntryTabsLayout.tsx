import { useCallback, useMemo, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';

import type { Turnus } from '../../data/schemas/turnus';
import { useTranslation } from '../../i18n/LocaleProvider';
import { cx } from '../../lib/cx';
import {
  useHorizontalSwipe,
  type SwipeDirection,
} from '../../platform/gestures/useHorizontalSwipe';
import { LanguageSwitcher } from '../../ui/LanguageSwitcher';
import { Spinner } from '../../ui/Spinner';
import { TabBar } from '../../ui/TabBar';
import { InstallBanner } from '../install';
import { useSession } from '../session';

/** The entry tabs, in swipe order — Skupiny (index) is where a player joins a turnus. */
const ENTRY_TABS = ['/enter', '/enter/rules', '/enter/contact', '/enter/about'] as const;

/**
 * Passed down to the Skupiny tab (via the router Outlet) so joining a turnus can fold the entry
 * chrome up before the app takes over — the leave animation from the in-app shell, played on the
 * way in.
 */
export interface EntryOutletContext {
  readonly beginEnter: (turnus: Turnus) => void;
}

/**
 * The pre-turnus shell (spec 3, 9): the same header + tab bar + swipe machinery as the in-app
 * `AppLayout`, but with the entry tabs (Skupiny / Pravidla / Kontakt / Aplikace) and the version/©
 * credit in the header's left slot. Also the gate — a device that already belongs to its remembered
 * turnus is sent straight in, so a returning player never sees this screen.
 */
export function EntryTabsLayout() {
  const { t } = useTranslation();
  const { uid, turnus, role, roleLoading, enterTurnus } = useSession();
  const location = useLocation();
  const navigate = useNavigate();

  const dragRef = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState(false);

  const currentIndex = ENTRY_TABS.indexOf(location.pathname as (typeof ENTRY_TABS)[number]);

  useHorizontalSwipe(dragRef, {
    enabled: currentIndex !== -1,
    hasNeighbor: (dir) =>
      dir === 'next' ? currentIndex >= 0 && currentIndex < ENTRY_TABS.length - 1 : currentIndex > 0,
    onCommit: (dir) => {
      const target = ENTRY_TABS[currentIndex + (dir === 'next' ? 1 : -1)];
      if (target) navigate(target, { state: { swipe: dir } });
    },
  });

  // Joining folds the tab bar up first (fast) and only then persists the turnus, so the entry
  // chrome slides away just as the in-app shell slides in — the leave animation in reverse.
  const beginEnter = useCallback(
    (next: Turnus) => {
      if (leaving) return;
      setLeaving(true);
      window.setTimeout(() => enterTurnus({ id: next.id, slug: next.slug, name: next.name }), 160);
    },
    [leaving, enterTurnus],
  );

  const context = useMemo<EntryOutletContext>(() => ({ beginEnter }), [beginEnter]);

  const tabs = useMemo(
    () => [
      { to: '/enter', label: t('nav.groups') },
      { to: '/enter/rules', label: t('nav.rules') },
      { to: '/enter/contact', label: t('nav.contact') },
      { to: '/enter/about', label: t('nav.app') },
    ],
    [t],
  );

  const swipeDir = (location.state as { swipe?: SwipeDirection } | null)?.swipe;
  const swipeInClass =
    swipeDir === 'next' ? 'swipe-in-right' : swipeDir === 'prev' ? 'swipe-in-left' : undefined;

  // Still booting, or resolving the remembered turnus's role — hold on a spinner rather than flash
  // the picker before redirecting a returning member in.
  if (uid === null || (turnus !== null && roleLoading)) {
    return (
      <div className="flex min-h-full items-center justify-center bg-surface">
        <Spinner />
      </div>
    );
  }
  // A device that already belongs somewhere skips the entry screen entirely.
  if (role !== null) return <Navigate to="/" replace />;

  return (
    // Mirrors AppLayout: one viewport tall, static header/nav row, only `main` scrolls.
    <div className="mx-auto flex h-full max-w-lg flex-col bg-surface">
      <div className="safe-top z-20 shrink-0 bg-surface-raised">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-y border-border px-4 py-3">
          {/* The version/© credit fills the left slot here (the leave button's slot in-app). The
              `v`/`©` glyphs share a fixed-width box so the years line up. */}
          <div
            className={cx(
              'flex min-h-[44px] flex-col justify-center justify-self-start',
              leaving ? 'header-slot-out' : 'header-slot-in',
            )}
          >
            <span className="text-xs tabular-nums text-content-muted">
              <span className="inline-block w-[1.1em] text-right">v</span>
              {__APP_VERSION__}
            </span>
            <span className="text-xs tabular-nums text-content-muted">
              <span className="inline-block w-[1.1em] text-right">©</span>2026 Ondřej März
            </span>
          </div>
          <span className="justify-self-center text-lg font-semibold text-content">
            {t('appName')}
          </span>
          <div className="justify-self-end">
            <LanguageSwitcher />
          </div>
        </header>
        {/* The tab bar unfolds from under the header on entry and folds back up fast on join. */}
        <div className={cx('nav-reveal', leaving && 'nav-reveal--leaving')}>
          <div className="nav-reveal__inner">
            <TabBar items={tabs} />
          </div>
        </div>
      </div>
      <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div ref={dragRef} className="min-h-full will-change-transform">
          {/* The add-to-home-screen nudge rides the top of the entry shell, where a player first
              opens the shared link. Renders nothing once installed. */}
          <InstallBanner />
          <div key={location.pathname} className={swipeInClass}>
            <Outlet context={context} />
          </div>
        </div>
      </main>
    </div>
  );
}
