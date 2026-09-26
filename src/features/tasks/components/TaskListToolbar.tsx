import type { LocalizedText } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { categoryLabel } from '../../../lib/category';
import { TYPE_OPTIONS } from '../../../lib/group';
import { Button } from '../../../ui/Button';
import { Checkbox } from '../../../ui/Checkbox';
import { Select } from '../../../ui/Select';
import { TASK_SORTS, type TaskSort } from '../taskList';

/**
 * The task list's controls (spec 9.2): sort and the one category filter share a row with the admin
 * add (+), and the two availability toggles — current round and next round — sit below it, each on
 * its own line. The category filter lists the three task types first, then every real tag; both
 * filter alike. The toggles only make sense for a player with a character, so they hide otherwise.
 */
export function TaskListToolbar({
  sort,
  onSortChange,
  category,
  onCategoryChange,
  categories,
  availToday,
  onAvailTodayChange,
  availTomorrow,
  onAvailTomorrowChange,
  showAvailability,
  onAdd,
}: {
  sort: TaskSort;
  onSortChange: (sort: TaskSort) => void;
  category: string;
  onCategoryChange: (category: string) => void;
  categories: readonly LocalizedText[];
  availToday: boolean;
  onAvailTodayChange: (checked: boolean) => void;
  availTomorrow: boolean;
  onAvailTomorrowChange: (checked: boolean) => void;
  showAvailability: boolean;
  /** Present only for an admin — adds a new task. */
  onAdd?: () => void;
}) {
  const { t, locale } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Select value={sort} onChange={(event) => onSortChange(event.target.value as TaskSort)}>
            {TASK_SORTS.map((value) => (
              <option key={value} value={value}>
                {t(`sort.${value}`)}
              </option>
            ))}
          </Select>
          <Select value={category} onChange={(event) => onCategoryChange(event.target.value)}>
            <option value="">{t('tasks.allCategories')}</option>
            {TYPE_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {t(`tasks.${option.labelKey}`)}
              </option>
            ))}
            {categories.map((tag) => (
              <option key={tag.cs} value={tag.cs}>
                {categoryLabel(localize(tag, locale))}
              </option>
            ))}
          </Select>
        </div>
        {onAdd !== undefined && (
          <Button
            variant="secondary"
            size="icon"
            className="shrink-0"
            aria-label={t('tasks.add')}
            onClick={onAdd}
          >
            +
          </Button>
        )}
      </div>
      {showAvailability && (
        <div className="flex flex-col gap-1">
          <Checkbox
            label={t('tasks.onlyAvailableToday')}
            checked={availToday}
            onChange={onAvailTodayChange}
          />
          <Checkbox
            label={t('tasks.onlyAvailableTomorrow')}
            checked={availTomorrow}
            onChange={onAvailTomorrowChange}
          />
        </div>
      )}
    </div>
  );
}
