import { useState } from 'react';

import { db } from '../../../data/firebase';
import { respondToPairInvite } from '../../../data/transactions/respondToPairInvite';
import { isPendingPairInvite } from '../../../domain/reservation';
import type { Reservation } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { Button } from '../../../ui/Button';
import { useMyPairInvites, useMyPlayer, usePlayers, useSession } from '../../session';

/**
 * A pending pair invite follows the player across every screen (spec 9.1) — mounted in the
 * app shell, pinned under the nav. The invited partner accepts or declines right here; there
 * is nothing to look up. It resolves the inviter's name from the roster (the reservation only
 * stores ids) and quietly renders nothing until an invite arrives.
 */
export function PairInviteBanner() {
  const { turnus } = useSession();
  const myPlayer = useMyPlayer();
  const invitesState = useMyPairInvites();
  const playersState = usePlayers();

  if (turnus === null || myPlayer === null || invitesState.status !== 'ready') return null;
  const invites = invitesState.data.filter((invite) => isPendingPairInvite(invite, myPlayer.id));
  if (invites.length === 0) return null;

  const nameById =
    playersState.status === 'ready'
      ? new Map(playersState.data.map((player) => [player.id, player.name] as const))
      : new Map<string, string>();

  return (
    <div className="flex flex-col divide-y divide-accent/20 border-b border-border bg-accent/10">
      {invites.map((invite) => (
        <PairInviteRow
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

function PairInviteRow({
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

  const respond = async (accept: boolean): Promise<void> => {
    if (busy) return;
    setBusy(true);
    await respondToPairInvite(db, turnusId, invite.playerId, myPlayerId, accept);
    setBusy(false);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <p className="min-w-0 flex-1 text-sm text-content">
        {t('pair.invitedBy', { name: inviterName, task: localize(invite.taskName, locale) })}
      </p>
      <Button
        variant="ghost"
        className="shrink-0 px-2 py-1"
        disabled={busy}
        onClick={() => void respond(false)}
      >
        {t('pair.decline')}
      </Button>
      <Button className="shrink-0 px-3 py-1" disabled={busy} onClick={() => void respond(true)}>
        {t('pair.accept')}
      </Button>
    </div>
  );
}
