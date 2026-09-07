import { useTranslation } from '../../../i18n/LocaleProvider';
import { Dialog } from '../../../ui/Dialog';
import { Spinner } from '../../../ui/Spinner';
import { useSession, useTurnus } from '../../session';

import { TurnusSettingsDialog } from './TurnusSettingsDialog';

/** Turnus settings, reached from Profil+ — a self-sufficient wrapper over `TurnusSettingsDialog`. */
export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { turnus } = useSession();
  const turnusState = useTurnus();

  if (turnus === null || turnusState.status !== 'ready' || turnusState.data === null) {
    return (
      <Dialog open onClose={onClose} ariaLabel={t('turnusSettings.title')}>
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      </Dialog>
    );
  }
  return <TurnusSettingsDialog turnus={turnusState.data} turnusId={turnus.id} onClose={onClose} />;
}
