import { useEffect, useState } from 'react';

import { db } from '../../../data/firebase';
import { subscribeAllReservations } from '../../../data/repositories/reservations';
import { subscribeAllBids } from '../../../data/repositories/rewardBids';
import { toTurnusSettings, type Turnus } from '../../../data/schemas/turnus';
import type { Subscription } from '../../../data/subscriptions';
import { runRollover } from '../../../data/transactions/runRollover';
import type { PlayerId } from '../../../domain/ids';
import { resolveRollover } from '../../../domain/rollover';
import type { RolloverInput, RolloverPreview } from '../../../domain/rollover';
import type { Player, Reservation, Reward, RewardBid, Task } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { csCollator } from '../../../lib/collator';
import { Button } from '../../../ui/Button';
import { Checkbox } from '../../../ui/Checkbox';
import { Chip } from '../../../ui/Chip';
import { CoinAmount } from '../../../ui/CoinAmount';
import { SectionLabel } from '../../../ui/SectionLabel';

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
 * then commits it in one transaction. Every approved player is settled: an unticked player who
 * had a task counts as failed. The day is already locked (its dialog holds the lock open, spec 6
 * decision), so there is no lock control here; evaluating advances the day and reopens it.
 */
export function EvaluationPanel({
  turnus,
  players,
  tasks,
  rewards,
  onEvaluated,
}: {
  turnus: Turnus;
  players: readonly Player[];
  tasks: readonly Task[];
  rewards: readonly Reward[];
  onEvaluated?: () => void;
}) {
  const { t, locale } = useTranslation();
  const [completed, setCompleted] = useState<ReadonlySet<PlayerId>>(new Set());
  const [reservations, setReservations] = useState<Subscription<readonly Reservation[]>>({
    status: 'loading',
  });
  const [bids, setBids] = useState<Subscription<readonly RewardBid[]>>({ status: 'loading' });
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeAllReservations(db, turnus.id, setReservations), [turnus.id]);
  useEffect(() => subscribeAllBids(db, turnus.id, setBids), [turnus.id]);

  const approved = players
    .filter((player) => player.status === 'approved')
    .sort((a, b) => csCollator.compare(a.name, b.name));
  const withTask = approved.filter((player) => player.activeTask !== null);
  const reservationList = reservations.status === 'ready' ? reservations.data : [];
  const bidList = bids.status === 'ready' ? bids.data : [];

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
    rewards,
    rewardBids: bidList,
    completedPlayerIds: completed,
  };
  const ready = reservations.status === 'ready' && bids.status === 'ready';
  const preview = ready ? safePreview(input) : null;
  const evaluate = async (): Promise<void> => {
    if (busy) return;
    setBusy(true);
    await runRollover(db, turnus.id, input);
    setBusy(false);
    setCompleted(new Set());
    // Rollover advanced the day and reopened it; close the dialog (its unmount clears the lock).
    onEvaluated?.();
  };

  return (
    // Frameless — it always lives inside a dialog now, which provides the card frame.
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-content">{t('eval.title')}</h2>
        <span className="text-sm text-content-muted">
          {t('eval.day', { day: turnus.currentDay })}
        </span>
      </div>

      {withTask.length === 0 ? (
        <p className="text-sm text-content-muted">{t('eval.noActiveTasks')}</p>
      ) : (
        <ul className="flex flex-col gap-2 border-t border-border pt-3">
          {withTask.map((player) => (
            <li key={player.id} className="flex flex-col gap-0.5">
              <Checkbox
                label={player.name}
                checked={completed.has(player.id)}
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
        <Button disabled={busy || !ready} onClick={() => void evaluate()}>
          {t('eval.evaluate')}
        </Button>
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
        <SectionLabel as="h3" className="mb-1">
          {t('eval.settlements')}
        </SectionLabel>
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
        <SectionLabel as="h3" className="mb-1">
          {t('eval.assignments')}
        </SectionLabel>
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
                {assignment.isGroup && <Chip tone="accent">{t('tasks.group')}</Chip>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {preview.auctions.length > 0 && (
        <section>
          <SectionLabel as="h3" className="mb-1">
            {t('eval.auctions')}
          </SectionLabel>
          <ul className="flex flex-col gap-1">
            {preview.auctions.map((auction) => (
              <li key={auction.rewardId} className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="min-w-0 truncate text-content">{auction.winnerName}</span>
                  <span className="text-content-muted">→</span>
                  <span className="min-w-0 truncate text-content-muted">
                    {localize(auction.rewardName, locale)}
                  </span>
                </span>
                <CoinAmount amount={-auction.amount} signed />
              </li>
            ))}
          </ul>
        </section>
      )}

      {preview.losses.length > 0 && (
        <section>
          <SectionLabel as="h3" className="mb-1">
            {t('eval.losses')}
          </SectionLabel>
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
          <SectionLabel as="h3" className="mb-1">
            {t('eval.withoutTask')}
          </SectionLabel>
          <p className="text-content-muted">
            {preview.withoutTask.map((player) => player.playerName).join(', ')}
          </p>
        </section>
      )}
    </div>
  );
}
