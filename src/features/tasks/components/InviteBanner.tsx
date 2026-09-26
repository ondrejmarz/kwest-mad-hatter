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
 * cross pops in and a ✕ appears to tuck the settled card away. A pair is done together or not at
 * all, so once it has formed EITHER member can still cancel it for both. Names and descriptions come
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
  // Every pair this player has already accepted — accepting a new one cancels them (for both of their
  // members), so the player never ends up committed to two pairs at once (spec 7). The initiator id
  // is the doc id.
  const acceptedInviterIds = invites
    .filter((invite) => invite.responses[myPlayer.id] === 'accepted')
    .map((invite) => invite.playerId);

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
          leaveInviterIds={acceptedInviterIds}
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

/** The inviter's own pair: the partner's answer on the left (like the invitee sees), cancel right. */
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
  // A pair has a single invited partner; show their answer, the same badge the partner sees.
  const partner = reservation.invitees[0];
  const answer = partner !== undefined ? reservation.responses[partner] : undefined;
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
        <ResultBadge answer={answer} />
        <Button
          variant="danger"
          disabled={busy}
          onClick={() => {
            if (busy) return;
            setBusy(true);
            void cancelReservation(
              db,
              turnusId,
              reservation.playerId,
              reservation.playerId,
            ).finally(() => setBusy(false));
          }}
        >
          {t('pair.cancelInvite')}
        </Button>
      </div>
    </div>
  );
}

/**
 * An invite to this player: their answer on the left, a Confirm/Decline on the right. A refusal
 * locks the card; an acceptance swaps the buttons for a cancel-for-both, since the pair has formed.
 */
function InviteCard({
  invite,
  inviterName,
  description,
  myPlayerId,
  leaveInviterIds,
  turnusId,
}: {
  invite: Reservation;
  inviterName: string;
  description: string;
  myPlayerId: PlayerId;
  /** Initiators of every other pair this player accepted — accepting cancels those (spec 7). */
  leaveInviterIds: readonly PlayerId[];
  turnusId: string;
}) {
  const { t, locale } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const myAnswer = invite.responses[myPlayerId];
  const answered = myAnswer !== undefined;
  if (dismissed) return null;

  const act = (action: () => Promise<unknown>): void => {
    if (busy) return;
    setBusy(true);
    void action().finally(() => setBusy(false));
  };
  const respond = (accept: boolean): void =>
    act(() =>
      respondToInvite(
        db,
        turnusId,
        invite.playerId,
        myPlayerId,
        accept,
        accept ? leaveInviterIds : [],
      ),
    );

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
        {myAnswer === 'accepted' ? (
          <Button
            variant="danger"
            disabled={busy}
            onClick={() => act(() => cancelReservation(db, turnusId, invite.playerId, myPlayerId))}
          >
            {t('pair.cancelInvite')}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant={myAnswer === 'declined' ? 'danger' : 'secondary'}
              disabled={busy || answered}
              onClick={() => respond(false)}
            >
              {t('pair.decline')}
            </Button>
            <Button variant="secondary" disabled={busy || answered} onClick={() => respond(true)}>
              {t('pair.accept')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
