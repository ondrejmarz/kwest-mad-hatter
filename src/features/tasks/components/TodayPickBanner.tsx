import { useState } from 'react';

import { db } from '../../../data/firebase';
import { toTurnusSettings } from '../../../data/schemas/turnus';
import { acceptPairPick } from '../../../data/transactions/acceptPairPick';
import { declinePairPick } from '../../../data/transactions/declinePairPick';
import { canJoinPairPick } from '../../../domain/eligibility';
import type { DomainError } from '../../../domain/errors';
import type { PlayerId, TaskId } from '../../../domain/ids';
import type { LocalizedText, Player } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import type { Result } from '../../../lib/result';
import { Button } from '../../../ui/Button';
import { Chip } from '../../../ui/Chip';
import { FormError } from '../../../ui/FormError';
import { useCatalogTasks, useMyPlayer, usePlayers, useTaskClaims, useTurnus } from '../../session';
import { taskErrorKey } from '../taskErrorKey';

const CARD = 'rounded-2xl border border-border bg-surface-raised p-4';

/**
 * Same-round pair picks that are still pending (spec 7): the initiator sees a "waiting for {partner}"
 * card with a cancel, and the invited partner sees a Confirm/Decline. On confirm both members get
 * the task for the current round at once. Mirrors the reservation `InviteBanner`, but for the
 * round's claims. Names and task titles come from the roster and catalog (the claim stores only ids).
 * When accepting can't work — the round is locked, or switching is off and a member already holds a
 * task — the card says why instead of offering a Confirm that would fail.
 */
export function TodayPickBanner() {
  const { t, locale } = useTranslation();
  const myPlayer = useMyPlayer();
  const claimsState = useTaskClaims();
  const playersState = usePlayers();
  const tasksState = useCatalogTasks();
  const turnusState = useTurnus();

  if (myPlayer === null) return null;
  const turnus = turnusState.status === 'ready' ? turnusState.data : null;
  if (turnus === null) return null;
  const claims = claimsState.status === 'ready' ? claimsState.data : [];
  const pending = claims.filter(
    (claim) => claim.day === turnus.currentDay && claim.invitee !== null && !claim.accepted,
  );
  const outgoing = pending.filter((claim) => claim.playerId === myPlayer.id);
  const incoming = pending.filter((claim) => claim.invitee === myPlayer.id);
  if (outgoing.length === 0 && incoming.length === 0) return null;

  const settings = toTurnusSettings(turnus);
  const playerById =
    playersState.status === 'ready'
      ? new Map(playersState.data.map((player) => [player.id, player] as const))
      : new Map<PlayerId, Player>();
  const nameById = new Map([...playerById].map(([id, player]) => [id, player.name] as const));
  const taskNameById =
    tasksState.status === 'ready'
      ? new Map(tasksState.data.map((task) => [task.id, task.name] as const))
      : new Map<TaskId, LocalizedText>();
  const nameOf = (id: PlayerId): string => nameById.get(id) ?? '?';
  const taskOf = (id: TaskId): string => {
    const name = taskNameById.get(id);
    return name ? localize(name, locale) : '';
  };
  // Why accepting this invite can't work right now, or null when it can.
  const blockedReason = (initiatorId: PlayerId): string | null => {
    const initiator = playerById.get(initiatorId);
    const check = canJoinPairPick(initiator ? [initiator, myPlayer] : [myPlayer], settings);
    return check.ok ? null : t(taskErrorKey(check.error));
  };

  return (
    <div className="mb-3 flex flex-col gap-2">
      {outgoing.map((claim) => (
        <div key={claim.id} className={CARD}>
          <Chip tone="accent">{t('todayPick.chip')}</Chip>
          <p className="mt-2 text-sm text-content">
            {t('todayPick.youInvited', {
              name: claim.invitee !== null ? nameOf(claim.invitee) : '',
              task: taskOf(claim.taskId),
            })}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-sm text-content-muted">{t('todayPick.waiting')}</span>
            <CancelButton taskId={claim.taskId} day={turnus.currentDay} turnusId={turnus.id} />
          </div>
        </div>
      ))}
      {incoming.map((claim) => (
        <IncomingCard
          key={claim.id}
          taskId={claim.taskId}
          inviterName={nameOf(claim.playerId)}
          taskName={taskOf(claim.taskId)}
          blockedReason={blockedReason(claim.playerId)}
          myPlayerId={myPlayer.id}
          day={turnus.currentDay}
          turnusId={turnus.id}
        />
      ))}
    </div>
  );
}

function CancelButton({
  taskId,
  day,
  turnusId,
}: {
  taskId: string;
  day: number;
  turnusId: string;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="danger"
      disabled={busy}
      onClick={() => {
        if (busy) return;
        setBusy(true);
        void declinePairPick(db, turnusId, taskId, day).finally(() => setBusy(false));
      }}
    >
      {t('pair.cancelInvite')}
    </Button>
  );
}

function IncomingCard({
  taskId,
  inviterName,
  taskName,
  blockedReason,
  myPlayerId,
  day,
  turnusId,
}: {
  taskId: string;
  inviterName: string;
  taskName: string;
  /** Set when accepting can't work right now — shown instead of a Confirm that would fail. */
  blockedReason: string | null;
  myPlayerId: PlayerId;
  day: number;
  turnusId: string;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const act = async (accept: boolean): Promise<void> => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result: Result<void, DomainError> = accept
        ? await acceptPairPick(db, turnusId, taskId, myPlayerId)
        : await declinePairPick(db, turnusId, taskId, day);
      if (!result.ok) setError(t(taskErrorKey(result.error)));
    } catch {
      setError(t('common.somethingWrong'));
    }
    setBusy(false);
  };

  return (
    <div className={CARD}>
      <Chip tone="accent">{t('todayPick.chip')}</Chip>
      <p className="mt-2 text-sm text-content">
        {t('todayPick.invited', { name: inviterName, task: taskName })}
      </p>
      {blockedReason !== null && <p className="mt-1 text-sm text-content-muted">{blockedReason}</p>}
      <div className="mt-3 flex items-center justify-end gap-2">
        <Button variant="secondary" disabled={busy} onClick={() => void act(false)}>
          {t('pair.decline')}
        </Button>
        <Button disabled={busy || blockedReason !== null} onClick={() => void act(true)}>
          {t('pair.accept')}
        </Button>
      </div>
      <FormError message={error} className="mt-2" />
    </div>
  );
}
