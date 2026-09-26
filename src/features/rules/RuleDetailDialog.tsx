import { RULE_LINKS, type RuleId } from '../../i18n/rules/structure';
import type { RulesContent } from '../../i18n/rules/types';
import { Dialog } from '../../ui/Dialog';
import { SectionLabel } from '../../ui/SectionLabel';

import { RuleBlocks } from './RuleBlocks';

/**
 * The "?" of a rule: its full explanation, then links to related rules. A link swaps the dialog to
 * that rule instead of stacking a second dialog on top.
 */
export function RuleDetailDialog({
  ruleId,
  content,
  onOpen,
  onClose,
}: {
  ruleId: RuleId;
  content: RulesContent;
  onOpen: (id: RuleId) => void;
  onClose: () => void;
}) {
  const detail = content.rules[ruleId].detail;
  if (detail === undefined) return null;
  const related = (RULE_LINKS[ruleId] ?? []).flatMap((id) => {
    const target = content.rules[id].detail;
    return target ? [{ id, title: target.title }] : [];
  });

  return (
    <Dialog open onClose={onClose} title={detail.title}>
      <RuleBlocks blocks={detail.blocks} />
      {related.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <SectionLabel className="mb-2">{content.related}</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {related.map(({ id, title }) => (
              <button
                key={id}
                type="button"
                onClick={() => onOpen(id)}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-accent"
              >
                {title}
              </button>
            ))}
          </div>
        </div>
      )}
    </Dialog>
  );
}
