import type { LocalizedText } from '../domain/types';

import type { Locale } from './translate';

/**
 * Pick a trilingual text for the active locale, falling back to Czech when the chosen
 * language is blank (spec 1). All display of task/reward names and descriptions goes
 * through this; sorting uses the same resolved string so the list reads in order.
 */
export function localize(text: LocalizedText, locale: Locale): string {
  return text[locale] || text.cs;
}
