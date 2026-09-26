import type { RuleId } from '../../i18n/rules/structure';
import type { RuleText } from '../../i18n/rules/types';

/**
 * One section of the rules: a card with its heading and one line per rule. A rule with a detail is
 * a button marked with "?" that opens it; a rule that needs no more context is plain text.
 */
export function RuleSectionCard({
  anchor,
  title,
  rules,
  onOpen,
}: {
  /** Element id the section shortcuts scroll to. */
  anchor: string;
  title: string;
  rules: readonly { readonly id: RuleId; readonly text: RuleText }[];
  onOpen: (id: RuleId) => void;
}) {
  return (
    <section
      id={anchor}
      aria-labelledby={`${anchor}-title`}
      className="scroll-mt-4 rounded-2xl border border-border bg-surface-raised px-4 pt-4 pb-1"
    >
      <h2 id={`${anchor}-title`} className="pb-3 font-semibold text-content">
        {title}
      </h2>
      <ul className="divide-y divide-border border-t border-border">
        {rules.map(({ id, text }) => (
          <li key={id}>
            {text.detail ? (
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={() => onOpen(id)}
                className="flex w-full items-start gap-3 py-3 text-left"
              >
                <span className="flex-1 text-sm text-content">{text.summary}</span>
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/40 text-xs font-semibold text-accent"
                >
                  ?
                </span>
              </button>
            ) : (
              <p className="py-3 pr-9 text-sm text-content">{text.summary}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
