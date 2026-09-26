import { type ReactNode } from 'react';

/**
 * The shared top-right cluster of every list row (spec 9), so players, tasks and rewards line up
 * identically: the coin amount, and furthest right the admin edit pencil, centred on one line. Sits
 * in `CardLayout`'s title row, level with the card title.
 */
export function CardTopRight({ coins, edit }: { coins: ReactNode; edit?: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {coins}
      {edit}
    </div>
  );
}
