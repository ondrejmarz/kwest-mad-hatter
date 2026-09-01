import { type ReactNode } from 'react';

import { cx } from '../lib/cx';

/**
 * The one row layout shared by the players, tasks and rewards lists (spec 9), so the
 * three read identically. Four bands top to bottom: the title with an optional
 * top-right slot (task difficulty), a chip row, a description line, and a footer whose
 * right edge carries coins and whose left edge holds the admin edit affordance. A row
 * with `onClick` behaves as a button (players open a detail); without it, it is static.
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
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 truncate font-medium text-content">{title}</div>
        {topRight !== undefined && <div className="shrink-0">{topRight}</div>}
      </div>
      {chips !== undefined && <div className="mt-1 flex flex-wrap items-center gap-1">{chips}</div>}
      {description !== undefined && (
        <p className="mt-1 line-clamp-2 text-sm text-content-muted">{description}</p>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">{footerLeft}</div>
        <div className="shrink-0">{footerRight}</div>
      </div>
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
