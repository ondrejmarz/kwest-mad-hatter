import { describe, expect, it } from 'vitest';

import { LOCALES } from '../translate';

import { RULES } from './rulesContent';
import { RULE_LINKS, RULE_SECTIONS, type RuleId } from './structure';
import type { RuleBlock, RulesContent } from './types';

const RULE_IDS: readonly RuleId[] = RULE_SECTIONS.flatMap((section) => section.rules);

function blockText(block: RuleBlock): readonly string[] {
  if (typeof block === 'string') return [block];
  if ('steps' in block) return block.steps;
  if ('example' in block) return [block.example];
  return block;
}

function allText(content: RulesContent): readonly string[] {
  return [
    content.title,
    content.intro,
    content.related,
    content.checkedAt,
    ...Object.values(content.sections).flatMap((section) => [section.title, section.short]),
    ...Object.values(content.rules).flatMap((rule) => [
      rule.summary,
      ...(rule.detail ? [rule.detail.title, ...rule.detail.blocks.flatMap(blockText)] : []),
    ]),
  ];
}

describe('rules content', () => {
  it('lists every rule exactly once', () => {
    expect(new Set(RULE_IDS).size).toBe(RULE_IDS.length);
  });

  it.each(LOCALES)(
    '%s: gives every rule a summary and details the same rules as Czech',
    (locale) => {
      for (const id of RULE_IDS) {
        const rule = RULES[locale].rules[id];
        expect(rule.summary.trim()).not.toBe('');
        expect(rule.detail === undefined, id).toBe(RULES.cs.rules[id].detail === undefined);
      }
    },
  );

  it('links only to other rules that have a detail to open', () => {
    for (const [from, targets] of Object.entries(RULE_LINKS)) {
      for (const target of targets) {
        expect(target, from).not.toBe(from);
        expect(RULES.cs.rules[target].detail, `${from} -> ${target}`).toBeDefined();
      }
    }
  });

  // The rules read as plain, hand-written text: no bold, no dashes as punctuation, no ellipses.
  it.each(LOCALES)('%s: keeps the text plain', (locale) => {
    for (const text of allText(RULES[locale])) {
      expect(text).not.toMatch(/—|\*\*|…|→| – /);
    }
  });
});
