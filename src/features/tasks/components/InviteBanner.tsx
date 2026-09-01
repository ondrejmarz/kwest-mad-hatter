import { useState } from 'react';

import { db } from '../../../data/firebase';
import { cancelReservation } from '../../../data/transactions/cancelReservation';
import { respondToInvite } from '../../../data/transactions/respondToInvite';
import type { PlayerId } from '../../../domain/ids';
import { reservationTally } from '../../../domain/reservation';
import type { Reservation } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { Button } from '../../../ui/Button';
import { Chip } from '../../../ui/Chip';
import { useMyInvites, useMyPlayer, useMyReservation, usePlayers, useSession } from '../../session';

const CARD = 'rounded-2xl border border-border bg-surface-raised p-4';

/**
 * Group invites follow the player across every screen (spec 7), styled as cards so they sit with
 * the rest of the app. The initiator sees their own group with a running "confirmed" tally and a
 * Cancel that drops the invite for everyone; each invited player sees a Confirm/Decline toggle they
 * can flip until the day is evaluated. Renders nothing when there is no group in play. Names come
 * from the roster (the reservation stores only ids).
 */
export function InviteBanner() {
  const { turnus } = useSession();
  const myPlayer = useMyPlayer();
  const invitesState = useMyInvites();
  const mineState = useMyReservation();
  const playersState = usePlayers();

  if (turnus === null || myPlayer === null) return null;
  // A group leaves the banner once every invitee has answered — the negotiation is settled and the
  // accepted members compete for the task at day evaluation (spec 6/7). Only open groups show here.
  const invites = (invitesState.status === 'ready' ? invitesState.data : []).filter(
    (invite) => reservationTally(invite).pending > 0,
  );
  const mine = mineState.status === 'ready' ? mineState.data : null;
  const myGroup =
    mine !== null && mine.invitees.length > 0 && reservationTally(mine).pending > 0 ? mine : null;
  if (invites.length === 0 && myGroup === null) return null;

  const nameById =
    playersState.status === 'ready'
      ? new Map(playersState.data.map((player) => [player.id, player.name] as const))
      : new Map<PlayerId, string>();

  return (
    <div className="mb-3 flex flex-col gap-2">
      {myGroup !== null && <InitiatorCard reservation={myGroup} turnusId={turnus.id} />}
      {invites.map((invite) => (
        <InviteCard
          key={invite.playerId}
          invite={invite}
          inviterName={nameById.get(invite.playerId) ?? '?'}
          myPlayerId={myPlayer.id}
          turnusId={turnus.id}
        />
      ))}
    </div>
  );
}

/** The player's own group: how many have confirmed, and a cancel-for-everyone. */
function InitiatorCard({ reservation, turnusId }: { reservation: Reservation; turnusId: string }) {
  const { t, locale } = useTranslation();
  const [busy, setBusy] = useState(false);
  const tally = reservationTally(reservation);

  return (
    <div className={CARD}>
      <Chip tone="accent">{t('pair.groupChip')}</Chip>
      <p className="mt-2 text-sm text-content">
        {t('pair.youInvited', { task: localize(reservation.taskName, locale) })}
      </p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-content-muted">
          {t('pair.confirmedTally', {
            accepted: tally.accepted + 1,
            total: reservation.invitees.length + 1,
          })}
        </span>
        <Button
          variant="danger"
          disabled={busy}
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

/** An invite to this player: a Confirm/Decline toggle (the current answer stays highlighted). */
function InviteCard({
  invite,
  inviterName,
  myPlayerId,
  turnusId,
}: {
  invite: Reservation;
  inviterName: string;
  myPlayerId: PlayerId;
  turnusId: string;
}) {
  const { t, locale } = useTranslation();
  const [busy, setBusy] = useState(false);
  const myAnswer = invite.responses[myPlayerId];
  const tally = reservationTally(invite);

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
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-content-muted">
          {t('pair.tally', {
            accepted: tally.accepted + 1,
            total: invite.invitees.length + 1,
            declined: tally.declined,
          })}
        </span>
        <div className="flex gap-2">
          {/* The current answer stays highlighted AND disabled — it is already chosen; tap the
              other to switch. */}
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
