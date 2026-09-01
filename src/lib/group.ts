/** A group-size interval as a compact label: "2" when exact, "2–4" when a range (spec 9.2). */
export function formatGroupSize(min: number, max: number): string {
  return min === max ? String(min) : `${min}–${max}`;
}

export type TaskType = 'solo' | 'pair' | 'group';

/**
 * The three task kinds, derived from the size interval (spec 9.2): a solo task (1/1), a pair (2/2,
 * reserved via an invite), and everything else a group (a range, reserved individually). Drives the
 * chip on a task card and the type filter in the list.
 */
export function taskType(minPlayers: number, maxPlayers: number): TaskType {
  if (maxPlayers <= 1) return 'solo';
  if (minPlayers === 2 && maxPlayers === 2) return 'pair';
  return 'group';
}

/**
 * Reserved category keys for the three task types. The admin's open-category set and the list's
 * category filter carry these alongside real category tags, so a type gates and filters exactly
 * like a category — "open all pairs for tomorrow", or "show only groups". The `@` prefix keeps a
 * type key from ever colliding with a real tag's `cs` identity.
 */
export const TYPE_KEYS: Record<TaskType, string> = {
  solo: '@type:solo',
  pair: '@type:pair',
  group: '@type:group',
};

/** The synthetic category key for a task's size interval (see `TYPE_KEYS`). */
export function taskTypeKey(minPlayers: number, maxPlayers: number): string {
  return TYPE_KEYS[taskType(minPlayers, maxPlayers)];
}

/**
 * The three type entries in display order, each with the `tasks.*` label key its consumer feeds to
 * `t`. Shared by the admin's open-category pickers and the list's category filter so both list the
 * types the same way, ahead of the real category tags.
 */
export const TYPE_OPTIONS: readonly {
  readonly key: string;
  readonly labelKey: 'typeSolo' | 'typePair' | 'typeGroup';
}[] = [
  { key: TYPE_KEYS.solo, labelKey: 'typeSolo' },
  { key: TYPE_KEYS.pair, labelKey: 'typePair' },
  { key: TYPE_KEYS.group, labelKey: 'typeGroup' },
];
