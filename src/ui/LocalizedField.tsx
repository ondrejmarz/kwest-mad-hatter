import { cx } from '../lib/cx';

/**
 * Editor for one trilingual value (spec 1): a label above three inputs, each tagged with its
 * language. Kept structural (`{ cs, en, de }`) rather than importing the domain type, so this
 * stays in the `ui` layer; the feature editors pass their `LocalizedText` straight in.
 */
interface Loc {
  readonly cs: string;
  readonly en: string;
  readonly de: string;
}

const LANGS: readonly (keyof Loc)[] = ['cs', 'en', 'de'];

export function LocalizedField({
  label,
  value,
  onChange,
  autoFocus = false,
}: {
  label: string;
  value: Loc;
  onChange: (value: Loc) => void;
  autoFocus?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-content-muted">{label}</span>
      {LANGS.map((lang, index) => (
        <div key={lang} className="flex items-center gap-2">
          <span className="w-6 shrink-0 text-xs font-semibold uppercase text-content-muted">
            {lang}
          </span>
          <input
            value={value[lang]}
            autoFocus={autoFocus && index === 0}
            onChange={(event) => onChange({ ...value, [lang]: event.target.value })}
            className={cx(
              'tap-target w-full rounded-xl border border-border bg-surface px-3 py-2 text-content',
              'outline-none placeholder:text-content-muted focus:border-accent',
            )}
          />
        </div>
      ))}
    </div>
  );
}
