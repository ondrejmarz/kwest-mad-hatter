import { type FormEvent, useState } from 'react';

import { db } from '../../../data/firebase';
import { cancelReservation } from '../../../data/transactions/cancelReservation';
import { reserveTask } from '../../../data/transactions/reserveTask';
import { canReserveTask } from '../../../domain/eligibility';
import type { Player, Reservation, Task, TurnusSettings } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { categoryLabel } from '../../../lib/category';
import { Button } from '../../../ui/Button';
import { CardLayout } from '../../../ui/CardLayout';
import { Chip } from '../../../ui/Chip';
import { CoinAmount } from '../../../ui/CoinAmount';
import { Dialog } from '../../../ui/Dialog';
import { DifficultyDots } from '../../../ui/DifficultyDots';
import { Select } from '../../../ui/Select';

/**
 * Tap a task, reserve it (spec 7). Clicking the task is the whole interaction — the task is
 * already chosen, so there is nothing to type. Pair tasks pick a partner to invite; the
 * partner still has to accept. If this task is already the player's reservation, the dialog
 * flips to cancelling it instead.
 */
export function TaskActionDialog({
  task,
  myPlayer,
  settings,
  candidates,
  reservation,
  turnusId,
  onClose,
}: {
  task: Task;
  myPlayer: Player;
  settings: TurnusSettings;
  candidates: readonly Player[];
  reservation: Reservation | null;
  turnusId: string;
  onClose: () => void;
}) {
  const { t, locale } = useTranslation();
  const [partnerId, setPartnerId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const eligible = canReserveTask(myPlayer, task, settings);

  const run = async (action: Promise<{ ok: boolean }>): Promise<void> => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await action;
    setBusy(false);
    if (result.ok) onClose();
    else setError(t('entry.offline'));
  };

  const reserve = (event: FormEvent): void => {
    event.preventDefault();
    if (task.isPair) {
      const partner = candidates.find((player) => player.id === partnerId);
      if (partner === undefined) {
        setError(t('tasks.choosePartner'));
        return;
      }
      void run(
        reserveTask(db, turnusId, myPlayer.id, task.id, { id: partner.id, name: partner.name }),
      );
    } else {
      void run(reserveTask(db, turnusId, myPlayer.id, task.id));
    }
  };

  const reasonKey =
    eligible.ok || eligible.error.code === 'TASK_ALREADY_USED_BY_PLAYER'
      ? 'tasks.reasonUsed'
      : eligible.error.code === 'TASK_CATEGORY_CLOSED'
        ? 'tasks.reasonClosed'
        : 'tasks.reasonInactive';

  return (
    <Dialog open onClose={onClose} ariaLabel={localize(task.name, locale)}>
      <CardLayout
        title={localize(task.name, locale)}
        topRight={<DifficultyDots value={task.difficulty} />}
        chips={
          <>
            {task.categories.map((category) => (
              <Chip key={category.cs}>{categoryLabel(localize(category, locale))}</Chip>
            ))}
            {task.isPair && <Chip tone="accent">{t('tasks.pair')}</Chip>}
          </>
        }
        {...(task.description.cs !== '' ? { description: localize(task.description, locale) } : {})}
        footerRight={
          <div className="flex items-center gap-2">
            <CoinAmount amount={task.coinReward} signed />
            <CoinAmount amount={-task.coinPenalty} signed />
          </div>
        }
        clampDescription={false}
      />

      <div className="mt-4 border-t border-border pt-4">
        {reservation !== null && reservation.taskId === task.id ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-content">
              {reservation.isPair
                ? reservation.confirmed
                  ? t('tasks.pairConfirmed', { name: reservation.partnerName ?? '' })
                  : t('tasks.pairPending', { name: reservation.partnerName ?? '' })
                : t('tasks.reserved')}
            </p>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => void run(cancelReservation(db, turnusId, myPlayer.id))}
            >
              {t('tasks.cancelReservation')}
            </Button>
          </div>
        ) : eligible.ok ? (
          <form onSubmit={reserve} className="flex flex-col gap-3">
            {reservation !== null && (
              <p className="text-sm text-content-muted">
                {t('tasks.replaceHint', { name: localize(reservation.taskName, locale) })}
              </p>
            )}
            {task.isPair &&
              (candidates.length === 0 ? (
                <p className="text-sm text-content-muted">{t('tasks.noPartners')}</p>
              ) : (
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-content-muted">
                    {t('tasks.partnerLabel')}
                  </span>
                  <Select
                    value={partnerId}
                    onChange={(event) => setPartnerId(event.target.value)}
                    className="w-full"
                  >
                    <option value="">{t('tasks.choosePartner')}</option>
                    {candidates.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </Select>
                </label>
              ))}
            {task.isPair && <p className="text-sm text-content-muted">{t('tasks.partnerHint')}</p>}
            <Button type="submit" disabled={busy || (task.isPair && candidates.length === 0)}>
              {task.isPair ? t('tasks.reservePair') : t('tasks.reserve')}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-content-muted">{t(reasonKey)}</p>
        )}

        {error !== null && <p className="mt-3 text-sm text-danger">{error}</p>}
      </div>
    </Dialog>
  );
}
