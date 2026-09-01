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
import { useSession } from '../../session';

/**
 * Player detail (spec 9.1). A foreign character is claimed by entering its 4-digit PIN — the same
 * whether it is the first claim or moving the character to this device; claiming releases whatever
 * character this device held before (one device, one character).
 */
export function PlayerDetailDialog({
  player,
  onClose,
  turnusId,
  day,
}: {
  player: Player;
  onClose: () => void;
  turnusId: string;
  day: number;
}) {
  const { t, locale } = useTranslation();
  const { uid } = useSession();
  const mine = uid !== null && player.ownerUids.includes(uid);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (uid === null || busy || !/^\d{4}$/.test(pin)) return;
    setBusy(true);
    setError(null);
    const result = await claimPlayer(db, turnusId, player.id, uid, player.name, day, pin);
    setBusy(false);
    if (result.ok) onClose();
    else if (result.error.code === 'REQUIRES_ONLINE') setError(t('entry.offline'));
    else setError(t('players.wrongPin'));
  };

  const active = player.activeTask;
  const description = active
    ? localize(active.description, locale) || localize(active.name, locale)
    : undefined;
  const chips = mine ? (
    <Chip tone="accent">{t('players.you')}</Chip>
  ) : player.needsPick ? (
    <Chip tone="warning">{t('players.needsPick')}</Chip>
  ) : undefined;

  return (
    <Dialog open onClose={onClose} ariaLabel={player.name}>
      <CardLayout
        title={player.name}
        {...(chips !== undefined ? { chips } : {})}
        {...(description !== undefined ? { description } : {})}
        footerRight={<CoinAmount amount={player.coins} />}
        clampDescription={false}
      />

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
