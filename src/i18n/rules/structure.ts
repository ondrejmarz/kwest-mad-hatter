/**
 * The shape of the Pravidla tab (spec 9): sections in reading order, the rules in each, and the
 * related rules a detail links to. The text lives per locale next to this file, so the three
 * languages can't drift apart in order or links. Files in this folder import each other with a
 * `.ts` extension so `npm run rules:wiki` can load them under plain Node.
 */
export const RULE_SECTIONS = [
  { id: 'basics', rules: ['goal', 'rounds'] },
  { id: 'character', rules: ['joinGroup', 'newCharacter', 'claimCharacter'] },
  { id: 'tasks', rules: ['taskCoins', 'taskTypes', 'categories', 'onceOnly'] },
  { id: 'reservations', rules: ['reserve', 'poorerRule', 'noTask'] },
  { id: 'currentRound', rules: ['takeNow', 'switchTask'] },
  { id: 'teams', rules: ['pairInvite', 'pairTogether', 'groupTasks'] },
  { id: 'auction', rules: ['blindAuction', 'paying', 'rewardLimit', 'rewardWon'] },
  { id: 'punishments', rules: ['rewardForms', 'pickTargets', 'targetLimit'] },
  { id: 'evaluation', rules: ['lockedRound', 'evaluationOrder', 'newRound'] },
  { id: 'coins', rules: ['profile', 'adjustments', 'negativeBalance'] },
  { id: 'visibility', rules: ['whoSeesWhat'] },
  { id: 'settings', rules: ['groupSettings'] },
] as const;

export type RuleSectionId = (typeof RULE_SECTIONS)[number]['id'];
export type RuleId = (typeof RULE_SECTIONS)[number]['rules'][number];

/** Related rules offered at the bottom of a rule's detail, in order. Each target has a detail. */
export const RULE_LINKS: Partial<Record<RuleId, readonly RuleId[]>> = {
  rounds: ['evaluationOrder'],
  taskTypes: ['pairInvite', 'groupTasks'],
  reserve: ['poorerRule'],
  poorerRule: ['groupTasks', 'noTask'],
  noTask: ['takeNow'],
  takeNow: ['switchTask'],
  switchTask: ['pairTogether'],
  pairInvite: ['pairTogether', 'poorerRule'],
  groupTasks: ['poorerRule'],
  blindAuction: ['paying'],
  paying: ['evaluationOrder'],
  pickTargets: ['targetLimit'],
  evaluationOrder: ['poorerRule', 'newRound'],
  newRound: ['noTask'],
};

/**
 * The last commit whose game behaviour this text was checked against, and when. Before touching the
 * rules, list what changed since:
 * `git log --oneline <commit>..HEAD -- src/domain src/data/transactions firestore.rules`
 */
export const RULES_CHECKED_AT = { commit: '571f456', date: '2026-09-26' } as const;
