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
    <div className="safe-top safe-bottom mx-auto flex min-h-full max-w-lg flex-col bg-surface">
      {/* Language switcher sits in the same top-right corner as the in-app header. */}
      <div className="flex justify-end px-4 py-3">
        <LanguageSwitcher />
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
