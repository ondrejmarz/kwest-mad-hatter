import { type FormEvent, useEffect, useState } from 'react';

import { db } from '../../../data/firebase';
import { subscribePlayerLedger } from '../../../data/repositories/ledger';
import type { LedgerEntryDoc } from '../../../data/schemas/ledger';
import type { Subscription } from '../../../data/subscriptions';
import { claimPlayer } from '../../../data/transactions/claimPlayer';
import type { Player } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { Button } from '../../../ui/Button';
import { CardLayout } from '../../../ui/CardLayout';
import { CoinAmount } from '../../../ui/CoinAmount';
import { Dialog } from '../../../ui/Dialog';
import { FormError } from '../../../ui/FormError';
import { SectionLabel } from '../../../ui/SectionLabel';
import { TextInput } from '../../../ui/TextInput';
import {
  useCatalogRewards,
  useMyBids,
  useMyInvites,
  useMyReservation,
  usePurchases,
  useSession,
} from '../../session';

import { PlayerChips } from './PlayerChips';
import { PlayerFacts, selectPlayerFacts } from './PlayerFacts';
import { PlayerLedgerView } from './PlayerLedgerView';

/**
 * Player detail (spec 9.1). For every player it surfaces the useful public facts — coins and the
 * current task. On the player's own card it also shows their secret plans (tomorrow's reservation
 * and any reward bid), which only they can read. A foreign character is claimed by entering its
 * 4-digit PIN — the same whether it is the first claim or moving the character to this device.
 */
export function PlayerDetailDialog({
  player,
  onClose,
  turnusId,
  hasReservation,
}: {
  player: Player;
  onClose: () => void;
  turnusId: string;
  hasReservation: boolean;
}) {
  const { t, locale } = useTranslation();
  const { uid } = useSession();
  const mine = uid !== null && player.ownerUids.includes(uid);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // The coin history is private to the owner (and admins); only subscribe on the own card.
  const [ledger, setLedger] = useState<Subscription<readonly LedgerEntryDoc[]>>({
    status: 'loading',
  });
  useEffect(() => {
    if (!mine) return;
    return subscribePlayerLedger(db, turnusId, player.id, setLedger);
  }, [mine, turnusId, player.id]);

  // The reservation and bid are secret — these listeners hold *this device's* own, so they are only
  // meaningful (and only shown) on the player's own card.
  const reservationState = useMyReservation();
  const invitesState = useMyInvites();
  const bidsState = useMyBids();
  const rewardsState = useCatalogRewards();
  const purchasesState = usePurchases();
  // Won rewards and incoming punishments are public — shown for every player, split the same way as
  // the roster row so a row and its detail agree (`selectPlayerFacts`).
  const { won, targetedBy } =
    purchasesState.status === 'ready'
      ? selectPlayerFacts(purchasesState.data, player.id)
      : { won: [], targetedBy: [] };
  const ownReservation = mine && reservationState.status === 'ready' ? reservationState.data : null;
  // On the invitee's own card a pair/group they accepted counts as their reservation too, so both
  // members see it (spec 7).
  const acceptedInvite =
    mine && invitesState.status === 'ready'
      ? (invitesState.data.find((invite) => invite.responses[player.id] === 'accepted') ?? null)
      : null;
  const myReservation = ownReservation ?? acceptedInvite;
  // A player may hold several sealed bids at once — show each with its reward name (spec 8).
  const myBids = mine && bidsState.status === 'ready' ? bidsState.data : [];
  const rewardName = (rewardId: string): string | null => {
    if (rewardsState.status !== 'ready') return null;
    const reward = rewardsState.data.find((candidate) => candidate.id === rewardId);
    return reward !== undefined ? localize(reward.name, locale) : null;
  };

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (uid === null || busy || !/^\d{4}$/.test(pin)) return;
    setBusy(true);
    setError(null);
    const result = await claimPlayer(db, turnusId, player.id, uid, pin);
    setBusy(false);
    if (result.ok) onClose();
    else if (result.error.code === 'REQUIRES_ONLINE') setError(t('entry.offline'));
    else setError(t('players.wrongPin'));
  };

  const chips = (
    <PlayerChips
      player={player}
      mine={mine}
      won={won}
      targetedBy={targetedBy}
      hasReservation={hasReservation}
    />
  );

  return (
    <Dialog open onClose={onClose} ariaLabel={player.name}>
      <CardLayout
        title={player.name}
        chips={chips}
        footerRight={<CoinAmount amount={player.coins} />}
      />

      <PlayerFacts player={player} won={won} targetedBy={targetedBy} />

      {mine && (
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
          <div>
            <SectionLabel>{t('players.myReservation')}</SectionLabel>
            <p className="mt-1 text-content">
              {myReservation !== null
                ? localize(myReservation.taskName, locale)
                : t('players.noReservation')}
            </p>
          </div>
          {myBids.length > 0 && (
            <div>
              <SectionLabel>{t('players.myBid')}</SectionLabel>
              <div className="mt-1 flex flex-col gap-1">
                {myBids.map((bid) => {
                  const name = rewardName(bid.rewardId);
                  return (
                    <p key={bid.rewardId} className="flex items-center gap-2 text-content">
                      {name !== null && <span>{name}</span>}
                      <CoinAmount amount={bid.amount} />
                    </p>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {mine && ledger.status === 'ready' && (
        <PlayerLedgerView player={player} entries={ledger.data} />
      )}

      {!mine && (
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
          <p className="text-sm text-content-muted">
            {t('players.claimHint', { name: player.name })}
          </p>
          <TextInput
            label={t('players.pinLabel')}
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            inputMode="numeric"
            maxLength={4}
            autoComplete="off"
            autoFocus
          />
          <FormError message={error} />
          <Button type="submit" disabled={busy || !/^\d{4}$/.test(pin)}>
            {t('players.claimConfirm')}
          </Button>
        </form>
      )}
    </Dialog>
  );
}
