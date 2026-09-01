import { type SelectHTMLAttributes } from 'react';

import { cx } from '../lib/cx';

/** The shared styled `<select>` used by the list sort and filter controls (spec 9). */
export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cx(
        'select-caret h-10 rounded-xl border border-border bg-surface px-3 text-sm text-content',
        className,
      )}
      {...props}
    />
  );
}
