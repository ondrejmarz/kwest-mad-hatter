import { csCollator } from '../../lib/collator';
import { Spinner } from '../../ui/Spinner';
import { useCatalogRewards, useCatalogTasks, useSession, useTurnus } from '../session';

import { CatalogImport } from './catalog/CatalogImport';
import { CategoryPicker } from './catalog/CategoryPicker';

/**
 * Admin area (spec 9.4). Per-item catalog editing now lives on the tabs behind the pencil;
 * here the admin bulk-imports the catalog and chooses which task categories are in play.
 */
export function AdminScreen() {
  const { uid, turnus } = useSession();
  const turnusState = useTurnus();
  const tasksState = useCatalogTasks();
  const rewardsState = useCatalogRewards();

  if (
    turnus === null ||
    turnusState.status !== 'ready' ||
    turnusState.data === null ||
    tasksState.status !== 'ready' ||
    rewardsState.status !== 'ready'
  ) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  const settings = turnusState.data;
  const tasks = tasksState.data;
  const rewards = rewardsState.data;
  const categories = [...new Set(tasks.map((task) => task.category))].sort((a, b) =>
    csCollator.compare(a, b),
  );
  const meta = { actorUid: uid ?? '', actorLabel: 'Admin' };

  return (
    <section className="flex flex-col gap-3">
      <CatalogImport
        turnusId={turnus.id}
        coinsPerDifficulty={settings.coinsPerDifficulty}
        penaltyRatio={settings.penaltyRatio}
        taskNames={new Set(tasks.map((task) => task.name))}
        rewardNames={new Set(rewards.map((reward) => reward.name))}
      />
      <CategoryPicker
        turnusId={turnus.id}
        day={settings.currentDay}
        meta={meta}
        categories={categories}
        selected={settings.nextDayCategories}
      />
    </section>
  );
}
