import { cx } from '../lib/cx';

/** Difficulty shown as filled dots out of `max` (spec 9.2). */
export function DifficultyDots({ value, max = 6 }: { value: number; max?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value}/${max}`}>
      {Array.from({ length: max }, (_, index) => (
        <span
          key={index}
          className={cx('h-1.5 w-1.5 rounded-full', index < value ? 'bg-accent' : 'bg-border')}
        />
      ))}
    </span>
  );
}
