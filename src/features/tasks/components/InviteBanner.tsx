import { useState } from 'react';

import { db } from '../../../data/firebase';
import { cancelReservation } from '../../../data/transactions/cancelReservation';
import { respondToInvite } from '../../../data/transactions/respondToInvite';
import type { PlayerId, TaskId } from '../../../domain/ids';
import type { Reservation, ReservationResponse } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { Button } from '../../../ui/Button';
import { Chip } from '../../../ui/Chip';
import {
  useCatalogTasks,
  useMyInvites,
  useMyPlayer,
  useMyReservation,
  usePlayers,
  useSession,
} from '../../session';

const CARD = 'rounded-2xl border border-border bg-surface-raised p-4';

/**
 * Group invites follow the player across every screen (spec 7), styled as cards so they sit with
 * the rest of the app. Both sides see the same "Pozvánka" chip and the task's description; the
 * inviter sees each partner's answer and a Cancel that drops the invite for everyone, and each
 * invited player sees a Confirm/Decline toggle they can flip until evaluation. The check or cross
 * pops in the moment an answer lands, so both know how it turned out. Names and descriptions come
 * from the roster and catalog (the reservation stores only ids and the task name).
 */
export function InviteBanner() {
  const { turnus } = useSession();
  const myPlayer = useMyPlayer();
  const invitesState = useMyInvites();
  const mineState = useMyReservation();
  const playersState = usePlayers();
  const tasksState = useCatalogTasks();
  const { locale } = useTranslation();

  if (turnus === null || myPlayer === null) return null;
  const invites = invitesState.status === 'ready' ? invitesState.data : [];
  const mine = mineState.status === 'ready' ? mineState.data : null;
  const myGroup = mine !== null && mine.invitees.length > 0 ? mine : null;
  if (invites.length === 0 && myGroup === null) return null;

  const nameById =
    playersState.status === 'ready'
      ? new Map(playersState.data.map((player) => [player.id, player.name] as const))
      : new Map<PlayerId, string>();
  const descById =
    tasksState.status === 'ready'
      ? new Map(
          tasksState.data.map((task) => [task.id, localize(task.description, locale)] as const),
        )
      : new Map<TaskId, string>();
  const nameOf = (id: PlayerId): string => nameById.get(id) ?? '?';
  const descOf = (id: TaskId): string => descById.get(id) ?? '';

  return (
    <div className="mb-3 flex flex-col gap-2">
      {myGroup !== null && (
        <InitiatorCard
          reservation={myGroup}
          description={descOf(myGroup.taskId)}
          nameOf={nameOf}
          turnusId={turnus.id}
        />
      )}
      {invites.map((invite) => (
        <InviteCard
          key={invite.playerId}
          invite={invite}
          inviterName={nameOf(invite.playerId)}
          description={descOf(invite.taskId)}
          myPlayerId={myPlayer.id}
          turnusId={turnus.id}
        />
      ))}
    </div>
  );
}

/** The animated outcome of one answer: a green check, a red cross, or a muted "waiting". */
function ResultBadge({ answer }: { answer: ReservationResponse | undefined }) {
  const { t } = useTranslation();
  if (answer === 'accepted') {
    return (
      <span
        key="accepted"
        className="result-pop inline-flex items-center gap-1 text-sm text-success"
      >
        <span aria-hidden>✓</span>
        {t('pair.acceptedResult')}
      </span>
    );
  }
  if (answer === 'declined') {
    return (
      <span
        key="declined"
        className="result-pop inline-flex items-center gap-1 text-sm text-danger"
      >
        <span aria-hidden>✗</span>
        {t('pair.declinedResult')}
      </span>
    );
  }
  return <span className="text-sm text-content-muted">{t('pair.pending')}</span>;
}

/** The player's own group: each partner's answer, and a cancel-for-everyone. */
function InitiatorCard({
  reservation,
  description,
  nameOf,
  turnusId,
}: {
  reservation: Reservation;
  description: string;
  nameOf: (id: PlayerId) => string;
  turnusId: string;
}) {
  const { t, locale } = useTranslation();
  const [busy, setBusy] = useState(false);
  const names = reservation.invitees.map(nameOf).join(', ');

  return (
    <div className={CARD}>
      <Chip tone="accent">{t('pair.inviteChip')}</Chip>
      <p className="mt-2 text-sm text-content">
        {t('pair.youInvited', { names, task: localize(reservation.taskName, locale) })}
      </p>
      {description !== '' && <p className="mt-1 text-sm text-content-muted">{description}</p>}
      <div className="mt-3 flex flex-col gap-1">
        {reservation.invitees.map((id) => (
          <div key={id} className="flex items-center justify-between gap-2">
            <span className="text-sm text-content">{nameOf(id)}</span>
            <ResultBadge answer={reservation.responses[id]} />
          </div>
        ))}
      </div>
      <Button
        variant="danger"
        className="mt-3"
        disabled={busy}
        onClick={() => {
          if (busy) return;
          setBusy(true);
          void cancelReservation(db, turnusId, reservation.playerId).finally(() => setBusy(false));
        }}
      >
        {t('pair.cancelInvite')}
      </Button>
    </div>
  );
}

/** An invite to this player: a Confirm/Decline toggle plus the popping result of their answer. */
function InviteCard({
  invite,
  inviterName,
  description,
  myPlayerId,
  turnusId,
}: {
  invite: Reservation;
  inviterName: string;
  description: string;
  myPlayerId: PlayerId;
  turnusId: string;
}) {
  const { t, locale } = useTranslation();
  const [busy, setBusy] = useState(false);
  const myAnswer = invite.responses[myPlayerId];

  const respond = (accept: boolean): void => {
    if (busy) return;
    setBusy(true);
    void respondToInvite(db, turnusId, invite.playerId, myPlayerId, accept).finally(() =>
      setBusy(false),
    );
  };

  return (
    <div className={CARD}>
      <Chip tone="accent">{t('pair.inviteChip')}</Chip>
      <p className="mt-2 text-sm text-content">
        {t('pair.invitedBy', { name: inviterName, task: localize(invite.taskName, locale) })}
      </p>
      {description !== '' && <p className="mt-1 text-sm text-content-muted">{description}</p>}
      <div className="mt-3 flex items-center justify-between gap-2">
        <ResultBadge answer={myAnswer} />
        <div className="flex gap-2">
          {/* The chosen answer stays highlighted and disabled — tap the other to switch. */}
          <Button
            variant={myAnswer === 'declined' ? 'danger' : 'secondary'}
            disabled={busy || myAnswer === 'declined'}
            onClick={() => respond(false)}
          >
            {t('pair.decline')}
          </Button>
          <Button
            variant={myAnswer === 'accepted' ? 'primary' : 'secondary'}
            disabled={busy || myAnswer === 'accepted'}
            onClick={() => respond(true)}
          >
            {t('pair.accept')}
          </Button>
        </div>
      </div>
    </div>
  );
}
