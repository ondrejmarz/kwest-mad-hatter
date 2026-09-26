import { useState } from 'react';

import { db } from '../../../data/firebase';
import { cancelReservation } from '../../../data/transactions/cancelReservation';
import { initiatePairPick } from '../../../data/transactions/initiatePairPick';
import { pickTaskNow } from '../../../data/transactions/pickTaskNow';
import { reserveTask } from '../../../data/transactions/reserveTask';
import { pairPartnerOf } from '../../../domain/activeTask';
import {
  canInitiatePairPick,
  canPickTaskNow,
  canReserveTask,
  hasUsedTask,
} from '../../../domain/eligibility';
import type { DomainError } from '../../../domain/errors';
import type { PlayerId, TaskId } from '../../../domain/ids';
import { reservationMembers } from '../../../domain/reservation';
import type { Player, Reservation, Task, TurnusSettings } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { taskType } from '../../../lib/group';
import type { Result } from '../../../lib/result';
import { Button } from '../../../ui/Button';
import { Dialog } from '../../../ui/Dialog';
import { FormError } from '../../../ui/FormError';
import { taskErrorKey } from '../taskErrorKey';

import { TakeNowSection } from './TakeNowSection';
import { TaskDialogHeader } from './TaskDialogHeader';
import { TaskReserveForm } from './TaskReserveForm';

/**
 * Tap a task, reserve it for the next round (spec 7). Solo and group tasks are reserved individually
 * — a group is pooled with the other reservers at evaluation. A pair picks one partner, who still has
 * to accept. A solo task can also be taken for the current round (first-come), a pair too once the
 * partner confirms; groups are reservation-only. If this task is already the player's reservation —
 * their own, or a pair they accepted — the dialog offers to cancel it. A pair is done together or
 * not at all, so cancelling or replacing a pair reservation, or switching away from a pair task,
 * cancels it for the partner too; the dialog says so up front. When the turnus forbids swapping a
 * task mid-round, a player who already holds one is told so instead of being offered the swap.
 */
