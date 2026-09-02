import { type FormEvent, useState } from 'react';

import { db } from '../../../data/firebase';
import { claimPlayer } from '../../../data/transactions/claimPlayer';
import type { Player } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { Button } from '../../../ui/Button';
import { CardLayout } from '../../../ui/CardLayout';
import { Chip } from '../../../ui/Chip';
import { CoinAmount } from '../../../ui/CoinAmount';
import { Dialog } from '../../../ui/Dialog';
import { TextInput } from '../../../ui/TextInput';
import {
  useCatalogRewards,
  useMyBid,
  useMyInvites,
  useMyReservation,
  usePurchases,
  useSession,
} from '../../session';

import { PlayerFacts, selectPlayerFacts } from './PlayerFacts';

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
}: {
  player: Player;
  onClose: () => void;
  turnusId: string;
}) {
  const { t, locale } = useTranslation();
  const { uid } = useSession();
  const mine = uid !== null && player.ownerUids.includes(uid);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // The reservation and bid are secret — these listeners hold *this device's* own, so they are only
  // meaningful (and only shown) on the player's own card.
  const reservationState = useMyReservation();
  const invitesState = useMyInvites();
  const bidState = useMyBid();
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
  const myBid = mine && bidState.status === 'ready' ? bidState.data : null;
  const bidReward =
    myBid !== null && rewardsState.status === 'ready'
      ? (rewardsState.data.find((reward) => reward.id === myBid.rewardId) ?? null)
      : null;

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

  const hasTask = player.activeTask !== null;
  const chips = (
    <>
      {mine && <Chip tone="accent">{t('players.you')}</Chip>}
      <Chip tone={hasTask ? 'muted' : 'warning'}>
        {hasTask ? t('players.hasTask') : t('players.needsPick')}
      </Chip>
      {won.length > 0 && <Chip tone="success">{t('players.hasReward')}</Chip>}
      {targetedBy.length > 0 && <Chip tone="danger">{t('players.isTargeted')}</Chip>}
    </>
  );

  const label = (text: string) => (
    <p className="text-xs font-semibold uppercase text-content-muted">{text}</p>
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
            {label(t('players.myReservation'))}
            <p className="mt-1 text-content">
              {myReservation !== null
                ? localize(myReservation.taskName, locale)
                : t('players.noReservation')}
            </p>
          </div>
          {myBid !== null && (
            <div>
              {label(t('players.myBid'))}
              <p className="mt-1 flex items-center gap-2 text-content">
                {bidReward !== null && <span>{localize(bidReward.name, locale)}</span>}
                <CoinAmount amount={myBid.amount} />
              </p>
            </div>
          )}
        </div>
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
          {error !== null && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={busy || !/^\d{4}$/.test(pin)}>
            {t('players.claimConfirm')}
          </Button>
        </form>
      )}
    </Dialog>
  );
}
