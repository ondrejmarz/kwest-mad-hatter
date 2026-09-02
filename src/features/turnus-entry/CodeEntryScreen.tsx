import { type FormEvent, useState } from 'react';

import { db } from '../../data/firebase';
import { joinTurnus } from '../../data/transactions/joinTurnus';
import { useTranslation } from '../../i18n/LocaleProvider';
import { Button } from '../../ui/Button';
import { TextInput } from '../../ui/TextInput';
import { useSession } from '../session';

import { EntryLayout } from './EntryLayout';

/**
 * Enter the turnus code (spec 3a). The code is verified by the rules (a wrong code is a
 * denied write); on success the role listener flips and the gate routes the device inside.
 */
export function CodeEntryScreen() {
  const { t } = useTranslation();
  const { uid, turnus, switchTurnus } = useSession();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (uid === null || turnus === null || busy) return;
    setBusy(true);
    setError(null);
    const result = await joinTurnus(db, turnus.id, uid, code.trim());
    if (!result.ok) {
      setBusy(false);
      setError(result.error.code === 'REQUIRES_ONLINE' ? t('entry.offline') : t('entry.wrongCode'));
    }
    // On success the role subscription updates and the entry gate redirects us in.
  };

  return (
    <EntryLayout title={t('entry.codeTitle')} subtitle={turnus?.name}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <p className="text-center text-sm text-content-muted">{t('entry.codeHint')}</p>
        <TextInput
          label={t('entry.codeLabel')}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          autoCapitalize="characters"
          autoComplete="off"
          autoFocus
        />
        {error !== null && <p className="text-center text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={busy || code.trim().length === 0}>
          {t('entry.submit')}
        </Button>
        <Button type="button" variant="ghost" onClick={switchTurnus}>
          {t('entry.back')}
        </Button>
      </form>
    </EntryLayout>
  );
}
