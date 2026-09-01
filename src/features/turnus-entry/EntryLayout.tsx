import { type ReactNode } from 'react';

import { useTranslation } from '../../i18n/LocaleProvider';
import { LanguageSwitcher } from '../../ui/LanguageSwitcher';

/** Full-screen centered shell for the pre-turnus entry screens (spec 3, 9). */
export function EntryLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string | undefined;
  children: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div className="safe-bottom mx-auto flex min-h-full max-w-lg flex-col bg-surface">
      {/* Same header as the in-app one (AppLayout). The `min-h-[44px]` on the credit cell mirrors
          the logged-in header's 44px tap-target, so both headers are exactly as tall and the
          centered language switcher doesn't jump vertically when moving between them. */}
      <div className="safe-top z-20 shrink-0 bg-surface-raised">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-y border-border px-4 py-3">
          {/* The `v`/`©` glyphs share a fixed-width box so the text after them (the years) lines up
              vertically. Widen `w-[1.1em]` if the `©` ever looks cramped. */}
          <div className="flex min-h-[44px] flex-col justify-center justify-self-start">
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
      </div>
      <div className="flex flex-1 flex-col justify-center gap-8 px-6 pb-10">
        <header className="text-center">
          <h1 className="text-2xl font-bold text-content">{title}</h1>
          {subtitle !== undefined && <p className="mt-2 text-content-muted">{subtitle}</p>}
        </header>
        <div className="flex flex-col gap-3">{children}</div>
      </div>
    </div>
  );
}
