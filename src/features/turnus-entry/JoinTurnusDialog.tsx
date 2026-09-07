import { type FormEvent, useState } from 'react';

import { db } from '../../data/firebase';
import type { Turnus } from '../../data/schemas/turnus';
import { joinTurnus } from '../../data/transactions/joinTurnus';
import { useTranslation } from '../../i18n/LocaleProvider';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';
import { FormError } from '../../ui/FormError';
import { TextInput } from '../../ui/TextInput';
import { useSession } from '../session';

/**
 * Join a turnus (spec 3a, 11) — the same dialog shape as claiming a character on the roster. The
 * code is verified by the rules (a wrong code is a denied write); on success the caller folds the
 * entry chrome and enters the turnus, so the dialog stays busy rather than resetting.
 */
export function JoinTurnusDialog({
  turnus,
  onClose,
  onJoined,
}: {
  turnus: Turnus;
  onClose: () => void;
  onJoined: () => void;
}) {
  const { t } = useTranslation();
  const { uid } = useSession();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (uid === null || busy) return;
    setBusy(true);
    setError(null);
    const result = await joinTurnus(db, turnus.id, uid, code.trim());
    if (result.ok) {
      onJoined();
      return;
    }
    setBusy(false);
    setError(result.error.code === 'REQUIRES_ONLINE' ? t('entry.offline') : t('entry.wrongCode'));
  };

  return (
    <Dialog open onClose={onClose} title={turnus.name}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <p className="text-sm text-content-muted">{t('entry.codeHint')}</p>
        <TextInput
          label={t('entry.codeLabel')}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          autoCapitalize="characters"
          autoComplete="off"
          autoFocus
        />
        <FormError message={error} />
        <Button type="submit" disabled={busy || code.trim().length === 0}>
          {t('entry.submit')}
        </Button>
      </form>
    </Dialog>
  );
}
