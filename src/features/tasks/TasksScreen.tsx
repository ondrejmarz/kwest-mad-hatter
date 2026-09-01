import { useMemo, useState } from 'react';

import { toTurnusSettings } from '../../data/schemas/turnus';
import { canPickTaskNow, canReserveTask } from '../../domain/eligibility';
import type { TaskId } from '../../domain/ids';
import type { LocalizedText, Task } from '../../domain/types';
import { useTranslation } from '../../i18n/LocaleProvider';
import { localize } from '../../i18n/localize';
import type { Locale } from '../../i18n/translate';
import { categoryLabel } from '../../lib/category';
import { csCollator } from '../../lib/collator';
import { byNumber, byText } from '../../lib/sort';
import { usePersistentState } from '../../platform/storage/usePersistentState';
import { Button } from '../../ui/Button';
import { Checkbox } from '../../ui/Checkbox';
import { EmptyState } from '../../ui/EmptyState';
import { Select } from '../../ui/Select';
import { Spinner } from '../../ui/Spinner';
import {
  useCatalogTasks,
  useMyPlayer,
  useMyReservation,
  usePlayers,
  useSession,
  useTurnus,
} from '../session';

import { TaskActionDialog } from './components/TaskActionDialog';
import { TaskCard } from './components/TaskCard';
import { TaskEditDialog } from './components/TaskEditDialog';

const TASK_SORTS = [
  'nameAsc',
  'nameDesc',
  'difficultyAsc',
  'difficultyDesc',
  'coinsDesc',
  'coinsAsc',
] as const;
type TaskSort = (typeof TASK_SORTS)[number];

const NO_TAKEN: ReadonlyMap<TaskId, string> = new Map();

function taskComparator(sort: TaskSort, locale: Locale): (a: Task, b: Task) => number {
  switch (sort) {
    case 'nameAsc':
      return byText((task) => localize(task.name, locale), 'asc');
    case 'nameDesc':
      return byText((task) => localize(task.name, locale), 'desc');
    case 'difficultyAsc':
      return byNumber((task) => task.difficulty, 'asc');
    case 'difficultyDesc':
      return byNumber((task) => task.difficulty, 'desc');
    case 'coinsDesc':
      return byNumber((task) => task.coinReward, 'desc');
    case 'coinsAsc':
      return byNumber((task) => task.coinReward, 'asc');
  }
}

/** Task catalog (spec 9.2): category filter, sort, available-only toggle, admin add/edit. */
export function TasksScreen() {
  const { t, locale } = useTranslation();
  const { role } = useSession();
  const tasksState = useCatalogTasks();
  const turnusState = useTurnus();
  const playersState = usePlayers();
  const myPlayer = useMyPlayer();
  const reservationState = useMyReservation();
  const isAdmin = role === 'admin';

  const [sort, setSort] = usePersistentState<TaskSort>('kwest.tasks.sort', 'nameAsc');
  const [category, setCategory] = usePersistentState('kwest.tasks.category', '');
  const [onlyAvailable, setOnlyAvailable] = usePersistentState('kwest.tasks.onlyAvailable', false);
  const [editing, setEditing] = useState<Task | null | undefined>(undefined);
  const [acting, setActing] = useState<Task | null>(null);

  const turnus = turnusState.status === 'ready' ? turnusState.data : null;
  const settings = turnus !== null ? toTurnusSettings(turnus) : null;
  const myReservation = reservationState.status === 'ready' ? reservationState.data : null;
  const candidates =
    myPlayer !== null && playersState.status === 'ready'
      ? playersState.data.filter(
          (player) => player.status === 'approved' && player.id !== myPlayer.id,
        )
      : [];
  const allTasks = useMemo(
    () => (tasksState.status === 'ready' ? tasksState.data.filter((task) => task.active) : []),
    [tasksState],
  );
  // Distinct category tags across the catalog, keyed by their canonical `cs` identity.
  const categories = useMemo(() => {
    const byCs = new Map<string, LocalizedText>();
    for (const task of allTasks) {
      for (const category of task.categories) {
        if (!byCs.has(category.cs)) byCs.set(category.cs, category);
      }
    }
    return [...byCs.values()].sort((a, b) =>
      csCollator.compare(localize(a, locale), localize(b, locale)),
    );
  }, [allTasks, locale]);

  const filtered = useMemo(() => {
    const compare = taskComparator(sort, locale);
    return allTasks
      .filter((task) => category === '' || task.categories.some((tag) => tag.cs === category))
      .filter(
        (task) =>
          !onlyAvailable ||
          settings === null ||
          myPlayer === null ||
          canReserveTask(myPlayer, task, settings).ok,
      )
      .sort(
        (a, b) =>
          compare(a, b) || csCollator.compare(localize(a.name, locale), localize(b.name, locale)),
      );
  }, [allTasks, category, onlyAvailable, sort, settings, myPlayer, locale]);

  if (tasksState.status === 'loading') {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }
  if (tasksState.status === 'error') {
    return <EmptyState title={t('common.somethingWrong')} description={t('common.retry')} />;
  }

  const chipsFor = (task: Task): { tomorrow: boolean; today: boolean } => {
    if (settings === null || myPlayer === null) return { tomorrow: false, today: false };
    return {
      tomorrow: !canReserveTask(myPlayer, task, settings).ok,
      today: !canPickTaskNow(myPlayer, task, settings, NO_TAKEN).ok,
    };
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Select value={sort} onChange={(event) => setSort(event.target.value as TaskSort)}>
            {TASK_SORTS.map((value) => (
              <option key={value} value={value}>
                {t(`sort.${value}`)}
              </option>
            ))}
          </Select>
          <Select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">{t('tasks.allCategories')}</option>
            {categories.map((category) => (
              <option key={category.cs} value={category.cs}>
                {categoryLabel(localize(category, locale))}
              </option>
            ))}
          </Select>
          {myPlayer !== null && (
            <div className="w-full py-1">
              <Checkbox
                label={t('tasks.onlyAvailable')}
                checked={onlyAvailable}
                onChange={setOnlyAvailable}
              />
            </div>
          )}
        </div>
        {isAdmin && (
          <Button
            variant="secondary"
            size="icon"
            className="shrink-0"
            aria-label={t('tasks.add')}
            onClick={() => setEditing(null)}
          >
            +
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t('nav.tasks')} description={t('tasks.empty')} />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((task) => {
            const { tomorrow, today } = chipsFor(task);
            return (
              <TaskCard
                key={task.id}
                task={task}
                unavailableTomorrow={tomorrow}
                unavailableToday={today}
                reserved={myReservation?.taskId === task.id}
                isAdmin={isAdmin}
                {...(myPlayer !== null && settings !== null
                  ? { onOpen: () => setActing(task) }
                  : {})}
                onEdit={() => setEditing(task)}
              />
            );
          })}
        </div>
      )}

      {editing !== undefined && turnus !== null && (
        <TaskEditDialog
          task={editing}
          onClose={() => setEditing(undefined)}
          turnusId={turnus.id}
          coinsPerDifficulty={turnus.coinsPerDifficulty}
          penaltyRatio={turnus.penaltyRatio}
        />
      )}

      {acting !== null && turnus !== null && settings !== null && myPlayer !== null && (
        <TaskActionDialog
          task={acting}
          myPlayer={myPlayer}
          settings={settings}
          candidates={candidates}
          reservation={myReservation}
          turnusId={turnus.id}
          onClose={() => setActing(null)}
        />
      )}
    </section>
  );
}
