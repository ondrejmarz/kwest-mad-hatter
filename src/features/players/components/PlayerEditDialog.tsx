import { type FormEvent, useState } from 'react';

import { db } from '../../../data/firebase';
import { renamePlayer } from '../../../data/playerAdmin';
import { adjustCoins } from '../../../data/transactions/adjustCoins';
import type { Player } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { Button } from '../../../ui/Button';
import { CoinAmount } from '../../../ui/CoinAmount';
import { Dialog } from '../../../ui/Dialog';
import { TextInput } from '../../../ui/TextInput';

/**
 * Admin edit of a player (spec 9.4): rename, and a coin adjustment that requires a note as a
 * justification (the `adjustCoins` transaction floors the balance). Renaming is a plain write;
 * a coin change requires being online.
 */
export function PlayerEditDialog({
  player,
  onClose,
  turnusId,
}: {
  player: Player;
  onClose: () => void;
  turnusId: string;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(player.name);
  // Direction and magnitude are separate so a coin change works on every keyboard — an iOS numeric
  // keypad has no minus sign, so a −/+ toggle carries the sign and the field only holds the amount.
  const [sign, setSign] = useState<1 | -1>(1);
  const [delta, setDelta] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (busy) return;
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError(t('players.invalidName'));
      return;
    }
    const magnitude = Math.abs(Number(delta));
    const change = sign * magnitude;
    const hasChange = delta.trim() !== '' && Number.isFinite(magnitude) && magnitude !== 0;
    if (hasChange && note.trim().length === 0) {
      setError(t('players.noteRequired'));
      return;
    }
    setBusy(true);
    setError(null);
    if (trimmed !== player.name) void renamePlayer(db, turnusId, player.id, trimmed);
    if (hasChange) {
      const result = await adjustCoins(db, turnusId, player.id, change, note.trim());
      if (!result.ok) {
        setBusy(false);
        setError(t('entry.offline'));
        return;
      }
    }
    setBusy(false);
    onClose();
  };

  return (
    <Dialog open onClose={onClose} title={t('players.editTitle')}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-content-muted">{t('players.coinsLabel')}</span>
          <CoinAmount amount={player.coins} />
        </div>
        <TextInput
          label={t('players.nameLabel')}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-content-muted">
            {t('players.coinsAdjustLabel')}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant={sign === -1 ? 'danger' : 'secondary'}
              aria-label={t('players.subtractCoins')}
              aria-pressed={sign === -1}
              onClick={() => setSign(-1)}
            >
              −
            </Button>
            <Button
              size="icon"
              variant={sign === 1 ? 'primary' : 'secondary'}
              aria-label={t('players.addCoins')}
              aria-pressed={sign === 1}
              onClick={() => setSign(1)}
            >
              +
            </Button>
            <div className="flex-1">
              <TextInput
                value={delta}
                onChange={(event) => setDelta(event.target.value)}
                inputMode="numeric"
                placeholder="0"
                aria-label={t('players.coinsAdjustLabel')}
              />
            </div>
          </div>
        </div>
        <TextInput
          label={t('players.coinsNoteLabel')}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        {error !== null && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={busy}>
          {t('players.save')}
        </Button>
      </form>
    </Dialog>
  );
}