export function TaskActionDialog({
  task,
  myPlayer,
  settings,
  candidates,
  reservation,
  acceptedInvite,
  takenBy,
  turnusId,
  onClose,
}: {
  task: Task;
  myPlayer: Player;
  settings: TurnusSettings;
  candidates: readonly Player[];
  reservation: Reservation | null;
  /** A pair this player accepted — reserving a different task cancels it for both (spec 7). */
  acceptedInvite: Reservation | null;
  takenBy: ReadonlyMap<TaskId, string>;
  turnusId: string;
  onClose: () => void;
}) {
  const { t, locale } = useTranslation();
  const [partnerId, setPartnerId] = useState<PlayerId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Only a pair invites a partner; solo and group tasks are reserved individually (spec 7).
  const isPair = taskType(task.minPlayers, task.maxPlayers) === 'pair';
  const invitees = isPair && partnerId !== null ? [partnerId] : [];
  const eligible = canReserveTask(myPlayer, task, settings);
  // The player's reservation for the next round: their own, or a pair they accepted (spec 7).
  const current = reservation ?? acceptedInvite;
  const mine = current !== null && current.taskId === task.id;
  // Any player may take an open, free task for the current round first-come — a solo one at once, a
  // pair once the partner accepts — unless it is already their own task this round (spec 7).
  const isMyTaskToday = myPlayer.activeTask?.taskId === task.id;
  const pickToday = canPickTaskNow(myPlayer, task, settings, takenBy);
  const pairToday = canInitiatePairPick(myPlayer, task, settings, takenBy);
  const canPickToday = !isMyTaskToday && pickToday.ok;
  const canPairToday = isPair && !isMyTaskToday && pairToday.ok;
  // Free to take, but the turnus forbids swapping the task this player already holds this round.
  const switchBlocked =
    !isMyTaskToday &&
    [pickToday, pairToday].some(
      (check) => !check.ok && check.error.code === 'TASK_SWITCH_DISABLED',
    );
  // A partner can't be someone who has already had this task — doing it now or on a past round — so
  // the same player can never end up doing it twice (spec 7).
  const partnerCandidates = candidates.filter((candidate) => !hasUsedTask(candidate, task));

  // A formed pair is cancelled for both members when either one cancels or replaces it, and leaving
  // a pair task in the current round takes it from the partner too — say so before it happens.
  const pairCancelNote =
    current !== null && reservationMembers(current).length > 1 ? (
      <p className="text-sm text-warning">{t('tasks.pairCancelsBoth')}</p>
    ) : null;
  const leftPartnerName =
    pairPartnerOf(myPlayer.activeTask) !== null
      ? (myPlayer.activeTask?.partnerNames[0] ?? null)
      : null;
  const leavesPairNote =
    leftPartnerName !== null ? (
      <p className="text-sm text-warning">
        {t('tasks.switchLeavesPair', { name: leftPartnerName })}
      </p>
    ) : null;

  // Every action runs the same way: one at a time, closing on success, and turning a failure into
  // its own message (a taken task, a locked round…) rather than a blanket "you're offline".
  const run = async (action: () => Promise<Result<void, DomainError>>): Promise<void> => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await action();
      if (result.ok) {
        onClose();
        return;
      }
      setError(t(taskErrorKey(result.error)));
    } catch {
      setError(t('common.somethingWrong'));
    }
    setBusy(false);
  };

  const takePairToday = (): void => {
    if (partnerId === null) {
      setError(t('tasks.choosePartner'));
      return;
    }
    void run(() => initiatePairPick(db, turnusId, myPlayer.id, task.id, partnerId));
  };

  // Reserving while committed to someone else's pair cancels that pair for both (in the same
  // transaction), so the player never holds two reservations at once (spec 7).
  const reserve = (): void => {
    if (isPair && partnerId === null) {
      setError(t('tasks.choosePartner'));
      return;
    }
    const leave = acceptedInvite !== null ? [acceptedInvite.playerId] : [];
    void run(() => reserveTask(db, turnusId, myPlayer.id, task.id, invitees, leave));
  };

  const reasonKey =
    eligible.ok || eligible.error.code === 'TASK_ALREADY_USED_BY_PLAYER'
      ? 'tasks.reasonUsed'
      : eligible.error.code === 'TASK_CATEGORY_CLOSED'
        ? 'tasks.reasonClosed'
        : 'tasks.reasonInactive';

  return (
    <Dialog open onClose={onClose} ariaLabel={localize(task.name, locale)}>
      <TaskDialogHeader task={task} />

      <div className="mt-4 border-t border-border pt-4">
        {settings.dayLocked ? (
          // A locked round allows no task action — not a reservation, a pick, or even a cancel (spec
          // 7). Show only the state and why nothing can be done, never a button that would fail.
          <div className="flex flex-col gap-2">
            {mine && <p className="text-sm text-content">{t('tasks.reserved')}</p>}
            <p className="text-sm text-content-muted">{t('tasks.dayLocked')}</p>
          </div>
        ) : (
          <>
            {canPickToday && (
              <TakeNowSection
                switching={myPlayer.activeTask !== null}
                leavesPairNote={leavesPairNote}
                busy={busy}
                onTake={() => void run(() => pickTaskNow(db, turnusId, myPlayer.id, task.id))}
              />
            )}
            {switchBlocked && (
              <p className="mb-4 border-b border-border pb-4 text-sm text-content-muted">
                {t('tasks.switchDisabled')}
              </p>
            )}
            {mine && current !== null ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-content">{t('tasks.reserved')}</p>
                {pairCancelNote}
                <Button
                  variant="danger"
                  disabled={busy}
                  onClick={() =>
                    void run(() => cancelReservation(db, turnusId, current.playerId, myPlayer.id))
                  }
                >
                  {t('tasks.cancelReservation')}
                </Button>
              </div>
            ) : eligible.ok || canPairToday ? (
              <TaskReserveForm
                isPair={isPair}
                partnerCandidates={partnerCandidates}
                partnerId={partnerId}
                onPartnerChange={setPartnerId}
                canReserve={eligible.ok}
                canPairToday={canPairToday}
                replaces={current?.taskName ?? null}
                pairCancelNote={pairCancelNote}
                leavesPairNote={leavesPairNote}
                busy={busy}
                onReserve={reserve}
                onTakePairToday={takePairToday}
              />
            ) : (
              <p className="text-sm text-content-muted">{t(reasonKey)}</p>
            )}
          </>
        )}

        <FormError message={error} className="mt-3" />
      </div>
    </Dialog>
  );
}
