import { useTranslation } from '../../i18n/LocaleProvider';
import { EmptyState } from '../../ui/EmptyState';
import { ScreenHeader } from '../../ui/ScreenHeader';

export function TasksScreen() {
  const { t } = useTranslation();
  return (
    <section>
      <ScreenHeader title={t('nav.tasks')} />
      <EmptyState title={t('nav.tasks')} description={t('screens.tasksPlaceholder')} />
    </section>
  );
}
