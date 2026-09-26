import { useState } from 'react';

import { db } from '../../data/firebase';
import { leaveAdmin } from '../../data/transactions/leaveAdmin';
import { setDayLock } from '../../data/transactions/setDayLock';
import { useTranslation } from '../../i18n/LocaleProvider';
import { Button } from '../../ui/Button';
import { useSession, useTurnus } from '../session';

import { CategoriesDialog } from './catalog/CategoriesDialog';
import { ImportDialog } from './catalog/ImportDialog';
import { EvaluationDialog } from './evaluation/EvaluationDialog';
import { SettingsDialog } from './settings/SettingsDialog';

type Which = 'evaluation' | 'categories' | 'import' | 'settings' | null;

/**
 * The admin block on `Profil+` (spec 9.4) — the admin actions that used to be their own tab, each
 * opening a dialog: day evaluation, the open-category selection, catalog import, turnus settings, and
 * finally the self-downgrade. Lives in the admin feature so it stays in the lazy admin chunk.
 *
 * The round is locked exactly while an evaluation dialog is open, so another admin can't start a
 * second evaluation meanwhile. But if the evaluating device dies with the dialog open, nothing would
 * ever unlock it, so a locked round with no dialog open here offers an explicit unlock.
 */
export function ProfileAdminSection() {
  const { t } = useTranslation();
  const { uid, turnus } = useSession();
  const turnusState = useTurnus();
  const [open, setOpen] = useState<Which>(null);
  const [leaving, setLeaving] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  // Locked while an evaluation dialog is open (here or on another admin's device), so a second
  // evaluation can't start until it closes.
  const dayLocked =
    turnusState.status === 'ready' && turnusState.data !== null
      ? turnusState.data.dayLocked
      : false;

  const close = (): void => setOpen(null);
  // Locked, but not by a dialog on this device — possibly another admin evaluating, or one that
  // crashed mid-evaluation and never unlocked.
  const stuck = dayLocked && open !== 'evaluation';

  const unlock = (): void => {
    if (turnus === null || unlocking) return;
    setUnlocking(true);
    void setDayLock(db, turnus.id, false).finally(() => setUnlocking(false));
  };

  const leave = (): void => {
    if (turnus === null || uid === null || leaving) return;
    setLeaving(true);
    // On success the role listener flips this device to player and Profil+ collapses to Profil.
    void leaveAdmin(db, turnus.id, uid).finally(() => setLeaving(false));
  };

  return (
    <div className="flex flex-col gap-3">
      <Button variant="danger" disabled={dayLocked} onClick={() => setOpen('evaluation')}>
        {t('admin.evaluation')}
      </Button>
      {stuck && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
          <p className="text-sm text-content-muted">{t('eval.stuckHint')}</p>
          <Button variant="secondary" disabled={unlocking} onClick={unlock}>
            {t('eval.unlock')}
          </Button>
        </div>
      )}
      <Button variant="secondary" onClick={() => setOpen('categories')}>
        {t('admin.categories')}
      </Button>
      <Button variant="secondary" onClick={() => setOpen('import')}>
        {t('admin.import')}
      </Button>
      <Button variant="secondary" onClick={() => setOpen('settings')}>
        {t('admin.settings')}
      </Button>
      <Button variant="secondary" className="mt-2" disabled={leaving} onClick={leave}>
        {t('admin.leaveAdmin')}
      </Button>

      {open === 'evaluation' && <EvaluationDialog onClose={close} />}
      {open === 'categories' && <CategoriesDialog onClose={close} />}
      {open === 'import' && <ImportDialog onClose={close} />}
      {open === 'settings' && <SettingsDialog onClose={close} />}
    </div>
  );
}
