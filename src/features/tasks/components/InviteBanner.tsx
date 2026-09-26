import { useState } from 'react';

import { db } from '../../../data/firebase';
import { cancelReservation } from '../../../data/transactions/cancelReservation';
import { respondToInvite } from '../../../data/transactions/respondToInvite';
import type { PlayerId, TaskId } from '../../../domain/ids';
import type { Reservation } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { Button } from '../../../ui/Button';
import {
  useCatalogTasks,
  useMyInvites,
  useMyPlayer,
  useMyReservation,
  usePlayers,
  useSession,
} from '../../session';
import { useDismissedInvites } from '../useDismissedInvites';

import { PairInviteCard } from './PairInviteCard';

/** A card's identity for dismissal: the reservation, the invited partner and the answer. */
function cardKey(reservation: Reservation, inviteeId: PlayerId | undefined): string {
  const answer = inviteeId !== undefined ? reservation.responses[inviteeId] : undefined;
  return [reservation.day, reservation.taskId, reservation.playerId, inviteeId, answer ?? ''].join(
    '_',
  );
}

/**
 * Pair invites for the next round follow the player across every screen (spec 7), as cards: the
 * initiator's own pair and every invite aimed at this player. Both sides see who invites whom to
 * what and the task's description. The inviter can cancel the pair for both; the invited player
 * accepts or declines, and once they accept, can still cancel it for both. An answered card stays
 * until its ✕ hides it. Names and descriptions come from the roster and catalog (the reservation
 * stores only ids and the task name).
 */
export function InviteBanner() {
  const { turnus } = useSession();
  const myPlayer = useMyPlayer();
  const invitesState = useMyInvites();
  const mineState = useMyReservation();
  const playersState = usePlayers();
  const tasksState = useCatalogTasks();
  const { locale } = useTranslation();
  const { isDismissed, dismiss } = useDismissedInvites('kwest.invites.dismissed');

  if (turnus === null || myPlayer === null) return null;
  const invites = invitesState.status === 'ready' ? invitesState.data : [];
  const mine = mineState.status === 'ready' ? mineState.data : null;
  const myGroup = mine !== null && mine.invitees.length > 0 ? mine : null;

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

  const myGroupKey = myGroup !== null ? cardKey(myGroup, myGroup.invitees[0]) : null;
  const inviteKeys = invites.map((invite) => cardKey(invite, myPlayer.id));
  const liveKeys = [...(myGroupKey !== null ? [myGroupKey] : []), ...inviteKeys];
  const showMyGroup = myGroup !== null && myGroupKey !== null && !isDismissed(myGroupKey);
  const shownInvites = invites.filter((_, index) => !isDismissed(inviteKeys[index] ?? ''));
  if (!showMyGroup && shownInvites.length === 0) return null;

  return (
    <div className="mb-3 flex flex-col gap-2">
      {showMyGroup && (
        <InitiatorCard
          reservation={myGroup}
          description={descOf(myGroup.taskId)}
          nameOf={nameOf}
          turnusId={turnus.id}
          onDismiss={() => dismiss(myGroupKey, liveKeys)}
        />
      )}
      {shownInvites.map((invite) => (
        <InviteCard
          key={invite.playerId}
          invite={invite}
          inviterName={nameOf(invite.playerId)}
          description={descOf(invite.taskId)}
          myPlayerId={myPlayer.id}
          leaveInviterIds={acceptedInviterIds}
          turnusId={turnus.id}
          onDismiss={() => dismiss(cardKey(invite, myPlayer.id), liveKeys)}
        />
      ))}
    </div>
  );
}

/** The inviter's own pair: the partner's answer on the left, cancel-for-both on the right. */
function InitiatorCard({
  reservation,
  description,
  nameOf,
  turnusId,
  onDismiss,
}: {
  reservation: Reservation;
  description: string;
  nameOf: (id: PlayerId) => string;
  turnusId: string;
  onDismiss: () => void;
}) {
  const { t, locale } = useTranslation();
  const [busy, setBusy] = useState(false);
  // A pair has a single invited partner; show their answer, the same badge the partner sees.
  const partner = reservation.invitees[0];
  const answer = partner !== undefined ? reservation.responses[partner] : undefined;

  return (
    <PairInviteCard
      kind="reservation"
      text={t('pair.youInvited', {
        names: reservation.invitees.map(nameOf).join(', '),
        task: localize(reservation.taskName, locale),
      })}
      description={description}
      answer={answer}
      {...(answer !== undefined ? { onDismiss } : {})}
      actions={
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
      }
    />
  );
}

/**
 * An invite to this player: Decline and Accept while it waits. An acceptance swaps them for a
 * cancel-for-both, since the pair has formed; a refusal leaves just the answer.
 */
function InviteCard({
  invite,
  inviterName,
  description,
  myPlayerId,
  leaveInviterIds,
  turnusId,
  onDismiss,
}: {
  invite: Reservation;
  inviterName: string;
  description: string;
  myPlayerId: PlayerId;
  /** Initiators of every other pair this player accepted — accepting cancels those (spec 7). */
  leaveInviterIds: readonly PlayerId[];
  turnusId: string;
  onDismiss: () => void;
}) {
  const { t, locale } = useTranslation();
  const [busy, setBusy] = useState(false);
  const myAnswer = invite.responses[myPlayerId];

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

  const actions =
    myAnswer === 'accepted' ? (
      <Button
        variant="danger"
        disabled={busy}
        onClick={() => act(() => cancelReservation(db, turnusId, invite.playerId, myPlayerId))}
      >
        {t('pair.cancelInvite')}
      </Button>
    ) : myAnswer === undefined ? (
      <div className="flex gap-2">
        <Button variant="secondary" disabled={busy} onClick={() => respond(false)}>
          {t('pair.decline')}
        </Button>
        <Button disabled={busy} onClick={() => respond(true)}>
          {t('pair.accept')}
        </Button>
      </div>
    ) : null;

  return (
    <PairInviteCard
      kind="reservation"
      text={t('pair.invitedBy', { name: inviterName, task: localize(invite.taskName, locale) })}
      description={description}
      answer={myAnswer}
      {...(myAnswer !== undefined ? { onDismiss } : {})}
      actions={actions}
    />
  );
}
