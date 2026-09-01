import { useTranslation } from '../../i18n/LocaleProvider';
import { EmptyState } from '../../ui/EmptyState';
import { ScreenHeader } from '../../ui/ScreenHeader';

export function AdminScreen() {
  const { t } = useTranslation();
  return (
    <section>
      <ScreenHeader title={t('nav.admin')} />
      <EmptyState title={t('nav.admin')} description={t('screens.adminPlaceholder')} />
    </section>
  );
}
