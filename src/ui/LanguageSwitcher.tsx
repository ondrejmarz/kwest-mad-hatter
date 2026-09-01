import { useTranslation } from '../i18n/LocaleProvider';
import { LOCALES, LOCALE_NAMES, type Locale } from '../i18n/translate';

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();
  return (
    <label className="flex items-center gap-1 text-xs text-content-muted">
      <span className="sr-only">{t('common.language')}</span>
      <select
        aria-label={t('common.language')}
        value={locale}
        onChange={(event) => {
          setLocale(event.target.value as Locale);
        }}
        className="tap-target rounded-lg border border-border bg-surface-raised px-2 py-1 text-content"
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_NAMES[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
