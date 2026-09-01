import type { LocalizedText } from '../../domain/types';
import { useTranslation } from '../../i18n/LocaleProvider';
import { csCollator } from '../../lib/collator';
import { Spinner } from '../../ui/Spinner';
import { useCatalogRewards, useCatalogTasks, usePlayers, useSession, useTurnus } from '../session';

import { CatalogImport } from './catalog/CatalogImport';
import { CategoryPicker } from './catalog/CategoryPicker';
import { EvaluationPanel } from './evaluation/EvaluationPanel';

/**
 * Admin area (spec 9.4). The daily action is day evaluation; below it the admin bulk-imports
 * the catalog and chooses which task categories are in play. Per-item catalog editing lives on
 * the tabs behind the pencil.
 */
export function AdminScreen() {
  const { t } = useTranslation();
  const { uid, turnus } = useSession();
  const turnusState = useTurnus();
  const playersState = usePlayers();
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
  const players = playersState.status === 'ready' ? playersState.data : [];
  // Distinct category tags across tasks, keyed by their canonical `cs` identity.
  const categoryMap = new Map<string, LocalizedText>();
  for (const task of tasks) {
    for (const category of task.categories) {
      if (!categoryMap.has(category.cs)) categoryMap.set(category.cs, category);
    }
  }
  const categories = [...categoryMap.values()].sort((a, b) => csCollator.compare(a.cs, b.cs));
  const meta = { actorUid: uid ?? '', actorLabel: 'Admin' };

  return (
    <section className="flex flex-col gap-3">
      <EvaluationPanel turnus={settings} players={players} tasks={tasks} meta={meta} />
      <CatalogImport
        turnusId={turnus.id}
        coinsPerDifficulty={settings.coinsPerDifficulty}
        penaltyRatio={settings.penaltyRatio}
        taskNames={new Set(tasks.map((task) => task.name.cs))}
        rewardNames={new Set(rewards.map((reward) => reward.name.cs))}
      />
      <CategoryPicker
        turnusId={turnus.id}
        day={settings.currentDay}
        meta={meta}
        field="currentDay"
        title={t('catalog.categoriesTodayTitle')}
        hint={t('catalog.categoriesTodayHint')}
        categories={categories}
        selected={settings.currentDayCategories}
      />
      <CategoryPicker
        turnusId={turnus.id}
        day={settings.currentDay}
        meta={meta}
        field="nextDay"
        title={t('catalog.categoriesTomorrowTitle')}
        hint={t('catalog.categoriesTomorrowHint')}
        categories={categories}
        selected={settings.nextDayCategories}
      />
    </section>
  );
}
