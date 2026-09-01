import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { translate, type Locale, type TranslationKey, type TranslationParams } from './translate';

const STORAGE_KEY = 'tabor.v1.locale';
const DEFAULT_LOCALE: Locale = 'cs';

function readStoredLocale(): Locale {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'cs' || raw === 'en' || raw === 'de') {
      return raw;
    }
  } catch {
    // Storage can be unavailable (private mode); fall back to default.
  }
  return DEFAULT_LOCALE;
}

interface TranslationContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Persisting the preference is best-effort.
    }
    document.documentElement.lang = next;
  }, []);

  const value = useMemo<TranslationContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, params) => translate(locale, key, params),
    }),
    [locale, setLocale],
  );

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslation(): TranslationContextValue {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LocaleProvider');
  }
  return context;
}
