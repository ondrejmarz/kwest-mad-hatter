import { type ReactNode } from 'react';

import { cx } from '../lib/cx';

import { CardLayout } from './CardLayout';

/**
 * A list row for players, tasks and rewards (spec 9): the shared `CardLayout` in a card frame.
 * A row with `onClick` behaves as a button (players open a detail, a claimed player reserves a
 * task); without it, it is static. The detail dialogs reuse the same `CardLayout`, so a row and
 * its opened detail line up exactly. A `muted` row is greyed out — an inactive catalog item that only
 * an admin still sees.
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
  muted = false,
  children,
}: {
  title: ReactNode;
  topRight?: ReactNode;
  chips?: ReactNode;
  description?: ReactNode;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
  onClick?: () => void;
  highlighted?: boolean;
  muted?: boolean;
  children?: ReactNode;
}) {
  const className = cx(
    // Uniform padding so nested content (the player's fact cards) sits the same distance from every
    // edge, not a tighter gap top/bottom than the sides.
    'w-full rounded-xl border p-4 text-left',
    highlighted ? 'border-accent bg-accent/5' : 'border-border bg-surface-raised',
    onClick !== undefined && 'tap-target cursor-pointer',
    muted && 'opacity-60',
  );

  const body = (
    <>
      <CardLayout
        title={title}
        {...(topRight !== undefined ? { topRight } : {})}
        {...(chips !== undefined ? { chips } : {})}
        {...(description !== undefined ? { description } : {})}
        {...(footerLeft !== undefined ? { footerLeft } : {})}
        {...(footerRight !== undefined ? { footerRight } : {})}
      />
      {children}
    </>
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
