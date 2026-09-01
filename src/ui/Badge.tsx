import { type ReactNode } from 'react';

import { cx } from '../lib/cx';

/** Small count/status badge, e.g. pending-approvals indicator on nav. */
export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-xs font-semibold text-white',
        className,
      )}
    >
      {children}
    </span>
  );
}
