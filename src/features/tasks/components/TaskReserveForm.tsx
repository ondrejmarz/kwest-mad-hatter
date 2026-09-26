import { type FormEvent, type ReactNode } from 'react';

import type { PlayerId } from '../../../domain/ids';
import type { LocalizedText, Player } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { Button } from '../../../ui/Button';
import { Select } from '../../../ui/Select';

/**
 * The reserve part of the task dialog (spec 7): a pair picks its one partner from a dropdown, then
 * either reserves for the next round or — when pairs are open in the current round — invites the
 * partner to take it right away. Solo and group tasks reserve with no partner. Replacing an existing
 * reservation says so up front, with the pair notices the dialog passes in.
 */
export function TaskReserveForm({
  isPair,
  partnerCandidates,
  partnerId,
  onPartnerChange,
  canReserve,
  canPairToday,
  replaces,
  pairCancelNote,
  leavesPairNote,
  busy,
  onReserve,
  onTakePairToday,
}: {
  isPair: boolean;
  /** Who can be invited — never someone who has already had this task. */
  partnerCandidates: readonly Player[];
  partnerId: PlayerId | null;
  onPartnerChange: (partnerId: PlayerId | null) => void;
  /** The task can be reserved for the next round. */
  canReserve: boolean;
  /** A pair can be taken in the current round (the partner still has to accept). */
  canPairToday: boolean;
  /** The reservation this one would replace, if any. */
  replaces: LocalizedText | null;
  pairCancelNote: ReactNode;
  leavesPairNote: ReactNode;
  busy: boolean;
  onReserve: () => void;
  onTakePairToday: () => void;
}) {
  const { t, locale } = useTranslation();
  const hasPartners = partnerCandidates.length > 0;
  const partnerMissing = isPair && partnerId === null;

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    onReserve();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {replaces !== null && canReserve && (
        <>
          <p className="text-sm text-content-muted">
            {t('tasks.replaceHint', { name: localize(replaces, locale) })}
          </p>
          {pairCancelNote}
        </>
      )}
      {isPair &&
        (!hasPartners ? (
          <p className="text-sm text-content-muted">{t('tasks.noPartners')}</p>
        ) : (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-content-muted">
              {t('tasks.choosePartner')}
            </span>
            <Select
              value={partnerId ?? ''}
              onChange={(event) =>
                onPartnerChange(event.target.value ? (event.target.value as PlayerId) : null)
              }
            >
              <option value="">{t('tasks.choosePartner')}</option>
              {partnerCandidates.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </Select>
          </label>
        ))}
      {canPairToday && hasPartners && (
        <>
          {leavesPairNote}
          <Button type="button" disabled={busy || partnerMissing} onClick={onTakePairToday}>
            {t('tasks.takePairToday')}
          </Button>
        </>
      )}
      {canReserve && (
        <Button
          type="submit"
          variant={canPairToday ? 'secondary' : 'primary'}
          disabled={busy || partnerMissing || (isPair && !hasPartners)}
        >
          {t('tasks.reserve')}
        </Button>
      )}
    </form>
  );
}
