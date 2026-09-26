import type { ReactNode } from 'react';

import type { ReservationResponse } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { Chip } from '../../../ui/Chip';

/** Which kind of pair invite a card shows: a reservation for the next round, or a current-round pick. */
export type PairInviteKind = 'reservation' | 'today';

/**
 * One pair invite, the same card for both kinds and both sides (spec 7): an "Invite" chip plus a chip
 * naming the kind, who invites whom to what, the task's description, then the answer on the left and
 * the card's actions on the right. Once the invite is answered the card stays, with a ✕ to tuck it
 * away (`onDismiss`), so both members see how it ended.
 */
export function PairInviteCard({
  kind,
  text,
  description,
  answer,
  note,
  actions,
  onDismiss,
  children,
}: {
  kind: PairInviteKind;
  text: string;
  description: string;
  answer: ReservationResponse | undefined;
  /** Why the invite can't be accepted right now, shown under the description. */
  note?: string | null;
  actions?: ReactNode;
  /** Present once the invite is answered: the ✕ that hides the card. */
  onDismiss?: () => void;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <Chip tone="accent">{t('pair.inviteChip')}</Chip>
          <Chip tone="accent">
            {kind === 'reservation' ? t('pair.reservationChip') : t('pair.todayChip')}
          </Chip>
        </div>
        {onDismiss !== undefined && (
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={onDismiss}
            className="-mr-1 -mt-1 shrink-0 rounded-lg px-2 text-lg leading-none text-content-muted"
          >
            ✕
          </button>
        )}
      </div>
      <p className="mt-2 text-sm text-content">{text}</p>
      {description !== '' && <p className="mt-1 text-sm text-content-muted">{description}</p>}
      {note !== undefined && note !== null && (
        <p className="mt-1 text-sm text-content-muted">{note}</p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <AnswerBadge answer={answer} />
        {actions}
      </div>
      {children}
    </div>
  );
}

/** The animated outcome of an answer: a green check, a red cross, or a muted "waiting". */
function AnswerBadge({ answer }: { answer: ReservationResponse | undefined }) {
  const { t } = useTranslation();
  if (answer === 'accepted') {
    return (
      <span
        key="accepted"
        className="result-pop inline-flex items-center gap-1 text-sm text-success"
      >
        <span aria-hidden>✓</span>
        {t('pair.acceptedResult')}
      </span>
    );
  }
  if (answer === 'declined') {
    return (
      <span
        key="declined"
        className="result-pop inline-flex items-center gap-1 text-sm text-danger"
      >
        <span aria-hidden>✗</span>
        {t('pair.declinedResult')}
      </span>
    );
  }
  return <span className="text-sm text-content-muted">{t('pair.pending')}</span>;
}
