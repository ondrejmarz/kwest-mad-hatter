import { useState } from 'react';

import { db } from '../../../data/firebase';
import { respondToInvite } from '../../../data/transactions/respondToInvite';
import { reservationTally } from '../../../domain/reservation';
import type { Reservation } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { Button } from '../../../ui/Button';
import { useMyInvites, useMyPlayer, usePlayers, useSession } from '../../session';

/**
 * Group invites follow the player across every screen (spec 7) — mounted in the app shell, pinned
 * under the nav. Each invite shows who invited them, the task, and a live accept/accepted/declined
 * counter; the answer is toggleable until the day is evaluated. Renders nothing until an invite
 * arrives. The inviter's name comes from the roster (the reservation stores only ids).
 */
export function InviteBanner() {
  const { turnus } = useSession();
  const myPlayer = useMyPlayer();
  const invitesState = useMyInvites();
  const playersState = usePlayers();

  if (turnus === null || myPlayer === null || invitesState.status !== 'ready') return null;
  const invites = invitesState.data;
  if (invites.length === 0) return null;

  const nameById =
    playersState.status === 'ready'
      ? new Map(playersState.data.map((player) => [player.id, player.name] as const))
      : new Map<string, string>();

  return (
    <div className="flex flex-col divide-y divide-accent/20 border-b border-border bg-accent/10">
      {invites.map((invite) => (
        <InviteRow
          key={invite.playerId}
          invite={invite}
          inviterName={nameById.get(invite.playerId) ?? '?'}
          turnusId={turnus.id}
          myPlayerId={myPlayer.id}
        />
      ))}
    </div>
  );
}

function InviteRow({
  invite,
  inviterName,
  turnusId,
  myPlayerId,
}: {
  invite: Reservation;
  inviterName: string;
  turnusId: string;
  myPlayerId: Reservation['playerId'];
}) {
  const { t, locale } = useTranslation();
  const [busy, setBusy] = useState(false);
  const myAnswer = invite.responses[myPlayerId];
  const tally = reservationTally(invite);

  const respond = async (accept: boolean): Promise<void> => {
    if (busy) return;
    setBusy(true);
    await respondToInvite(db, turnusId, invite.playerId, myPlayerId, accept);
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-1 px-4 py-2">
      <p className="text-sm text-content">
        {t('pair.invitedBy', { name: inviterName, task: localize(invite.taskName, locale) })}
      </p>
      <p className="text-xs text-content-muted">
        {t('pair.tally', {
          accepted: tally.accepted + 1,
          total: invite.invitees.length + 1,
          declined: tally.declined,
        })}
      </p>
      <div className="flex gap-2">
        <Button
          variant={myAnswer === 'declined' ? 'danger' : 'ghost'}
          className="shrink-0 px-2 py-1"
          disabled={busy}
          onClick={() => void respond(false)}
        >
          {t('pair.decline')}
        </Button>
        <Button
          variant={myAnswer === 'accepted' ? 'primary' : 'secondary'}
          className="shrink-0 px-3 py-1"
          disabled={busy}
          onClick={() => void respond(true)}
        >
          {t('pair.accept')}
        </Button>
      </div>
    </div>
  );
}
