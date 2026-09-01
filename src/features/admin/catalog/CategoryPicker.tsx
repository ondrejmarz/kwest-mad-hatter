import { db } from '../../../data/firebase';
import { setCategories } from '../../../data/transactions/setCategories';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { Checkbox } from '../../../ui/Checkbox';

/** One selectable entry in a picker: a real category tag (`key` = its `cs`) or a task type key. */
export interface CategoryOption {
  readonly key: string;
  readonly label: string;
}

/**
 * Admin picks what is open, separately for today (players who missed a reservation can still pick)
 * and for tomorrow (reservations) — spec 9.4. Each option is a real category tag or one of the
 * three task types (`@type:*`), which gate exactly like a tag, so "open all pairs tomorrow" is a
 * tick like any category. Each instance edits one field; at evaluation tomorrow's set rolls into
 * today's and tomorrow resets. State is driven by the turnus snapshot, so an offline toggle (which
 * `setCategories` refuses) simply leaves the box as it was.
 */
export function CategoryPicker({
  turnusId,
  field,
  title,
  hint,
  options,
  selected,
}: {
  turnusId: string;
  field: 'nextDay' | 'currentDay';
  title: string;
  hint: string;
  options: readonly CategoryOption[];
  selected: readonly string[];
}) {
  const { t } = useTranslation();
  const selectedSet = new Set(selected);

  const toggle = (key: string, checked: boolean): void => {
    const next = new Set(selectedSet);
    if (checked) next.add(key);
    else next.delete(key);
    void setCategories(db, turnusId, { [field]: [...next] });
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-raised p-4">
      <h2 className="font-semibold text-content">{title}</h2>
      {options.length === 0 ? (
        <p className="text-sm text-content-muted">{t('catalog.noCategories')}</p>
      ) : (
        <>
          <p className="text-xs text-content-muted">{hint}</p>
          {/* Pushed to the bottom so the identical option lists line up row-for-row across the two
              columns, whose hints differ in length (spec 9.4). */}
          <div className="mt-auto flex flex-col gap-2">
            {options.map((option) => (
              <Checkbox
                key={option.key}
                label={option.label}
                checked={selectedSet.has(option.key)}
                onChange={(checked) => toggle(option.key, checked)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
