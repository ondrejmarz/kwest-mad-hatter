import { cs, type Dictionary } from './cs';
import { de } from './de';
import { en } from './en';

export type Locale = 'cs' | 'en' | 'de';
export const LOCALES: readonly Locale[] = ['cs', 'en', 'de'];
export const LOCALE_NAMES: Record<Locale, string> = {
  cs: '[CZ] Čeština',
  en: '[EN] English',
  de: '[DE] Kezrisch',
};

const dictionaries: Record<Locale, Dictionary> = { cs, en, de };

// Dot-path keys into the (uniform) dictionary shape, e.g. 'nav.players'.
type PathInto<T> = T extends string
  ? never
  : {
      [K in keyof T & string]: T[K] extends string ? K : `${K}.${PathInto<T[K]>}`;
    }[keyof T & string];

export type TranslationKey = PathInto<Dictionary>;

export type TranslationParams = Record<string, string | number>;

function resolve(dict: Dictionary, key: string): string {
  const value = key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
  return typeof value === 'string' ? value : key;
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_match, name: string) =>
    name in params ? String(params[name]) : `{${name}}`,
  );
}

export function translate(locale: Locale, key: TranslationKey, params?: TranslationParams): string {
  return interpolate(resolve(dictionaries[locale], key), params);
}
