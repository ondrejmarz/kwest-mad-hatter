import { useTranslation } from '../../i18n/LocaleProvider';
import { EmptyState } from '../../ui/EmptyState';

/** The Pravidla tab (spec 9). Short rules + full manuals land here later (backlog #3). */
export function EntryRulesScreen() {
  const { t } = useTranslation();
  return (
    <section className="flex flex-col gap-3">
      <EmptyState title={t('nav.rules')} description={t('screens.rulesPlaceholder')} />
    </section>
  );
}
