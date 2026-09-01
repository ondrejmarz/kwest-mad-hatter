import { useState } from 'react';

import { db } from '../../../data/firebase';
import { acceptPairPick } from '../../../data/transactions/acceptPairPick';
import { declinePairPick } from '../../../data/transactions/declinePairPick';
import type { PlayerId, TaskId } from '../../../domain/ids';
import type { LocalizedText } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { Button } from '../../../ui/Button';
import { Chip } from '../../../ui/Chip';
import { useCatalogTasks, useMyPlayer, usePlayers, useTaskClaims, useTurnus } from '../../session';

const CARD = 'rounded-2xl border border-border bg-surface-raised p-4';

/**
 * Same-day pair picks that are still pending (spec 7): the initiator sees a "waiting for {partner}"
 * card with a cancel, and the invited partner sees a Confirm/Decline. On confirm both members get
 * the task for today at once. Mirrors the reservation `InviteBanner`, but for today's claims. Names
 * and task titles come from the roster and catalog (the claim stores only ids).
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

  const nameById =
    playersState.status === 'ready'
      ? new Map(playersState.data.map((player) => [player.id, player.name] as const))
      : new Map<PlayerId, string>();
  const taskNameById =
    tasksState.status === 'ready'
      ? new Map(tasksState.data.map((task) => [task.id, task.name] as const))
      : new Map<TaskId, LocalizedText>();
  const nameOf = (id: PlayerId): string => nameById.get(id) ?? '?';
  const taskOf = (id: TaskId): string => {
    const name = taskNameById.get(id);
    return name ? localize(name, locale) : '';
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
  myPlayerId,
  day,
  turnusId,
}: {
  taskId: string;
  inviterName: string;
  taskName: string;
  myPlayerId: PlayerId;
  day: number;
  turnusId: string;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const act = (accept: boolean): void => {
    if (busy) return;
    setBusy(true);
    const run = accept
      ? acceptPairPick(db, turnusId, taskId, myPlayerId)
      : declinePairPick(db, turnusId, taskId, day);
    void run.finally(() => setBusy(false));
  };

  return (
    <div className={CARD}>
      <Chip tone="accent">{t('todayPick.chip')}</Chip>
      <p className="mt-2 text-sm text-content">
        {t('todayPick.invited', { name: inviterName, task: taskName })}
      </p>
      <div className="mt-3 flex items-center justify-end gap-2">
        <Button variant="secondary" disabled={busy} onClick={() => act(false)}>
          {t('pair.decline')}
        </Button>
        <Button disabled={busy} onClick={() => act(true)}>
          {t('pair.accept')}
        </Button>
      </div>
    </div>
  );
}
