import { type ReactNode } from 'react';

import { SessionProvider } from '../../features/session';
import { LocaleProvider } from '../../i18n/LocaleProvider';

/** Composition root for app-wide providers. More land here in later phases. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <SessionProvider>{children}</SessionProvider>
    </LocaleProvider>
  );
}
