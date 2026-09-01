import { type ReactNode } from 'react';

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
  return (
    <div className="safe-bottom mx-auto flex min-h-full max-w-lg flex-col bg-surface">
      {/* Match the in-app header's insets (safe-area + `px-4 py-3`) so the language switcher lands
          in the same top-right spot on every screen, logged in or not. */}
      <div className="safe-top">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3">
          <span className="justify-self-start text-xs text-content-muted">©2026 Ondřej März</span>
          <span className="justify-self-center text-xs tabular-nums text-content-muted">
            v{__APP_VERSION__}
          </span>
          <div className="justify-self-end">
            <LanguageSwitcher />
          </div>
        </div>
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
