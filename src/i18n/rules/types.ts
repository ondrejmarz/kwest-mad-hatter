import type { RuleId, RuleSectionId } from './structure.ts';

/**
 * One piece of a rule's detail: a paragraph, a bullet list, numbered steps, or a worked example set
 * apart from the text. Plain strings only, no inline markup, so the app and the wiki render the
 * same content.
 */
export type RuleBlock =
  string | readonly string[] | { readonly steps: readonly string[] } | { readonly example: string };

export interface RuleText {
  /** The one-line rule shown on the tab. */
  readonly summary: string;
  /** What the rule's dialog explains; a rule that needs no more context has none. */
  readonly detail?: { readonly title: string; readonly blocks: readonly RuleBlock[] };
}

export interface RulesContent {
  readonly title: string;
  readonly intro: string;
  /** Accessible name of the section shortcuts at the top. */
  readonly contents: string;
  /** Heading of the related-rule links at the bottom of a detail. */
  readonly related: string;
  /** Footer with the date the rules were last checked; `{date}` is filled in. */
  readonly checkedAt: string;
  readonly sections: Readonly<
    Record<RuleSectionId, { readonly title: string; readonly short: string }>
  >;
  readonly rules: Readonly<Record<RuleId, RuleText>>;
}
