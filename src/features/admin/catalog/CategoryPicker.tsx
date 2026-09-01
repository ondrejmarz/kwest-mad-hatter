import { db } from '../../../data/firebase';
import { setCategories } from '../../../data/transactions/setCategories';
import { type EventMeta } from '../../../data/transactions/shared';
import type { LocalizedText } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { categoryLabel } from '../../../lib/category';
import { Checkbox } from '../../../ui/Checkbox';

/**
 * Admin picks which task categories are in play (spec 9.4). Until the game loop separates
 * "tomorrow" from "today" (phase 6), a checked category is opened for both, so tasks in it
 * show as available right away. State is driven by the turnus snapshot, so an offline toggle
 * (which `setCategories` refuses) simply leaves the box as it was.
 */
export function CategoryPicker({
  turnusId,
  day,
  meta,
  categories,
  selected,
}: {
  turnusId: string;
  day: number;
  meta: EventMeta;
  categories: readonly LocalizedText[];
  selected: readonly string[];
}) {
  const { t, locale } = useTranslation();
  const selectedSet = new Set(selected);

  // The open set stores the tag's canonical `cs`, not its localized label.
  const toggle = (cs: string, checked: boolean): void => {
    const next = new Set(selectedSet);
    if (checked) next.add(cs);
    else next.delete(cs);
    const list = [...next];
    void setCategories(db, turnusId, { nextDay: list, currentDay: list }, day, meta);
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-raised p-4">
      <h2 className="font-semibold text-content">{t('catalog.categoriesTitle')}</h2>
      {categories.length === 0 ? (
        <p className="text-sm text-content-muted">{t('catalog.noCategories')}</p>
      ) : (
        <>
          <p className="text-xs text-content-muted">{t('catalog.categoriesHint')}</p>
          <div className="flex flex-col gap-2">
            {categories.map((category) => (
              <Checkbox
                key={category.cs}
                label={categoryLabel(localize(category, locale))}
                checked={selectedSet.has(category.cs)}
                onChange={(checked) => toggle(category.cs, checked)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
