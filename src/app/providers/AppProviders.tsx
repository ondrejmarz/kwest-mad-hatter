import { type ReactNode } from 'react';

import { LocaleProvider } from '../../i18n/LocaleProvider';

/** Composition root for app-wide providers. More land here in later phases. */
export function AppProviders({ children }: { children: ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}
