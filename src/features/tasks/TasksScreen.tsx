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
import { taskTypeKey, TYPE_OPTIONS } from '../../lib/group';
import { byNumber, byText } from '../../lib/sort';
import { usePersistentState } from '../../platform/storage/usePersistentState';
import { Button } from '../../ui/Button';
import { Checkbox } from '../../ui/Checkbox';
import { EmptyState } from '../../ui/EmptyState';
import { Select } from '../../ui/Select';
import { Spinner } from '../../ui/Spinner';
import {
  useCatalogTasks,
  useMyInvites,
  useMyPlayer,
  useMyReservation,
  usePlayers,
  useReservationCounts,
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
  const invitesState = useMyInvites();
  const countsState = useReservationCounts();
  const isAdmin = role === 'admin';

  const [sort, setSort] = usePersistentState<TaskSort>('kwest.tasks.sort', 'nameAsc');
  // One filter value: '' (all), a task-type key (`@type:*`), or a category tag's `cs` — types and
  // categories share the one dropdown (spec 9.2).
  const [category, setCategory] = usePersistentState('kwest.tasks.category', '');
  // Two independent availability filters (spec 9.2): reservable tomorrow (`canReserveTask`) and
  // pickable today (`canPickTaskNow`). Checked together, a task must pass both.
  const [availToday, setAvailToday] = usePersistentState('kwest.tasks.availToday', false);
  const [availTomorrow, setAvailTomorrow] = usePersistentState('kwest.tasks.availTomorrow', false);
  const [editing, setEditing] = useState<Task | null | undefined>(undefined);
  const [acting, setActing] = useState<Task | null>(null);

  const turnus = turnusState.status === 'ready' ? turnusState.data : null;
  const settings = turnus !== null ? toTurnusSettings(turnus) : null;
  const myReservation = reservationState.status === 'ready' ? reservationState.data : null;
  // A pair/group task counts as reserved for an accepted invitee too, so both members see it as
  // theirs — not as someone else's "interest" (spec 7).
  const myInvites = invitesState.status === 'ready' ? invitesState.data : [];
  const acceptedInvite =
    myPlayer !== null
      ? (myInvites.find((invite) => invite.responses[myPlayer.id] === 'accepted') ?? null)
      : null;
  const myReservedTaskId = myReservation?.taskId ?? acceptedInvite?.taskId ?? null;
  const candidates =
    myPlayer !== null && playersState.status === 'ready'
      ? playersState.data.filter(
          (player) => player.status === 'approved' && player.id !== myPlayer.id,
        )
      : [];
  // Which tasks are already held today (by someone other than me) — powers the "taken today" chip
  // and gates the same-day "Vzít teď" pick. Derived from live players, not a separate listener.
  const takenBy = useMemo(() => {
    const map = new Map<TaskId, string>();
    if (playersState.status === 'ready') {
      for (const player of playersState.data) {
        if (player.activeTask !== null && player.id !== myPlayer?.id) {
          map.set(player.activeTask.taskId, player.name);
        }
      }
    }
    return map;
  }, [playersState, myPlayer]);
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
      .filter(
        (task) =>
          category === '' ||
          task.categories.some((tag) => tag.cs === category) ||
          taskTypeKey(task.minPlayers, task.maxPlayers) === category,
      )
      .filter((task) => {
        if (settings === null || myPlayer === null) return true;
        if (availTomorrow && !canReserveTask(myPlayer, task, settings).ok) return false;
        if (availToday && !canPickTaskNow(myPlayer, task, settings, takenBy).ok) return false;
        return true;
      })
      .sort(
        (a, b) =>
          compare(a, b) || csCollator.compare(localize(a.name, locale), localize(b.name, locale)),
      );
  }, [allTasks, category, availToday, availTomorrow, sort, settings, myPlayer, takenBy, locale]);

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

  // Live status of a task, all from public data: who holds it today and whether it carries a
  // reservation for tomorrow (mine vs. another player's interest, the latter an existence-only
  // count with my own reservation subtracted).
  const reservationCounts =
    countsState.status === 'ready' && countsState.data ? countsState.data.counts : {};
  const statusFor = (
    task: Task,
  ): { mine: boolean; taken: boolean; reserved: boolean; hasInterest: boolean } => {
    const reserved = myReservedTaskId === task.id;
    return {
      mine: myPlayer?.activeTask?.taskId === task.id,
      taken: takenBy.has(task.id),
      reserved,
      hasInterest: (reservationCounts[task.id] ?? 0) - (reserved ? 1 : 0) > 0,
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
            {TYPE_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {t(`tasks.${option.labelKey}`)}
              </option>
            ))}
            {categories.map((category) => (
              <option key={category.cs} value={category.cs}>
                {categoryLabel(localize(category, locale))}
              </option>
            ))}
          </Select>
          {myPlayer !== null && (
            <div className="flex w-full flex-wrap gap-x-4 gap-y-1 py-1">
              <Checkbox
                label={t('tasks.onlyAvailableToday')}
                checked={availToday}
                onChange={setAvailToday}
              />
              <Checkbox
                label={t('tasks.onlyAvailableTomorrow')}
                checked={availTomorrow}
                onChange={setAvailTomorrow}
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
          {filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              {...statusFor(task)}
              isAdmin={isAdmin}
              {...(myPlayer !== null && settings !== null ? { onOpen: () => setActing(task) } : {})}
              onEdit={() => setEditing(task)}
            />
          ))}
        </div>
      )}

      {editing !== undefined && turnus !== null && (
        <TaskEditDialog task={editing} onClose={() => setEditing(undefined)} turnusId={turnus.id} />
      )}

      {acting !== null && turnus !== null && settings !== null && myPlayer !== null && (
        <TaskActionDialog
          task={acting}
          myPlayer={myPlayer}
          settings={settings}
          candidates={candidates}
          reservation={myReservation}
          takenBy={takenBy}
          turnusId={turnus.id}
          onClose={() => setActing(null)}
        />
      )}
    </section>
  );
}
