import { useState } from 'react';

import { db } from '../../data/firebase';
import { leaveAdmin } from '../../data/transactions/leaveAdmin';
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
 */
export function ProfileAdminSection() {
  const { t } = useTranslation();
  const { uid, turnus } = useSession();
  const turnusState = useTurnus();
  const [open, setOpen] = useState<Which>(null);
  const [leaving, setLeaving] = useState(false);

  // The day is locked exactly while the evaluation dialog is open; another admin can't start their
  // own evaluation until it closes, so the button is disabled while the day is locked.
  const dayLocked =
    turnusState.status === 'ready' && turnusState.data !== null
      ? turnusState.data.dayLocked
      : false;

  const close = (): void => setOpen(null);

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
