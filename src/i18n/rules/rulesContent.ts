import type { Locale } from '../translate';

import { rulesCs } from './cs.ts';
import { rulesDe } from './de.ts';
import { rulesEn } from './en.ts';
import type { RulesContent } from './types.ts';

/** The rules text in each UI language; the structure (order, links) is shared, see `structure`. */
export const RULES: Readonly<Record<Locale, RulesContent>> = {
  cs: rulesCs,
  en: rulesEn,
  de: rulesDe,
};
