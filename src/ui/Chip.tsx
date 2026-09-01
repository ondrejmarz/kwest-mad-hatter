import { type ReactNode } from 'react';

import { cx } from '../lib/cx';

type Tone = 'accent' | 'warning' | 'muted' | 'success' | 'danger';

const TONES: Record<Tone, string> = {
  accent: 'bg-accent/15 text-accent',
  warning: 'bg-warning/15 text-warning',
  muted: 'bg-surface text-content-muted',
  success: 'bg-success/15 text-success',
  danger: 'bg-danger/15 text-danger',
};

/** Small inline status label (spec ui). Distinct from `Badge`, which is a red count bubble. */
export function Chip({ children, tone = 'muted' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}
