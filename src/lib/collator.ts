/**
 * Czech-aware collator. All name sorting in the UI must go through this — never
 * rely on Firestore ordering (spec 1 / 15.2).
 */
export const csCollator = new Intl.Collator('cs', { sensitivity: 'base', numeric: true });

export function byName<T>(selector: (item: T) => string): (a: T, b: T) => number {
  return (a, b) => csCollator.compare(selector(a), selector(b));
}
