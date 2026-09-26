import type { ReactNode } from 'react';

import { useTranslation } from '../../../i18n/LocaleProvider';
import { Button } from '../../../ui/Button';

/**
 * Taking a solo task for the current round (spec 7), shown above the reservation part of the task
 * dialog. A player with no task takes it; one who already holds a task switches to it, with the
 * dialog's warning when that leaves a pair partner without theirs.
 */
export function TakeNowSection({
  switching,
  leavesPairNote,
  busy,
  onTake,
}: {
  /** The player already holds a task this round, so taking this one swaps it. */
  switching: boolean;
  leavesPairNote: ReactNode;
  busy: boolean;
  onTake: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="mb-4 flex flex-col gap-2 border-b border-border pb-4">
      <p className="text-sm text-content-muted">
        {switching ? t('tasks.switchNowHint') : t('tasks.takeNowHint')}
      </p>
      {leavesPairNote}
      <Button disabled={busy} onClick={onTake}>
        {switching ? t('tasks.switchNow') : t('tasks.takeNow')}
      </Button>
    </div>
  );
}
