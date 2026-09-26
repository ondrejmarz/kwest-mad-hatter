import { type ReactNode } from 'react';

import { cx } from '../lib/cx';

/**
 * The four content bands shared by list rows and their detail dialogs (spec 9), so the same
 * facts sit in the same place in both: the title row (the coins top-right, and optionally a detail
 * centred between them, such as a task's difficulty), a chip row, a description line, and a footer
 * for anything that belongs under the text. Extra, view-specific content goes below this, never
 * inside it. This renders no container of its own — `ListCard` adds the card frame; a dialog drops
 * it straight into its panel.
 */
export function CardLayout({
  title,
  topCenter,
  topRight,
  chips,
  description,
  footerLeft,
  footerRight,
  clampDescription = true,
}: {
  title: ReactNode;
  /** Centred on the title row, level with the title and the coins; the title then wraps. */
  topCenter?: ReactNode;
  topRight?: ReactNode;
  chips?: ReactNode;
  description?: ReactNode;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
  clampDescription?: boolean;
}) {
  return (
    <>
      {topCenter !== undefined ? (
        // Equal side columns keep the centre slot in the middle of the card on every row.
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
          <div className="line-clamp-2 break-words font-medium text-content">{title}</div>
          <div>{topCenter}</div>
          <div className="justify-self-end">{topRight}</div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 truncate font-medium text-content">{title}</div>
          {topRight !== undefined && <div className="shrink-0">{topRight}</div>}
        </div>
      )}
      {chips !== undefined && <div className="mt-1 flex flex-wrap items-center gap-1">{chips}</div>}
      {description !== undefined && (
        <p className={cx('mt-1 text-sm text-content-muted', clampDescription && 'line-clamp-2')}>
          {description}
        </p>
      )}
      {(footerLeft !== undefined || footerRight !== undefined) && (
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">{footerLeft}</div>
          <div className="shrink-0">{footerRight}</div>
        </div>
      )}
    </>
  );
}
