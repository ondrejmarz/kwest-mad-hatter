import { useMemo, useState } from 'react';

import { toTurnusSettings } from '../../data/schemas/turnus';
import { canPickTaskNow, canReserveTask } from '../../domain/eligibility';
import type { TaskId } from '../../domain/ids';
import type { Task } from '../../domain/types';
import { useTranslation } from '../../i18n/LocaleProvider';
import { csCollator } from '../../lib/collator';
import { byNumber, byText } from '../../lib/sort';
import { Button } from '../../ui/Button';
import { Checkbox } from '../../ui/Checkbox';
import { EmptyState } from '../../ui/EmptyState';
import { Select } from '../../ui/Select';
import { Spinner } from '../../ui/Spinner';
import { useCatalogTasks, useMyPlayer, useSession, useTurnus } from '../session';

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

function taskComparator(sort: TaskSort): (a: Task, b: Task) => number {
  switch (sort) {
    case 'nameAsc':
      return byText((task) => task.name, 'asc');
    case 'nameDesc':
      return byText((task) => task.name, 'desc');
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
  const { t } = useTranslation();
  const { role } = useSession();
  const tasksState = useCatalogTasks();
  const turnusState = useTurnus();
  const myPlayer = useMyPlayer();
  const isAdmin = role === 'admin';

  const [sort, setSort] = useState<TaskSort>('nameAsc');
  const [category, setCategory] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [editing, setEditing] = useState<Task | null | undefined>(undefined);

  const turnus = turnusState.status === 'ready' ? turnusState.data : null;
  const settings = turnus !== null ? toTurnusSettings(turnus) : null;
  const allTasks = useMemo(
    () => (tasksState.status === 'ready' ? tasksState.data.filter((task) => task.active) : []),
    [tasksState],
  );
  const categories = useMemo(
    () =>
      [...new Set(allTasks.map((task) => task.category))].sort((a, b) => csCollator.compare(a, b)),
    [allTasks],
  );

  const filtered = useMemo(() => {
    const compare = taskComparator(sort);
    return allTasks
      .filter((task) => category === '' || task.category === category)
      .filter(
        (task) =>
          !onlyAvailable ||
          settings === null ||
          myPlayer === null ||
          canReserveTask(myPlayer, task, settings).ok,
      )
      .sort((a, b) => compare(a, b) || csCollator.compare(a.name, b.name));
  }, [allTasks, category, onlyAvailable, sort, settings, myPlayer]);

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
      <div className="flex items-start gap-2">
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
            {categories.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
          {myPlayer !== null && (
            <Checkbox
              label={t('tasks.onlyAvailable')}
              checked={onlyAvailable}
              onChange={setOnlyAvailable}
            />
          )}
        </div>
        {isAdmin && (
          <Button variant="secondary" className="shrink-0" onClick={() => setEditing(null)}>
            {t('tasks.add')}
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
                isAdmin={isAdmin}
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
    </section>
  );
}
