import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { rulesEn } from '../src/i18n/rules/en.ts';
import {
  RULE_LINKS,
  RULE_SECTIONS,
  RULES_CHECKED_AT,
  type RuleId,
  type RuleSectionId,
} from '../src/i18n/rules/structure.ts';
import type { RuleBlock } from '../src/i18n/rules/types.ts';

/**
 * Renders the English rules as the GitHub wiki page, so the wiki never drifts from the app. Clone
 * the wiki into `wiki/` (gitignored), run `npm run rules:wiki`, then commit and push there. Pass a
 * path to write somewhere else.
 */
const target = resolve(process.argv[2] ?? 'wiki/Rules.md');

const WIKI_INTRO =
  'KWEST is played by a group of people spending a few days together, on a trip or at a camp. ' +
  'Each section starts with the short rules as the app shows them, followed by the detailed ' +
  'explanations behind the question marks.';

/** GitHub's heading anchors: lowercase, punctuation dropped, spaces to hyphens, repeats numbered. */
function createSlugger(): (heading: string) => string {
  const seen = new Map<string, number>();
  return (heading) => {
    const base = heading
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, '')
      .replace(/\s/g, '-');
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };
}

function renderBlock(block: RuleBlock): string {
  if (typeof block === 'string') return block;
  if ('steps' in block) return block.steps.map((step, index) => `${index + 1}. ${step}`).join('\n');
  if ('example' in block) return `> ${block.example}`;
  return block.map((item) => `- ${item}`).join('\n');
}

// Anchors are handed out in document order, so work them all out before linking to any.
const slug = createSlugger();
slug(rulesEn.title);
const sectionAnchors = new Map<RuleSectionId, string>();
const ruleAnchors = new Map<RuleId, string>();
for (const section of RULE_SECTIONS) {
  sectionAnchors.set(section.id, slug(rulesEn.sections[section.id].title));
  for (const id of section.rules) {
    const detail = rulesEn.rules[id].detail;
    if (detail) ruleAnchors.set(id, slug(detail.title));
  }
}

const parts: string[] = [
  `# ${rulesEn.title}`,
  WIKI_INTRO,
  RULE_SECTIONS.map(
    (section, index) =>
      `${index + 1}. [${rulesEn.sections[section.id].title}](#${sectionAnchors.get(section.id)})`,
  ).join('\n'),
];

for (const section of RULE_SECTIONS) {
  parts.push('---', `## ${rulesEn.sections[section.id].title}`);
  parts.push(section.rules.map((id) => `- ${rulesEn.rules[id].summary}`).join('\n'));
  for (const id of section.rules) {
    const detail = rulesEn.rules[id].detail;
    if (!detail) continue;
    parts.push(`### ${detail.title}`, ...detail.blocks.map(renderBlock));
    const related = (RULE_LINKS[id] ?? []).flatMap((linked) => {
      const title = rulesEn.rules[linked].detail?.title;
      return title ? [`[${title}](#${ruleAnchors.get(linked)})`] : [];
    });
    if (related.length > 0) parts.push(`${rulesEn.related}: ${related.join(', ')}`);
  }
}

const checkedOn = new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'UTC' }).format(
  new Date(RULES_CHECKED_AT.date),
);
parts.push('---', `_${rulesEn.checkedAt.replace('{date}', checkedOn)}_`);

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${parts.join('\n\n')}\n`, 'utf8');
console.log(`Wrote ${target}`);
