import { type ReactNode } from 'react';

/**
 * The shared top-right cluster of every list row (spec 9), so players, tasks and rewards line up
 * identically: the coin amount pinned top-right, an optional detail directly beneath it (a task's
 * difficulty) — both right-aligned in a column — and, furthest right, the admin edit pencil. Sits in
 * `CardLayout`'s top band, so the card title, the coins and the pencil all top-align on one row.
 */
export function CardTopRight({
  coins,
  below,
  edit,
}: {
  coins: ReactNode;
  below?: ReactNode;
  edit?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex flex-col items-end gap-1">
        {coins}
        {below}
      </div>
      {edit}
    </div>
  );
}
