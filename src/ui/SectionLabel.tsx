import { type ReactNode } from 'react';

import { cx } from '../lib/cx';

/**
 * The small uppercase "eyebrow" label above a section or fact — muted and semibold. Rendered as a
 * `<p>` by default; pass `as="h2"`/`"h3"` where the label is the section's actual heading (as in
 * the evaluation panel) so heading semantics survive. Contextual spacing (`mb-1`, `mb-2`) goes
 * through `className`.
 */
export function SectionLabel({
  children,
  as: Tag = 'p',
  className,
}: {
  children: ReactNode;
  as?: 'p' | 'h2' | 'h3';
  className?: string;
}) {
  return (
    <Tag className={cx('text-xs font-semibold uppercase text-content-muted', className)}>
      {children}
    </Tag>
  );
}
