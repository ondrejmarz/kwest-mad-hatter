import { useTranslation } from '../../i18n/LocaleProvider';
import { EmptyState } from '../../ui/EmptyState';
import { ScreenHeader } from '../../ui/ScreenHeader';

export function RulesScreen() {
  const { t } = useTranslation();
  return (
    <section>
      <ScreenHeader title={t('nav.rules')} />
      <EmptyState title={t('nav.rules')} description={t('screens.rulesPlaceholder')} />
    </section>
  );
}
