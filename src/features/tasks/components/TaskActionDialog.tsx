import { type FormEvent, useState } from 'react';

import { db } from '../../../data/firebase';
import { cancelReservation } from '../../../data/transactions/cancelReservation';
import { pickTaskNow } from '../../../data/transactions/pickTaskNow';
import { reserveTask } from '../../../data/transactions/reserveTask';
import { canPickTaskNow, canReserveTask } from '../../../domain/eligibility';
import type { PlayerId, TaskId } from '../../../domain/ids';
import type { Player, Reservation, Task, TurnusSettings } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { categoryLabel } from '../../../lib/category';
import { formatGroupSize, taskType } from '../../../lib/group';
import { Button } from '../../../ui/Button';
import { CardLayout } from '../../../ui/CardLayout';
import { Chip } from '../../../ui/Chip';
import { CoinAmount } from '../../../ui/CoinAmount';
import { Dialog } from '../../../ui/Dialog';
import { DifficultyDots } from '../../../ui/DifficultyDots';
import { Select } from '../../../ui/Select';

/**
 * Tap a task, reserve it (spec 7). Solo tasks reserve straight away; group tasks pick who to
 * invite (between minPlayers−1 and maxPlayers−1 others), and each invitee still has to accept —
 * the group only forms if enough do by evaluation. If this task is already the player's own
 * reservation, the dialog shows the accept/decline tally and offers to cancel it.
 */
export function TaskActionDialog({
  task,
  myPlayer,
  settings,
  candidates,
  reservation,
  takenBy,
  turnusId,
  onClose,
}: {
  task: Task;
  myPlayer: Player;
  settings: TurnusSettings;
  candidates: readonly Player[];
  reservation: Reservation | null;
  takenBy: ReadonlyMap<TaskId, string>;
  turnusId: string;
  onClose: () => void;
}) {
  const { t, locale } = useTranslation();
  const [invitees, setInvitees] = useState<readonly PlayerId[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const eligible = canReserveTask(myPlayer, task, settings);
  const type = taskType(task.minPlayers, task.maxPlayers);
  // Only a pair invites a partner; solo and group tasks are reserved individually (a group is pooled
  // at evaluation, spec 7).
  const isPair = type === 'pair';
  const countOk = isPair ? invitees.length === 1 : invitees.length === 0;
  const mine = reservation !== null && reservation.taskId === task.id;
  // Any player may take an open, free SOLO task for today first-come — whether they have no task or
  // are switching from one — as long as it is not already their own task today (spec 7).
  const isMyTaskToday = myPlayer.activeTask?.taskId === task.id;
  const canPickToday = !isMyTaskToday && canPickTaskNow(myPlayer, task, settings, takenBy).ok;

  const takeNow = async (): Promise<void> => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await pickTaskNow(db, turnusId, myPlayer.id, task.id);
    setBusy(false);
    if (result.ok) onClose();
    else if (result.error.code === 'TASK_TAKEN_TODAY') setError(t('tasks.takenToday'));
    else setError(t('entry.offline'));
  };

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
    if (!countOk) {
      setError(t('tasks.choosePartner'));
      return;
    }
    void run(reserveTask(db, turnusId, myPlayer.id, task.id, invitees));
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
            {isPair && <Chip tone="accent">{t('tasks.pairChip')}</Chip>}
            {type === 'group' && (
              <Chip tone="accent">
                {t('tasks.groupSize', { size: formatGroupSize(task.minPlayers, task.maxPlayers) })}
              </Chip>
            )}
          </>
        }
        {...(task.description.cs !== '' ? { description: localize(task.description, locale) } : {})}
        footerRight={<CoinAmount amount={task.coinReward} signed />}
        clampDescription={false}
      />

      <div className="mt-4 border-t border-border pt-4">
        {canPickToday && (
          <div className="mb-4 flex flex-col gap-2 border-b border-border pb-4">
            <p className="text-sm text-content-muted">
              {myPlayer.activeTask !== null ? t('tasks.switchNowHint') : t('tasks.takeNowHint')}
            </p>
            <Button disabled={busy} onClick={() => void takeNow()}>
              {myPlayer.activeTask !== null ? t('tasks.switchNow') : t('tasks.takeNow')}
            </Button>
          </div>
        )}
        {mine && reservation !== null ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-content">{t('tasks.reserved')}</p>
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
            {isPair &&
              (candidates.length === 0 ? (
                <p className="text-sm text-content-muted">{t('tasks.noPartners')}</p>
              ) : (
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-content-muted">
                    {t('tasks.choosePartner')}
                  </span>
                  <Select
                    value={invitees[0] ?? ''}
                    onChange={(event) =>
                      setInvitees(event.target.value ? [event.target.value as PlayerId] : [])
                    }
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
            <Button
              type="submit"
              disabled={busy || !countOk || (isPair && candidates.length === 0)}
            >
              {t('tasks.reserve')}
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
