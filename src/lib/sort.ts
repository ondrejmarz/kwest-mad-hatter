import { csCollator } from './collator';

/**
 * Directional comparators behind the list sort controls (spec 9). Text always goes
 * through the Czech collator; both flip on `dir` so a screen can offer each key in
 * ascending and descending order.
 */
export function byNumber<T>(
  selector: (item: T) => number,
  dir: 'asc' | 'desc',
): (a: T, b: T) => number {
  const sign = dir === 'asc' ? 1 : -1;
  return (a, b) => sign * (selector(a) - selector(b));
}

export function byText<T>(
  selector: (item: T) => string,
  dir: 'asc' | 'desc',
): (a: T, b: T) => number {
  const sign = dir === 'asc' ? 1 : -1;
  return (a, b) => sign * csCollator.compare(selector(a), selector(b));
}
