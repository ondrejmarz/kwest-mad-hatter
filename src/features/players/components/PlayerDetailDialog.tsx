import { type FormEvent, useState } from 'react';

import { db } from '../../../data/firebase';
import { claimPlayer } from '../../../data/transactions/claimPlayer';
import { unclaimPlayer } from '../../../data/transactions/unclaimPlayer';
import type { Player } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { Button } from '../../../ui/Button';
import { CardLayout } from '../../../ui/CardLayout';
import { CoinAmount } from '../../../ui/CoinAmount';
import { Dialog } from '../../../ui/Dialog';
import { FormError } from '../../../ui/FormError';
import { TextInput } from '../../../ui/TextInput';
import { usePurchases, useSession } from '../../session';

import { PlayerChips } from './PlayerChips';
import { selectPlayerFacts } from './PlayerFacts';

/**
 * Player detail (spec 9.1). The card header (name, status chips, coins) identifies the player; the
 * task/reward/punishment facts already sit on the roster row, so they are not repeated here. On the
 * player's OWN card it points to the Profil tab (where the private stats, history and secret plans
 * live now) and offers to release the character. A foreign card is just a claim: enter its 4-digit
 * PIN — the same whether it is the first claim or moving the character to this device.
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
  const { t } = useTranslation();
  const { uid } = useSession();
  const mine = uid !== null && player.ownerUids.includes(uid);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const purchasesState = usePurchases();
  // Won rewards and incoming punishments are public — shown for every player, split the same way as
  // the roster row so a row and its detail agree (`selectPlayerFacts`).
  const { won, targetedBy } =
    purchasesState.status === 'ready'
      ? selectPlayerFacts(purchasesState.data, player.id)
      : { won: [], targetedBy: [] };

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

  const unlink = async (): Promise<void> => {
    if (uid === null || busy) return;
    setBusy(true);
    setError(null);
    const result = await unclaimPlayer(db, turnusId, player.id, uid);
    setBusy(false);
    if (result.ok) onClose();
    else setError(t('entry.offline'));
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
        topRight={<CoinAmount amount={player.coins} />}
        chips={chips}
      />

      {mine ? (
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
          <p className="text-sm text-content-muted">{t('players.detailsOnProfile')}</p>
          <FormError message={error} />
          <Button variant="secondary" disabled={busy} onClick={() => void unlink()}>
            {t('players.unlink')}
          </Button>
        </div>
      ) : (
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
