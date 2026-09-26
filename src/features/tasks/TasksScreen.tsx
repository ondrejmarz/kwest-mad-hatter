import { useMemo, useState } from 'react';

import { toTurnusSettings } from '../../data/schemas/turnus';
import { canInitiatePairPick, canPickTaskNow, canReserveTask } from '../../domain/eligibility';
import type { Task } from '../../domain/types';
import { useTranslation } from '../../i18n/LocaleProvider';
import { localize } from '../../i18n/localize';
import { csCollator } from '../../lib/collator';
import { taskTypeKey } from '../../lib/group';
import { usePersistentState } from '../../platform/storage/usePersistentState';
import { EmptyState } from '../../ui/EmptyState';
import { Spinner } from '../../ui/Spinner';
import {
  useCatalogTasks,
  useMyInvites,
  useMyPlayer,
  useMyReservation,
  usePlayers,
  useReservationCounts,
  useSession,
  useTaskClaims,
  useTurnus,
} from '../session';

import { TaskActionDialog } from './components/TaskActionDialog';
import { TaskCard } from './components/TaskCard';
import { TaskEditDialog } from './components/TaskEditDialog';
import { TaskListToolbar } from './components/TaskListToolbar';
import { takenInRoundBy, taskCategories, taskComparator, type TaskSort } from './taskList';

/**
 * Task catalog (spec 9.2): category filter, sort, availability toggles, admin add/edit. Players see
 * only active tasks; an admin also sees the inactive ones, greyed out at the end, so a deactivated
 * task can be reopened and switched back on.
 */
export function TasksScreen() {
  const { t, locale } = useTranslation();
  const { role } = useSession();
  const tasksState = useCatalogTasks();
  const turnusState = useTurnus();
  const playersState = usePlayers();
  const claimsState = useTaskClaims();
  const myPlayer = useMyPlayer();
  const reservationState = useMyReservation();
  const invitesState = useMyInvites();
  const countsState = useReservationCounts();
  const isAdmin = role === 'admin';

  const [sort, setSort] = usePersistentState<TaskSort>('kwest.tasks.sort', 'nameAsc');
  // One filter value: '' (all), a task-type key (`@type:*`), or a category tag's `cs` — types and
  // categories share the one dropdown (spec 9.2).
  const [category, setCategory] = usePersistentState('kwest.tasks.category', '');
  // Two independent availability filters (spec 9.2): reservable for the next round
  // (`canReserveTask`) and takeable in the current one. The current round covers both paths — a solo
  // grab (`canPickTaskNow`) and a pair invite (`canInitiatePairPick`) — so pairs aren't wrongly
  // hidden; groups stay reservation-only. Checked together, a task must pass both.
  const [availToday, setAvailToday] = usePersistentState('kwest.tasks.availToday', false);
  const [availTomorrow, setAvailTomorrow] = usePersistentState('kwest.tasks.availTomorrow', false);
  const [editing, setEditing] = useState<Task | null | undefined>(undefined);
  const [acting, setActing] = useState<Task | null>(null);

  const turnus = turnusState.status === 'ready' ? turnusState.data : null;
  const settings = turnus !== null ? toTurnusSettings(turnus) : null;
  const myReservation = reservationState.status === 'ready' ? reservationState.data : null;
  // A pair task counts as reserved for an accepted invitee too, so both members see it as theirs —
  // not as someone else's "interest" (spec 7).
  const myInvites = invitesState.status === 'ready' ? invitesState.data : [];
  const acceptedInvite =
    myPlayer !== null
      ? (myInvites.find((invite) => invite.responses[myPlayer.id] === 'accepted') ?? null)
      : null;
  const myReservedTaskId = myReservation?.taskId ?? acceptedInvite?.taskId ?? null;
  const players = useMemo(
    () => (playersState.status === 'ready' ? playersState.data : []),
    [playersState],
  );
  const candidates =
    myPlayer !== null
      ? players.filter((player) => player.status === 'approved' && player.id !== myPlayer.id)
      : [];
  const takenBy = useMemo(
    () =>
      takenInRoundBy(
        players,
        claimsState.status === 'ready' ? claimsState.data : [],
        myPlayer?.id ?? null,
        turnus?.currentDay ?? null,
      ),
    [players, claimsState, myPlayer, turnus],
  );
  const allTasks = useMemo(
    () =>
      tasksState.status === 'ready' ? tasksState.data.filter((task) => isAdmin || task.active) : [],
    [tasksState, isAdmin],
  );
  const categories = useMemo(() => taskCategories(allTasks, locale), [allTasks, locale]);

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
        if (
          availToday &&
          !canPickTaskNow(myPlayer, task, settings, takenBy).ok &&
          !canInitiatePairPick(myPlayer, task, settings, takenBy).ok
        ) {
          return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          Number(!a.active) - Number(!b.active) ||
          compare(a, b) ||
          csCollator.compare(localize(a.name, locale), localize(b.name, locale)),
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

  // Live status of a task, all from public data: who holds it in the current round and whether it
  // carries a reservation for the next one (mine vs. another player's interest, the latter an
  // existence-only count with my own reservation subtracted).
  const reservationCounts =
    countsState.status === 'ready' && countsState.data ? countsState.data.counts : {};
  const statusFor = (
    task: Task,
  ): { mine: boolean; taken: boolean; reserved: boolean; interestCount: number } => {
    const reserved = myReservedTaskId === task.id;
    return {
      mine: myPlayer?.activeTask?.taskId === task.id,
      taken: takenBy.has(task.id),
      reserved,
      interestCount: (reservationCounts[task.id] ?? 0) - (reserved ? 1 : 0),
    };
  };

  return (
    <section className="flex flex-col gap-3">
      <TaskListToolbar
        sort={sort}
        onSortChange={setSort}
        category={category}
        onCategoryChange={setCategory}
        categories={categories}
        availToday={availToday}
        onAvailTodayChange={setAvailToday}
        availTomorrow={availTomorrow}
        onAvailTomorrowChange={setAvailTomorrow}
        showAvailability={myPlayer !== null}
        {...(isAdmin ? { onAdd: () => setEditing(null) } : {})}
      />

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
          acceptedInvite={acceptedInvite}
          takenBy={takenBy}
          turnusId={turnus.id}
          onClose={() => setActing(null)}
        />
      )}
    </section>
  );
}
