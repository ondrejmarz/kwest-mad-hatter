import { useEffect, useState } from 'react';

import { db } from '../../../data/firebase';
import { subscribeAllReservations } from '../../../data/repositories/reservations';
import { subscribeRollbackPresence } from '../../../data/repositories/rollback';
import { toTurnusSettings, type Turnus } from '../../../data/schemas/turnus';
import type { Subscription } from '../../../data/subscriptions';
import { runRollover } from '../../../data/transactions/runRollover';
import { setDayLock } from '../../../data/transactions/setDayLock';
import { type EventMeta } from '../../../data/transactions/shared';
import { undoRollover } from '../../../data/transactions/undoRollover';
import type { PlayerId } from '../../../domain/ids';
import { resolveRollover } from '../../../domain/rollover';
import type { RolloverInput, RolloverPreview } from '../../../domain/rollover';
import type { Player, Reservation, Task } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { csCollator } from '../../../lib/collator';
import { Button } from '../../../ui/Button';
import { Checkbox } from '../../../ui/Checkbox';
import { Chip } from '../../../ui/Chip';
import { CoinAmount } from '../../../ui/CoinAmount';

function safePreview(input: RolloverInput): RolloverPreview | null {
  try {
    return resolveRollover(input).preview;
  } catch {
    return null;
  }
}

/**
 * Day evaluation (spec 6). The admin ticks who finished their active task; the panel runs the
 * exact pure `resolveRollover` for a live preview of the settlement and tomorrow's assignments,
 * then commits it in one transaction. A one-shot full undo stays available afterwards. Every
 * approved player is settled: an unticked player who had a task counts as failed.
 */
export function EvaluationPanel({
  turnus,
  players,
  tasks,
  meta,
}: {
  turnus: Turnus;
  players: readonly Player[];
  tasks: readonly Task[];
  meta: EventMeta;
}) {
  const { t, locale } = useTranslation();
  const [completed, setCompleted] = useState<ReadonlySet<PlayerId>>(new Set());
  const [reservations, setReservations] = useState<Subscription<readonly Reservation[]>>({
    status: 'loading',
  });
  const [rollback, setRollback] = useState<Subscription<true | null>>({ status: 'loading' });
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeAllReservations(db, turnus.id, setReservations), [turnus.id]);
  useEffect(() => subscribeRollbackPresence(db, turnus.id, setRollback), [turnus.id]);

  const approved = players
    .filter((player) => player.status === 'approved')
    .sort((a, b) => csCollator.compare(a.name, b.name));
  const withTask = approved.filter((player) => player.activeTask !== null);
  const reservationList = reservations.status === 'ready' ? reservations.data : [];

  const toggle = (id: PlayerId, done: boolean): void =>
    setCompleted((prev) => {
      const next = new Set(prev);
      if (done) next.add(id);
      else next.delete(id);
      return next;
    });

  const input: RolloverInput = {
    turnus: toTurnusSettings(turnus),
    players: approved,
    tasks,
    reservations: reservationList,
    completedPlayerIds: completed,
  };
  const preview = reservations.status === 'ready' ? safePreview(input) : null;
  const undoable = rollback.status === 'ready' && rollback.data === true;
  // Locking the day gates the whole evaluation: no ticking completions, no evaluating, until
  // the admin deliberately freezes the day (spec 6, decision).
  const locked = turnus.dayLocked;

  const evaluate = async (): Promise<void> => {
    if (busy) return;
    setBusy(true);
    await runRollover(db, turnus.id, input, meta);
    setBusy(false);
    setCompleted(new Set());
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-raised p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-content">{t('eval.title')}</h2>
        <span className="text-sm text-content-muted">
          {t('eval.day', { day: turnus.currentDay })}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-content-muted">
          {locked ? t('eval.locked') : t('eval.open')}
        </span>
        <Button
          variant={locked ? 'secondary' : 'primary'}
          className="shrink-0"
          disabled={busy}
          onClick={() => void setDayLock(db, turnus.id, !locked, turnus.currentDay, meta)}
        >
          {locked ? t('eval.unlock') : t('eval.lock')}
        </Button>
      </div>
      {!locked && <p className="text-sm text-content-muted">{t('eval.lockHint')}</p>}

      {withTask.length === 0 ? (
        <p className="text-sm text-content-muted">{t('eval.noActiveTasks')}</p>
      ) : (
        <ul className="flex flex-col gap-2 border-t border-border pt-3">
          {withTask.map((player) => (
            <li key={player.id} className="flex flex-col gap-0.5">
              <Checkbox
                label={player.name}
                checked={completed.has(player.id)}
                disabled={!locked}
                onChange={(done) => toggle(player.id, done)}
              />
              {player.activeTask !== null && (
                <span className="pl-6 text-xs text-content-muted">
                  {localize(player.activeTask.description, locale)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {preview !== null && <EvaluationPreview preview={preview} />}

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <Button
          disabled={busy || reservations.status !== 'ready' || !locked}
          onClick={() => void evaluate()}
        >
          {t('eval.evaluate')}
        </Button>
        {undoable && (
          <Button
            variant="danger"
            disabled={busy}
            onClick={() => void undoRollover(db, turnus.id, meta)}
          >
            {t('eval.undo')}
          </Button>
        )}
      </div>
    </div>
  );
}

function EvaluationPreview({ preview }: { preview: RolloverPreview }) {
  const { t, locale } = useTranslation();
  const outcomeLabel = {
    completed: t('eval.outcomeCompleted'),
    failed: t('eval.outcomeFailed'),
    no_task: t('eval.outcomeNoTask'),
  } as const;

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3 text-sm">
      <section>
        <h3 className="mb-1 text-xs font-semibold uppercase text-content-muted">
          {t('eval.settlements')}
        </h3>
        <ul className="flex flex-col gap-1">
          {preview.settlements.map((settlement) => (
            <li key={settlement.playerId} className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-content">{settlement.playerName}</span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-content-muted">
                  {outcomeLabel[settlement.outcome]}
                </span>
                <CoinAmount amount={settlement.delta} signed />
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-1 text-xs font-semibold uppercase text-content-muted">
          {t('eval.assignments')}
        </h3>
        {preview.assignments.length === 0 ? (
          <p className="text-content-muted">{t('eval.none')}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {preview.assignments.map((assignment) => (
              <li key={assignment.playerId} className="flex items-center gap-2">
                <span className="min-w-0 truncate text-content">{assignment.playerName}</span>
                <span className="text-content-muted">→</span>
                <span className="min-w-0 truncate text-content-muted">
                  {localize(assignment.taskName, locale)}
                </span>
                {assignment.isPair && <Chip tone="accent">{t('tasks.pair')}</Chip>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {preview.losses.length > 0 && (
        <section>
          <h3 className="mb-1 text-xs font-semibold uppercase text-content-muted">
            {t('eval.losses')}
          </h3>
          <ul className="flex flex-col gap-1 text-content-muted">
            {preview.losses.map((loss) => (
              <li key={`${loss.playerId}-${loss.taskName.cs}`}>
                {t('eval.lossLine', {
                  name: loss.playerName,
                  task: localize(loss.taskName, locale),
                })}
              </li>
            ))}
          </ul>
        </section>
      )}

      {preview.withoutTask.length > 0 && (
        <section>
          <h3 className="mb-1 text-xs font-semibold uppercase text-content-muted">
            {t('eval.withoutTask')}
          </h3>
          <p className="text-content-muted">
            {preview.withoutTask.map((player) => player.playerName).join(', ')}
          </p>
        </section>
      )}
    </div>
  );
}
