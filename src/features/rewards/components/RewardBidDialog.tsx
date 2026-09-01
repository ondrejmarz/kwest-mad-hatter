import { type FormEvent, useState } from 'react';

import { db } from '../../../data/firebase';
import { bidReward } from '../../../data/transactions/bidReward';
import { cancelBid } from '../../../data/transactions/cancelBid';
import type { PlayerId } from '../../../domain/ids';
import type { Player, Reward, RewardBid, TurnusSettings } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { categoryLabel } from '../../../lib/category';
import { Button } from '../../../ui/Button';
import { CardLayout } from '../../../ui/CardLayout';
import { Checkbox } from '../../../ui/Checkbox';
import { Chip } from '../../../ui/Chip';
import { CoinAmount } from '../../../ui/CoinAmount';
import { Dialog } from '../../../ui/Dialog';
import { Select } from '../../../ui/Select';
import { TextInput } from '../../../ui/TextInput';

/**
 * Tap a reward, bid on it in the day's hidden auction (spec 8). A bid must be at least the reward's
 * price — the starting bid — and can be raised; only the number of interested players is shown,
 * never who or how much. The winner is decided and charged at evaluation. Bidding is frozen once
 * the admin locks the day, though a bid already placed can still be withdrawn.
 */
export function RewardBidDialog({
  reward,
  myPlayer,
  settings,
  bid,
  count,
  targetCounts,
  candidates,
  turnusId,
  onClose,
}: {
  reward: Reward;
  myPlayer: Player;
  settings: TurnusSettings;
  bid: RewardBid | null;
  count: number;
  /** Live public tally of how many current bids aim at each player id (spec 8). */
  targetCounts: Readonly<Record<string, number>>;
  candidates: readonly Player[];
  turnusId: string;
  onClose: () => void;
}) {
  const { t, locale } = useTranslation();
  const mine = bid !== null && bid.rewardId === reward.id;
  const isPunish = reward.form === 'punish_someone';
  const [amount, setAmount] = useState(String(mine && bid !== null ? bid.amount : reward.price));
  const [targets, setTargets] = useState<readonly PlayerId[]>(
    mine && bid !== null ? bid.targetIds : [],
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // A single-target punishment (exactly one target) picks it from a dropdown — the common case, and
  // quicker than a one-item checklist. A range still uses checkboxes.
  const singleTarget = isPunish && reward.minTargets === 1 && reward.maxTargets === 1;

  // A target is locked once `maxActivePunishesPerPlayer` other bidders aim at it. A player has one
  // sealed bid, and placing this one replaces it — even a bid on a different reward — so the targets
  // that current bid holds are subtracted: the buyer can re-pick them here without pushing the count
  // over. (Were a player ever allowed several concurrent bids, this would need all of their picks.)
  const ownSubmitted = bid !== null ? bid.targetIds : [];
  const isLocked = (id: PlayerId): boolean =>
    (targetCounts[id] ?? 0) - (ownSubmitted.includes(id) ? 1 : 0) >=
    settings.maxActivePunishesPerPlayer;

  const toggleTarget = (id: PlayerId): void => {
    setTargets((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : isLocked(id) || prev.length >= reward.maxTargets
          ? prev
          : [...prev, id],
    );
  };

  const run = async (action: Promise<{ ok: boolean }>): Promise<void> => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await action;
    setBusy(false);
    if (result.ok) onClose();
    else setError(t('entry.offline'));
  };

  const place = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isInteger(value) || value < reward.price) {
      setError(t('rewards.bidTooLow', { min: reward.price }));
      return;
    }
    if (isPunish && (targets.length < reward.minTargets || targets.length > reward.maxTargets)) {
      setError(
        singleTarget
          ? t('rewards.chooseTarget')
          : t('rewards.targetCountHint', { min: reward.minTargets, max: reward.maxTargets }),
      );
      return;
    }
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await bidReward(
      db,
      turnusId,
      myPlayer.id,
      reward.id,
      value,
      isPunish ? targets : [],
    );
    setBusy(false);
    if (result.ok) onClose();
    else if (result.error.code === 'TARGET_AT_PUNISH_LIMIT') setError(t('rewards.targetUsed'));
    else setError(t('entry.offline'));
  };

  return (
    <Dialog open onClose={onClose} ariaLabel={localize(reward.name, locale)}>
      <CardLayout
        title={localize(reward.name, locale)}
        chips={
          <>
            <Chip
              tone={
                reward.form === 'reward'
                  ? 'success'
                  : reward.form === 'punish_all'
                    ? 'danger'
                    : 'warning'
              }
            >
              {t(`rewards.forms.${reward.form}`)}
            </Chip>
            {reward.categories.map((category) => (
              <Chip key={category.cs}>{categoryLabel(localize(category, locale))}</Chip>
            ))}
          </>
        }
        {...(reward.description.cs !== ''
          ? { description: localize(reward.description, locale) }
          : {})}
        footerRight={<CoinAmount amount={reward.price} />}
        clampDescription={false}
      />

      <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
        <p className="text-sm text-content-muted">{t('rewards.interest', { count })}</p>

        {settings.dayLocked ? (
          <p className="text-sm text-content-muted">{t('rewards.bidLocked')}</p>
        ) : !reward.active ? (
          <p className="text-sm text-content-muted">{t('rewards.reasonInactive')}</p>
        ) : (
          <form onSubmit={(event) => void place(event)} className="flex flex-col gap-3">
            <TextInput
              label={t('rewards.bidAmountLabel', { min: reward.price })}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="numeric"
              autoFocus
            />
            {isPunish &&
              (candidates.length === 0 ? (
                <p className="text-sm text-content-muted">{t('rewards.noTargets')}</p>
              ) : singleTarget ? (
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-content-muted">
                    {t('rewards.chooseTarget')}
                  </span>
                  <Select
                    value={targets[0] ?? ''}
                    onChange={(event) =>
                      setTargets(event.target.value ? [event.target.value as PlayerId] : [])
                    }
                  >
                    <option value="">{t('rewards.chooseTarget')}</option>
                    {candidates.map((player) => (
                      <option key={player.id} value={player.id} disabled={isLocked(player.id)}>
                        {isLocked(player.id)
                          ? `${player.name} — ${t('rewards.targetUsed')}`
                          : player.name}
                      </option>
                    ))}
                  </Select>
                </label>
              ) : (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-content-muted">
                    {t('rewards.targetCountHint', {
                      min: reward.minTargets,
                      max: reward.maxTargets,
                    })}
                  </span>
                  {candidates.map((player) => (
                    <Checkbox
                      key={player.id}
                      label={
                        isLocked(player.id)
                          ? `${player.name} — ${t('rewards.targetUsed')}`
                          : player.name
                      }
                      checked={targets.includes(player.id)}
                      disabled={isLocked(player.id)}
                      onChange={() => toggleTarget(player.id)}
                    />
                  ))}
                </div>
              ))}
            <Button type="submit" disabled={busy || (isPunish && candidates.length === 0)}>
              {mine ? t('rewards.changeBid') : t('rewards.placeBid')}
            </Button>
          </form>
        )}

        {mine && (
          <Button
            variant="danger"
            disabled={busy}
            onClick={() => void run(cancelBid(db, turnusId, myPlayer.id))}
          >
            {t('rewards.cancelBid')}
          </Button>
        )}

        {error !== null && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Dialog>
  );
}
