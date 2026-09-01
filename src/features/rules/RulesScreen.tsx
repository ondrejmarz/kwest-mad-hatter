import { useTranslation } from '../../i18n/LocaleProvider';
import { EmptyState } from '../../ui/EmptyState';

export function RulesScreen() {
  const { t } = useTranslation();
  return (
    <section className="flex flex-col gap-3">
      <EmptyState title={t('nav.rules')} description={t('screens.rulesPlaceholder')} />
    </section>
  );
}
