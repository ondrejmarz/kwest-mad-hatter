import type { Locale } from './translate';

/** Correct coin plural per locale (spec 15.9): cs 1/2-4/5+, en/de 1/other. */
export function coinWord(locale: Locale, amount: number): string {
  const n = Math.abs(amount);
  switch (locale) {
    case 'cs':
      if (n === 1) {
        return 'Koin';
      }
      if (n >= 2 && n <= 4) {
        return 'Koiny';
      }
      return 'Koinů';
    case 'en':
      return n === 1 ? 'Koin' : 'Koins';
    case 'de':
      return n === 1 ? 'Koin' : 'Koins';
  }
}

export function formatCoins(locale: Locale, amount: number): string {
  return `${amount} ${coinWord(locale, amount)}`;
}
