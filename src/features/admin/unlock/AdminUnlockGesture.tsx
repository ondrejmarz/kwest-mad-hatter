import { type FormEvent, type ReactNode, useRef, useState } from 'react';

import { db } from '../../../data/firebase';
import { joinTurnus } from '../../../data/transactions/joinTurnus';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { Button } from '../../../ui/Button';
import { Sheet } from '../../../ui/Sheet';
import { TextInput } from '../../../ui/TextInput';
import { useSession } from '../../session';

const LONG_PRESS_MS = 600;

/**
 * The hidden admin unlock (spec 3c): a long press on the header title opens a sheet for the
 * admin code. Entering it upgrades this device to admin (joinTurnus re-runs with the admin
 * code); the role listener then reveals the Admin nav item.
 */
export function AdminUnlockGesture({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { uid, turnus } = useSession();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<number | null>(null);

  const start = (): void => {
    timer.current = window.setTimeout(() => setOpen(true), LONG_PRESS_MS);
  };
  const cancel = (): void => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (uid === null || turnus === null || busy) return;
    setBusy(true);
    setError(null);
    const result = await joinTurnus(db, turnus.id, uid, code.trim());
    setBusy(false);
    if (result.ok) {
      setOpen(false);
      setCode('');
    } else {
      setError(t('admin.unlockWrong'));
    }
  };

  return (
    <>
      <span
        onPointerDown={start}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onContextMenu={(event) => event.preventDefault()}
        className="select-none"
      >
        {children}
      </span>
      <Sheet open={open} onClose={() => setOpen(false)} title={t('admin.unlockTitle')}>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <p className="text-sm text-content-muted">{t('admin.unlockHint')}</p>
          <TextInput
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoCapitalize="characters"
            autoComplete="off"
            autoFocus
          />
          {error !== null && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={busy || code.trim().length === 0}>
            {t('admin.unlockSubmit')}
          </Button>
        </form>
      </Sheet>
    </>
  );
}
