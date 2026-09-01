import { type FormEvent, useState } from 'react';

import { db } from '../../../data/firebase';
import { createPlayer } from '../../../data/transactions/createPlayer';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { Button } from '../../../ui/Button';
import { Dialog } from '../../../ui/Dialog';
import { TextInput } from '../../../ui/TextInput';
import { useSession } from '../../session';

/** "Add player" (spec 9.1): name + 4-digit recovery PIN, created as pending. */
export function CreatePlayerDialog({
  open,
  onClose,
  turnusId,
}: {
  open: boolean;
  onClose: () => void;
  turnusId: string;
}) {
  const { t } = useTranslation();
  const { uid } = useSession();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (uid === null || busy) return;
    if (name.trim().length === 0) {
      setError(t('players.invalidName'));
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError(t('players.invalidPin'));
      return;
    }
    setBusy(true);
    setError(null);
    const result = await createPlayer(db, turnusId, name.trim(), pin, uid);
    setBusy(false);
    if (result.ok) {
      setName('');
      setPin('');
      onClose();
    } else {
      setError(t('entry.offline'));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={t('players.createTitle')}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <TextInput
          label={t('players.nameLabel')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoFocus
        />
        <TextInput
          label={t('players.pinLabel')}
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          inputMode="numeric"
          maxLength={4}
          autoComplete="off"
        />
        {error !== null && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={busy}>
          {t('players.createSubmit')}
        </Button>
      </form>
    </Dialog>
  );
}
