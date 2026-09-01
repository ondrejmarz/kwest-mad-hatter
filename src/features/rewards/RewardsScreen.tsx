import { useTranslation } from '../../i18n/LocaleProvider';
import { EmptyState } from '../../ui/EmptyState';
import { ScreenHeader } from '../../ui/ScreenHeader';

export function RewardsScreen() {
  const { t } = useTranslation();
  return (
    <section>
      <ScreenHeader title={t('nav.rewards')} />
      <EmptyState title={t('nav.rewards')} description={t('screens.rewardsPlaceholder')} />
    </section>
  );
}
