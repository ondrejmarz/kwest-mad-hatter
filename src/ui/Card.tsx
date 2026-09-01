import { type HTMLAttributes } from 'react';

import { cx } from '../lib/cx';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx('rounded-2xl border border-border bg-surface-raised p-4 shadow-sm', className)}
      {...props}
    />
  );
}
