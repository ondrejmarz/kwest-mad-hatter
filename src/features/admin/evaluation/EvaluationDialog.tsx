import { useEffect } from 'react';

import { db } from '../../../data/firebase';
import { setDayLock } from '../../../data/transactions/setDayLock';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { Dialog } from '../../../ui/Dialog';
import { Spinner } from '../../../ui/Spinner';
import {
  useCatalogRewards,
  useCatalogTasks,
  usePlayers,
  useSession,
  useTurnus,
} from '../../session';

import { EvaluationPanel } from './EvaluationPanel';

/**
 * The day-evaluation card in a dialog (spec 6) — the daily admin action, reached from Profil+.
 * Opening it LOCKS the day and closing it (any way) reopens it, so the day stays frozen exactly while
 * an admin is settling it; other admins see the lock and can't start their own. Evaluating advances
 * the day (which also reopens it) and closes the dialog.
 */
export function EvaluationDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { turnus } = useSession();
  const turnusState = useTurnus();
  const playersState = usePlayers();
  const tasksState = useCatalogTasks();
  const rewardsState = useCatalogRewards();

  const turnusId = turnus?.id ?? null;
  useEffect(() => {
    if (turnusId === null) return;
    void setDayLock(db, turnusId, true);
    return () => {
      void setDayLock(db, turnusId, false);
    };
  }, [turnusId]);

  const ready =
    turnusState.status === 'ready' &&
    turnusState.data !== null &&
    tasksState.status === 'ready' &&
    rewardsState.status === 'ready';

  return (
    <Dialog open onClose={onClose} ariaLabel={t('eval.title')}>
      {ready ? (
        <EvaluationPanel
          turnus={turnusState.data}
          players={playersState.status === 'ready' ? playersState.data : []}
          tasks={tasksState.data}
          rewards={rewardsState.data}
          onEvaluated={onClose}
        />
      ) : (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      )}
    </Dialog>
  );
}
