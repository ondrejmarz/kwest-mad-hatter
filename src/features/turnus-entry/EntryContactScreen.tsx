import { useTranslation } from '../../i18n/LocaleProvider';

const GITHUB_URL = 'https://github.com/ondrejmarz/kwest-mad-hatter';

/** The Kontakt tab (spec 9). For now just a link to the project on GitHub; more lands later. */
export function EntryContactScreen() {
  const { t } = useTranslation();
  return (
    <section className="flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-xl font-bold text-content sm:text-2xl">{t('contact.title')}</h1>
        <p className="mt-2 text-content-muted">{t('contact.intro')}</p>
      </header>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noreferrer noopener"
        // Styled like a secondary Button (which is a <button>, so it can't be an anchor).
        className="tap-target inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-raised px-4 py-2 text-sm font-medium text-content transition-colors"
      >
        {t('contact.github')}
      </a>
    </section>
  );
}
