import { useState } from 'react';

import { db } from '../../../data/firebase';
import type { TaskClaim } from '../../../data/schemas/taskClaim';
import { toTurnusSettings } from '../../../data/schemas/turnus';
import { acceptPairPick } from '../../../data/transactions/acceptPairPick';
import { cancelPairPick } from '../../../data/transactions/cancelPairPick';
import { declinePairPick } from '../../../data/transactions/declinePairPick';
import { canJoinPairPick } from '../../../domain/eligibility';
import type { DomainError } from '../../../domain/errors';
import type { PlayerId, TaskId } from '../../../domain/ids';
import type { Player, ReservationResponse, Task } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import type { Result } from '../../../lib/result';
import { Button } from '../../../ui/Button';
import { FormError } from '../../../ui/FormError';
import { useCatalogTasks, useMyPlayer, usePlayers, useTaskClaims, useTurnus } from '../../session';
import { taskErrorKey } from '../taskErrorKey';
import { useDismissedInvites } from '../useDismissedInvites';

import { PairInviteCard } from './PairInviteCard';

function answerOf(claim: TaskClaim): ReservationResponse | undefined {
  if (claim.accepted) return 'accepted';
  return claim.declined ? 'declined' : undefined;
}

/** A card's identity for dismissal: the claim, both members and the answer. */
function cardKey(claim: TaskClaim): string {
  return [claim.id, claim.playerId, claim.invitee, answerOf(claim) ?? ''].join('_');
}

/**
 * Same-round pair picks (spec 7), in the same card as a reservation invite: the initiator sees whom
 * they invited and can cancel while it waits; the invited partner accepts or declines. On accept
 * both members get the task for the current round at once. Once answered, both see the outcome and
 * nothing more to do, until the card's ✕ hides it. Names, titles and descriptions come from the
 * roster and catalog (the claim stores only ids). When accepting can't work (the round is locked,
 * or switching is off and a member already holds a task) the card says why instead of offering an
 * Accept that would fail.
 */
export function TodayPickBanner() {
  const { t, locale } = useTranslation();
  const myPlayer = useMyPlayer();
  const claimsState = useTaskClaims();
  const playersState = usePlayers();
  const tasksState = useCatalogTasks();
  const turnusState = useTurnus();
  const { isDismissed, dismiss } = useDismissedInvites('kwest.todayPicks.dismissed');

  if (myPlayer === null) return null;
  const turnus = turnusState.status === 'ready' ? turnusState.data : null;
  if (turnus === null) return null;
  const claims = claimsState.status === 'ready' ? claimsState.data : [];
  const mine = claims.filter(
    (claim) =>
      claim.day === turnus.currentDay &&
      claim.invitee !== null &&
      (claim.playerId === myPlayer.id || claim.invitee === myPlayer.id),
  );
  const liveKeys = mine.map(cardKey);
  const shown = mine.filter((claim) => !isDismissed(cardKey(claim)));
  if (shown.length === 0) return null;

  const settings = toTurnusSettings(turnus);
  const playerById =
    playersState.status === 'ready'
      ? new Map(playersState.data.map((player) => [player.id, player] as const))
      : new Map<PlayerId, Player>();
  const taskById =
    tasksState.status === 'ready'
      ? new Map(tasksState.data.map((task) => [task.id, task] as const))
      : new Map<TaskId, Task>();
  const nameOf = (id: PlayerId | null): string =>
    (id !== null ? playerById.get(id)?.name : undefined) ?? '?';
  // Why accepting this invite can't work right now, or null when it can.
  const blockedReason = (initiatorId: PlayerId): string | null => {
    const initiator = playerById.get(initiatorId);
    const check = canJoinPairPick(initiator ? [initiator, myPlayer] : [myPlayer], settings);
    return check.ok ? null : t(taskErrorKey(check.error));
  };

  return (
    <div className="mb-3 flex flex-col gap-2">
      {shown.map((claim) => {
        const task = taskById.get(claim.taskId);
        const taskName = task ? localize(task.name, locale) : '';
        const description = task ? localize(task.description, locale) : '';
        const answer = answerOf(claim);
        const onDismiss = (): void => dismiss(cardKey(claim), liveKeys);
        return claim.playerId === myPlayer.id ? (
          <PairInviteCard
            key={claim.id}
            kind="today"
            text={t('pair.youInvited', { names: nameOf(claim.invitee), task: taskName })}
            description={description}
            answer={answer}
            {...(answer !== undefined ? { onDismiss } : {})}
            actions={
              answer === undefined ? (
                <CancelButton taskId={claim.taskId} day={claim.day} turnusId={turnus.id} />
              ) : null
            }
          />
        ) : (
          <IncomingCard
            key={claim.id}
            claim={claim}
            text={t('pair.invitedBy', { name: nameOf(claim.playerId), task: taskName })}
            description={description}
            blockedReason={answer === undefined ? blockedReason(claim.playerId) : null}
            myPlayerId={myPlayer.id}
            turnusId={turnus.id}
            onDismiss={onDismiss}
          />
        );
      })}
    </div>
  );
}

function CancelButton({
  taskId,
  day,
  turnusId,
}: {
  taskId: string;
  day: number;
  turnusId: string;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="danger"
      disabled={busy}
      onClick={() => {
        if (busy) return;
        setBusy(true);
        void cancelPairPick(db, turnusId, taskId, day).finally(() => setBusy(false));
      }}
    >
      {t('pair.cancelInvite')}
    </Button>
  );
}

/** An invite to this player: Decline and Accept while it waits, then just the answer. */
function IncomingCard({
  claim,
  text,
  description,
  blockedReason,
  myPlayerId,
  turnusId,
  onDismiss,
}: {
  claim: TaskClaim;
  text: string;
  description: string;
  /** Set when accepting can't work right now — shown instead of an Accept that would fail. */
  blockedReason: string | null;
  myPlayerId: PlayerId;
  turnusId: string;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const answer = answerOf(claim);

  const act = async (accept: boolean): Promise<void> => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result: Result<void, DomainError> = accept
        ? await acceptPairPick(db, turnusId, claim.taskId, myPlayerId)
        : await declinePairPick(db, turnusId, claim.taskId, claim.day);
      if (!result.ok) setError(t(taskErrorKey(result.error)));
    } catch {
      setError(t('common.somethingWrong'));
    }
    setBusy(false);
  };

  return (
    <PairInviteCard
      kind="today"
      text={text}
      description={description}
      answer={answer}
      note={blockedReason}
      {...(answer !== undefined ? { onDismiss } : {})}
      actions={
        answer === undefined ? (
          <div className="flex gap-2">
            <Button variant="secondary" disabled={busy} onClick={() => void act(false)}>
              {t('pair.decline')}
            </Button>
            <Button disabled={busy || blockedReason !== null} onClick={() => void act(true)}>
              {t('pair.accept')}
            </Button>
          </div>
        ) : null
      }
    >
      <FormError message={error} className="mt-2" />
    </PairInviteCard>
  );
}
