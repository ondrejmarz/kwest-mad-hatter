import { type MouseEvent } from 'react';

import { EditButton } from '../../../ui/EditButton';

/**
 * Admin controls on a player row (spec 9.4): quick coin steps around the edit pencil, all the same
 * size so the group reads as a toolbar. Every button stops propagation so it never triggers the
 * row's own click (the player detail). The pencil reuses `EditButton` for one shared look.
 */
const STEPS = [-20, -5, 5, 20] as const;
const BTN =
  'inline-flex h-8 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-xs font-medium text-content';

export function AdminCoinControls({
  onAdjust,
  onEdit,
}: {
  onAdjust: (delta: number) => void;
  onEdit: () => void;
}) {
  const step = (delta: number) => (event: MouseEvent) => {
    event.stopPropagation();
    onAdjust(delta);
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      <EditButton onClick={onEdit} />
      {STEPS.filter((delta) => delta < 0).map((delta) => (
        <button key={delta} type="button" className={BTN} onClick={step(delta)}>
          {delta}
        </button>
      ))}
      {STEPS.filter((delta) => delta > 0).map((delta) => (
        <button key={delta} type="button" className={BTN} onClick={step(delta)}>
          +{delta}
        </button>
      ))}
    </div>
  );
}
