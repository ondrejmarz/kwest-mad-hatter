import { useTranslation } from '../../../i18n/LocaleProvider';
import { Dialog } from '../../../ui/Dialog';
import { Spinner } from '../../../ui/Spinner';
import { useCatalogRewards, useCatalogTasks, useSession } from '../../session';

import { CatalogImport } from './CatalogImport';

/** The TSV catalog import (spec 10) in a dialog, reached from Profil+. */
export function ImportDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { turnus } = useSession();
  const tasksState = useCatalogTasks();
  const rewardsState = useCatalogRewards();

  const ready = turnus !== null && tasksState.status === 'ready' && rewardsState.status === 'ready';

  return (
    <Dialog open onClose={onClose} ariaLabel={t('catalog.importTitle')}>
      {ready ? (
        <CatalogImport
          turnusId={turnus.id}
          taskNames={new Set(tasksState.data.map((task) => task.name.cs))}
          rewardNames={new Set(rewardsState.data.map((reward) => reward.name.cs))}
        />
      ) : (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      )}
    </Dialog>
  );
}
