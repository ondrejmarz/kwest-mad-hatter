import { db } from '../../../data/firebase';
import { setCategories } from '../../../data/transactions/setCategories';
import { type EventMeta } from '../../../data/transactions/shared';
import type { LocalizedText } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { categoryLabel } from '../../../lib/category';
import { Checkbox } from '../../../ui/Checkbox';

/**
 * Admin picks which task categories are open, separately for today (players who missed a
 * reservation can still pick) and for tomorrow (reservations) — spec 9.4. Each instance edits
 * one field; at day evaluation tomorrow's set rolls into today's and tomorrow resets to empty.
 * State is driven by the turnus snapshot, so an offline toggle (which `setCategories` refuses)
 * simply leaves the box as it was. Identity is the tag's `cs`; the label is localized.
 */
export function CategoryPicker({
  turnusId,
  day,
  meta,
  field,
  title,
  hint,
  categories,
  selected,
}: {
  turnusId: string;
  day: number;
  meta: EventMeta;
  field: 'nextDay' | 'currentDay';
  title: string;
  hint: string;
  categories: readonly LocalizedText[];
  selected: readonly string[];
}) {
  const { t, locale } = useTranslation();
  const selectedSet = new Set(selected);

  const toggle = (cs: string, checked: boolean): void => {
    const next = new Set(selectedSet);
    if (checked) next.add(cs);
    else next.delete(cs);
    void setCategories(db, turnusId, { [field]: [...next] }, day, meta);
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-raised p-4">
      <h2 className="font-semibold text-content">{title}</h2>
      {categories.length === 0 ? (
        <p className="text-sm text-content-muted">{t('catalog.noCategories')}</p>
      ) : (
        <>
          <p className="text-xs text-content-muted">{hint}</p>
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
