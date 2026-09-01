import { useTranslation } from '../../i18n/LocaleProvider';
import { EmptyState } from '../../ui/EmptyState';
import { ScreenHeader } from '../../ui/ScreenHeader';

export function PlayersScreen() {
  const { t } = useTranslation();
  return (
    <section>
      <ScreenHeader title={t('nav.players')} />
      <EmptyState title={t('nav.players')} description={t('screens.playersPlaceholder')} />
    </section>
  );
}
