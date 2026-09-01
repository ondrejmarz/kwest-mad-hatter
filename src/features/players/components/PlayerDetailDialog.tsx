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
 * Player detail (spec 9.1). A foreign player is view-only, except for the "I lost access"
 * recovery. A free character offers a no-PIN first claim; an owned one needs the PIN.
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
  const claimable = player.ownerUids.length === 0;
  const [recovering, setRecovering] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const claim = async (recoveryPin?: string): Promise<void> => {
    if (uid === null || busy) return;
    setBusy(true);
    setError(null);
    const result = await claimPlayer(db, turnusId, player.id, uid, player.name, day, recoveryPin);
    setBusy(false);
    if (result.ok) {
      onClose();
    } else if (result.error.code === 'REQUIRES_ONLINE') {
      setError(t('entry.offline'));
    } else if (recoveryPin !== undefined) {
      setError(t('players.wrongPin'));
    } else {
      setError(t('players.alreadyClaimed'));
    }
  };

  const recoverSubmit = (event: FormEvent): void => {
    event.preventDefault();
    if (/^\d{4}$/.test(pin)) void claim(pin);
  };

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
        {...(player.activeTask ? { description: localize(player.activeTask.name, locale) } : {})}
        footerRight={<CoinAmount amount={player.coins} />}
        clampDescription={false}
      />

      {!mine && (
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
          {claimable ? (
            <>
              <p className="text-sm text-content-muted">
                {t('players.claimHint', { name: player.name })}
              </p>
              <Button onClick={() => void claim()} disabled={busy}>
                {t('players.claimConfirm')}
              </Button>
            </>
          ) : recovering ? (
            <form onSubmit={recoverSubmit} className="flex flex-col gap-3">
              <p className="text-sm text-content-muted">{t('players.recoverHint')}</p>
              <TextInput
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                inputMode="numeric"
                maxLength={4}
                autoComplete="off"
                autoFocus
              />
              <Button type="submit" disabled={busy || !/^\d{4}$/.test(pin)}>
                {t('players.recoverSubmit')}
              </Button>
            </form>
          ) : (
            <Button variant="ghost" onClick={() => setRecovering(true)}>
              {t('players.recover')}
            </Button>
          )}
          {error !== null && <p className="text-sm text-danger">{error}</p>}
        </div>
      )}
    </Dialog>
  );
}
