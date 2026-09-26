import { useState } from 'react';

import { useTranslation } from '../../i18n/LocaleProvider';
import { RULES } from '../../i18n/rules/rulesContent';
import {
  RULE_SECTIONS,
  RULES_CHECKED_AT,
  type RuleId,
  type RuleSectionId,
} from '../../i18n/rules/structure';

import { RuleDetailDialog } from './RuleDetailDialog';
import { RuleSectionCard } from './RuleSectionCard';

function sectionAnchor(id: RuleSectionId): string {
  return `rules-${id}`;
}

/**
 * The Pravidla tab (spec 9): every rule as one short line, grouped into sections, with shortcuts to
 * jump between them. A rule that needs more context opens its detail in a dialog, and each detail
 * links on to related rules. The footer says when the text was last checked against the game.
 */
export function RulesScreen() {
  const { locale } = useTranslation();
  const content = RULES[locale];
  const [openRule, setOpenRule] = useState<RuleId | null>(null);

  const jumpTo = (id: RuleSectionId): void => {
    document
      .getElementById(sectionAnchor(id))
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // A bare ISO date parses as UTC midnight, so format it in UTC to keep the same calendar day.
  const checkedOn = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(RULES_CHECKED_AT.date),
  );

  return (
    <section className="flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-xl font-bold text-content sm:text-2xl">{content.title}</h1>
        <p className="mt-2 text-content-muted">{content.intro}</p>
      </header>

      <nav aria-label={content.contents} className="flex flex-wrap justify-center gap-2">
        {RULE_SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => jumpTo(section.id)}
            className="rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-sm text-content"
          >
            {content.sections[section.id].short}
          </button>
        ))}
      </nav>

      <div className="flex flex-col gap-3">
        {RULE_SECTIONS.map((section) => (
          <RuleSectionCard
            key={section.id}
            anchor={sectionAnchor(section.id)}
            title={content.sections[section.id].title}
            rules={section.rules.map((id) => ({ id, text: content.rules[id] }))}
            onOpen={setOpenRule}
          />
        ))}
      </div>

      <p className="text-center text-xs text-content-muted">
        {content.checkedAt.replace('{date}', checkedOn)}
      </p>

      {openRule !== null && (
        // Keyed by rule, so following a related link starts the next detail from its top.
        <RuleDetailDialog
          key={openRule}
          ruleId={openRule}
          content={content}
          onOpen={setOpenRule}
          onClose={() => setOpenRule(null)}
        />
      )}
    </section>
  );
}
