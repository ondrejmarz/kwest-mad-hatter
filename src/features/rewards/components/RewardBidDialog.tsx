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
  candidates,
  turnusId,
  onClose,
}: {
  reward: Reward;
  myPlayer: Player;
  settings: TurnusSettings;
  bid: RewardBid | null;
  count: number;
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

  const toggleTarget = (id: PlayerId): void =>
    setTargets((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < reward.maxTargets
          ? [...prev, id]
          : prev,
    );

  const run = async (action: Promise<{ ok: boolean }>): Promise<void> => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await action;
    setBusy(false);
    if (result.ok) onClose();
    else setError(t('entry.offline'));
  };

  const place = (event: FormEvent): void => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isInteger(value) || value < reward.price) {
      setError(t('rewards.bidTooLow', { min: reward.price }));
      return;
    }
    if (isPunish && (targets.length < reward.minTargets || targets.length > reward.maxTargets)) {
      setError(t('rewards.targetCountHint', { min: reward.minTargets, max: reward.maxTargets }));
      return;
    }
    void run(bidReward(db, turnusId, myPlayer.id, reward.id, value, isPunish ? targets : []));
  };

  return (
    <Dialog open onClose={onClose} ariaLabel={localize(reward.name, locale)}>
      <CardLayout
        title={localize(reward.name, locale)}
        chips={
          <>
            <Chip tone={reward.form === 'reward' ? 'success' : 'warning'}>
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
          <form onSubmit={place} className="flex flex-col gap-3">
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
                      label={player.name}
                      checked={targets.includes(player.id)}
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
