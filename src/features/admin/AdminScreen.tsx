import { useState } from 'react';

import { db } from '../../data/firebase';
import { leaveAdmin } from '../../data/transactions/leaveAdmin';
import type { LocalizedText } from '../../domain/types';
import { useTranslation } from '../../i18n/LocaleProvider';
import { localize } from '../../i18n/localize';
import { categoryLabel } from '../../lib/category';
import { csCollator } from '../../lib/collator';
import { TYPE_OPTIONS } from '../../lib/group';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { useCatalogRewards, useCatalogTasks, usePlayers, useSession, useTurnus } from '../session';

import { CatalogImport } from './catalog/CatalogImport';
import { CategoryPicker } from './catalog/CategoryPicker';
import { EvaluationPanel } from './evaluation/EvaluationPanel';
import { TurnusSettingsDialog } from './settings/TurnusSettingsDialog';

/**
 * Admin area (spec 9.4). The daily action is day evaluation; below it the admin bulk-imports
 * the catalog and chooses which task categories are in play. Per-item catalog editing lives on
 * the tabs behind the pencil.
 */
export function AdminScreen() {
  const { t, locale } = useTranslation();
  const { uid, turnus } = useSession();
  const turnusState = useTurnus();
  const playersState = usePlayers();
  const tasksState = useCatalogTasks();
  const rewardsState = useCatalogRewards();
  const [settingsOpen, setSettingsOpen] = useState(false);

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
  // What an admin can open for a day: the three task types first, then the real category tags —
  // one flat list, each a checkbox (types gate exactly like a tag; spec 7). Empty until the catalog
  // has tasks, which is when the "import first" hint is the useful thing to show.
  const typeOptions = TYPE_OPTIONS.map((option) => ({
    key: option.key,
    label: t(`tasks.${option.labelKey}`),
  }));
  const categoryOptions =
    categories.length === 0
      ? []
      : [
          ...typeOptions,
          ...categories.map((category) => ({
            key: category.cs,
            label: categoryLabel(localize(category, locale)),
          })),
        ];

  return (
    <section className="flex flex-col gap-3">
      <EvaluationPanel turnus={settings} players={players} tasks={tasks} rewards={rewards} />
      <CatalogImport
        turnusId={turnus.id}
        taskNames={new Set(tasks.map((task) => task.name.cs))}
        rewardNames={new Set(rewards.map((reward) => reward.name.cs))}
      />
      <div className="grid grid-cols-2 gap-3">
        <CategoryPicker
          turnusId={turnus.id}
          field="currentDay"
          title={t('catalog.categoriesTodayTitle')}
          hint={t('catalog.categoriesTodayHint')}
          options={categoryOptions}
          selected={settings.currentDayCategories}
        />
        <CategoryPicker
          turnusId={turnus.id}
          field="nextDay"
          title={t('catalog.categoriesTomorrowTitle')}
          hint={t('catalog.categoriesTomorrowHint')}
          options={categoryOptions}
          selected={settings.nextDayCategories}
        />
      </div>
      <Button variant="secondary" className="mt-2" onClick={() => setSettingsOpen(true)}>
        {t('admin.settings')}
      </Button>
      {settingsOpen && (
        <TurnusSettingsDialog
          turnus={settings}
          turnusId={turnus.id}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      <LeaveAdminButton turnusId={turnus.id} uid={uid ?? ''} />
    </section>
  );
}

/** Drops this device back to a regular player; the role listener then routes away from admin. */
function LeaveAdminButton({ turnusId, uid }: { turnusId: string; uid: string }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="secondary"
      className="mt-2"
      disabled={busy || uid === ''}
      onClick={() => {
        setBusy(true);
        void leaveAdmin(db, turnusId, uid).finally(() => setBusy(false));
      }}
    >
      {t('admin.leaveAdmin')}
    </Button>
  );
}
