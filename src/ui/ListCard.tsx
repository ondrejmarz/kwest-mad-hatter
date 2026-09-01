import { type ReactNode } from 'react';

import { cx } from '../lib/cx';

import { CardLayout } from './CardLayout';

/**
 * A list row for players, tasks and rewards (spec 9): the shared `CardLayout` in a card frame.
 * A row with `onClick` behaves as a button (players open a detail, a claimed player reserves a
 * task); without it, it is static. The detail dialogs reuse the same `CardLayout`, so a row and
 * its opened detail line up exactly.
 */
export function ListCard({
  title,
  topRight,
  chips,
  description,
  footerLeft,
  footerRight,
  onClick,
  highlighted = false,
}: {
  title: ReactNode;
  topRight?: ReactNode;
  chips?: ReactNode;
  description?: ReactNode;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
  onClick?: () => void;
  highlighted?: boolean;
}) {
  const className = cx(
    'w-full rounded-xl border px-4 py-3 text-left',
    highlighted ? 'border-accent bg-accent/5' : 'border-border bg-surface-raised',
    onClick !== undefined && 'tap-target cursor-pointer',
  );

  const body = (
    <CardLayout
      title={title}
      {...(topRight !== undefined ? { topRight } : {})}
      {...(chips !== undefined ? { chips } : {})}
      {...(description !== undefined ? { description } : {})}
      {...(footerLeft !== undefined ? { footerLeft } : {})}
      {...(footerRight !== undefined ? { footerRight } : {})}
    />
  );

  if (onClick !== undefined) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
          }
        }}
        className={className}
      >
        {body}
      </div>
    );
  }
  return <div className={className}>{body}</div>;
}
