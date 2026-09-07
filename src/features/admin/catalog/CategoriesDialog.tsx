import type { LocalizedText } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { categoryLabel } from '../../../lib/category';
import { csCollator } from '../../../lib/collator';
import { TYPE_OPTIONS } from '../../../lib/group';
import { Dialog } from '../../../ui/Dialog';
import { Spinner } from '../../../ui/Spinner';
import { useCatalogTasks, useSession, useTurnus } from '../../session';

import { CategoryPicker } from './CategoryPicker';

/**
 * The open-category selection (spec 9.4) in a dialog, reached from Profil+ — two columns, today and
 * tomorrow. The options are the three task types (`@type:*`) plus every real tag, which gate alike.
 */
export function CategoriesDialog({ onClose }: { onClose: () => void }) {
  const { t, locale } = useTranslation();
  const { turnus } = useSession();
  const turnusState = useTurnus();
  const tasksState = useCatalogTasks();

  if (
    turnus === null ||
    turnusState.status !== 'ready' ||
    turnusState.data === null ||
    tasksState.status !== 'ready'
  ) {
    return (
      <Dialog open onClose={onClose} title={t('admin.categories')}>
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      </Dialog>
    );
  }

  const settings = turnusState.data;
  const tasks = tasksState.data;
  // Distinct category tags across tasks, keyed by their canonical `cs` identity.
  const categoryMap = new Map<string, LocalizedText>();
  for (const task of tasks) {
    for (const category of task.categories) {
      if (!categoryMap.has(category.cs)) categoryMap.set(category.cs, category);
    }
  }
  const categories = [...categoryMap.values()].sort((a, b) => csCollator.compare(a.cs, b.cs));
  const typeOptions = TYPE_OPTIONS.map((option) => ({
    key: option.key,
    label: t(`tasks.${option.labelKey}`),
  }));
  const categoryOptions =
    categories.length === 0
      ? []
      : [
          ...typeOptions,
          ...categories.map((category) => ({
            key: category.cs,
            label: categoryLabel(localize(category, locale)),
          })),
        ];

  return (
    <Dialog open onClose={onClose} title={t('admin.categories')}>
      <div className="grid grid-cols-2 gap-3">
        <CategoryPicker
          turnusId={turnus.id}
          field="currentDay"
          title={t('catalog.categoriesTodayTitle')}
          hint={t('catalog.categoriesTodayHint')}
          options={categoryOptions}
          selected={settings.currentDayCategories}
        />
        <CategoryPicker
          turnusId={turnus.id}
          field="nextDay"
          title={t('catalog.categoriesTomorrowTitle')}
          hint={t('catalog.categoriesTomorrowHint')}
          options={categoryOptions}
          selected={settings.nextDayCategories}
        />
      </div>
    </Dialog>
  );
}
