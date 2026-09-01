import { type FormEvent, useState } from 'react';

import { db } from '../../../data/firebase';
import { cancelReservation } from '../../../data/transactions/cancelReservation';
import { reserveTask } from '../../../data/transactions/reserveTask';
import { canReserveTask } from '../../../domain/eligibility';
import type { PlayerId } from '../../../domain/ids';
import { reservationTally } from '../../../domain/reservation';
import type { Player, Reservation, Task, TurnusSettings } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { categoryLabel } from '../../../lib/category';
import { formatGroupSize } from '../../../lib/group';
import { Button } from '../../../ui/Button';
import { CardLayout } from '../../../ui/CardLayout';
import { Checkbox } from '../../../ui/Checkbox';
import { Chip } from '../../../ui/Chip';
import { CoinAmount } from '../../../ui/CoinAmount';
import { Dialog } from '../../../ui/Dialog';
import { DifficultyDots } from '../../../ui/DifficultyDots';

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
  const [invitees, setInvitees] = useState<readonly PlayerId[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const eligible = canReserveTask(myPlayer, task, settings);
  const isGroup = task.maxPlayers > 1;
  const minInvites = Math.max(0, task.minPlayers - 1);
  const maxInvites = Math.max(0, task.maxPlayers - 1);
  const countOk = invitees.length >= minInvites && invitees.length <= maxInvites;
  const mine = reservation !== null && reservation.taskId === task.id;

  const toggleInvitee = (id: PlayerId): void =>
    setInvitees((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < maxInvites
          ? [...prev, id]
          : prev,
    );

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
      setError(t('tasks.inviteCountHint', { min: task.minPlayers, max: task.maxPlayers }));
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
            {isGroup && (
              <Chip tone="accent">
                {t('tasks.groupSize', { size: formatGroupSize(task.minPlayers, task.maxPlayers) })}
              </Chip>
            )}
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
        {mine && reservation !== null ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-content">
              {reservation.invitees.length === 0
                ? t('tasks.reserved')
                : t('tasks.groupTally', {
                    accepted: reservationTally(reservation).accepted + 1,
                    total: reservation.invitees.length + 1,
                    declined: reservationTally(reservation).declined,
                  })}
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
            {isGroup &&
              (candidates.length === 0 ? (
                <p className="text-sm text-content-muted">{t('tasks.noPartners')}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-content-muted">
                    {t('tasks.inviteCountHint', { min: task.minPlayers, max: task.maxPlayers })}
                  </span>
                  {candidates.map((player) => (
                    <Checkbox
                      key={player.id}
                      label={player.name}
                      checked={invitees.includes(player.id)}
                      onChange={() => toggleInvitee(player.id)}
                    />
                  ))}
                </div>
              ))}
            <Button
              type="submit"
              disabled={busy || !countOk || (isGroup && candidates.length === 0)}
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
