import { cx } from '../lib/cx';

/**
 * The small danger-colored line a form shows under a field or above its submit button. Renders
 * nothing when `message` is null, so a form passes its `string | null` error state straight
 * through. `className` tweaks spacing/alignment (e.g. `mt-3`, `text-center`).
 */
export function FormError({ message, className }: { message: string | null; className?: string }) {
  if (message === null) return null;
  return <p className={cx('text-sm text-danger', className)}>{message}</p>;
}
