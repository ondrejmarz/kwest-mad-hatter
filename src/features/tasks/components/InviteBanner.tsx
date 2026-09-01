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
 * Pair invites follow the player across every screen (spec 7), styled as cards so they sit with the
 * rest of the app. Both sides see the same "Pozvánka" chip, the task's description, and the same
 * bottom row — a name-and-status on the left, the action on the right. The inviter offers a
 * cancel-for-both, the invited player a Confirm/Decline. Once the partner answers, the check or
 * cross pops in, both cards lock, and a ✕ appears to tuck the settled card away. Names and
 * descriptions come from the roster and catalog (the reservation stores only ids and the task name).
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

/** A ✕ in the card's top-right that tucks a settled invite away (until it is loaded afresh). */
function DismissButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      aria-label={t('common.close')}
      onClick={onClick}
      className="-mr-1 -mt-1 shrink-0 rounded-lg px-2 text-lg leading-none text-content-muted"
    >
      ✕
    </button>
  );
}

/** The inviter's own pair: the partner's name and answer on the left, cancel-for-both on the right. */
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
  const [dismissed, setDismissed] = useState(false);
  const answered = reservation.invitees.every((id) => reservation.responses[id] !== undefined);
  if (dismissed) return null;

  return (
    <div className={CARD}>
      <div className="flex items-start justify-between gap-2">
        <Chip tone="accent">{t('pair.inviteChip')}</Chip>
        {answered && <DismissButton onClick={() => setDismissed(true)} />}
      </div>
      <p className="mt-2 text-sm text-content">
        {t('pair.youInvited', {
          names: reservation.invitees.map(nameOf).join(', '),
          task: localize(reservation.taskName, locale),
        })}
      </p>
      {description !== '' && <p className="mt-1 text-sm text-content-muted">{description}</p>}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          {reservation.invitees.map((id) => (
            <div key={id} className="flex items-center gap-2">
              <span className="text-sm text-content">{nameOf(id)}</span>
              <ResultBadge answer={reservation.responses[id]} />
            </div>
          ))}
        </div>
        <Button
          variant="danger"
          disabled={busy || answered}
          onClick={() => {
            if (busy) return;
            setBusy(true);
            void cancelReservation(db, turnusId, reservation.playerId).finally(() =>
              setBusy(false),
            );
          }}
        >
          {t('pair.cancelInvite')}
        </Button>
      </div>
    </div>
  );
}

/** An invite to this player: their answer on the left, a Confirm/Decline that locks once given. */
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
  const [dismissed, setDismissed] = useState(false);
  const myAnswer = invite.responses[myPlayerId];
  const answered = myAnswer !== undefined;
  if (dismissed) return null;

  const respond = (accept: boolean): void => {
    if (busy) return;
    setBusy(true);
    void respondToInvite(db, turnusId, invite.playerId, myPlayerId, accept).finally(() =>
      setBusy(false),
    );
  };

  return (
    <div className={CARD}>
      <div className="flex items-start justify-between gap-2">
        <Chip tone="accent">{t('pair.inviteChip')}</Chip>
        {answered && <DismissButton onClick={() => setDismissed(true)} />}
      </div>
      <p className="mt-2 text-sm text-content">
        {t('pair.invitedBy', { name: inviterName, task: localize(invite.taskName, locale) })}
      </p>
      {description !== '' && <p className="mt-1 text-sm text-content-muted">{description}</p>}
      <div className="mt-3 flex items-center justify-between gap-2">
        <ResultBadge answer={myAnswer} />
        <div className="flex gap-2">
          <Button
            variant={myAnswer === 'declined' ? 'danger' : 'secondary'}
            disabled={busy || answered}
            onClick={() => respond(false)}
          >
            {t('pair.decline')}
          </Button>
          <Button
            variant={myAnswer === 'accepted' ? 'primary' : 'secondary'}
            disabled={busy || answered}
            onClick={() => respond(true)}
          >
            {t('pair.accept')}
          </Button>
        </div>
      </div>
    </div>
  );
}
