import { memo } from 'react';

import type { Reward } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { categoryLabel } from '../../../lib/category';
import { CardTopRight } from '../../../ui/CardTopRight';
import { Chip } from '../../../ui/Chip';
import { CoinAmount } from '../../../ui/CoinAmount';
import { EditButton } from '../../../ui/EditButton';
import { ListCard } from '../../../ui/ListCard';

/**
 * A reward card (spec 9.3): name, then top-right the starting price with (for an admin) the edit
 * pencil furthest right; form chip, interest count and my-bid marker, and the description below.
 * Tapping it opens the hidden-auction bid dialog (spec 8).
 */
export const RewardCard = memo(function RewardCard({
  reward,
  isAdmin,
  reserved = false,
  interested = 0,
  onOpen,
  onEdit,
}: {
  reward: Reward;
  isAdmin: boolean;
  reserved?: boolean;
  interested?: number;
  onOpen?: () => void;
  onEdit: () => void;
}) {
  const { t, locale } = useTranslation();
  return (
    <ListCard
      {...(onOpen ? { onClick: onOpen } : {})}
      title={localize(reward.name, locale)}
      topRight={
        <CardTopRight
          coins={<CoinAmount amount={reward.price} />}
          {...(isAdmin ? { edit: <EditButton onClick={onEdit} /> } : {})}
        />
      }
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
          {reserved && <Chip tone="success">{t('rewards.reservedChip')}</Chip>}
          {interested > 0 && (
            <Chip tone="warning">
              {interested > 1
                ? t('rewards.hasInterestCount', { count: interested })
                : t('rewards.hasInterest')}
            </Chip>
          )}
        </>
      }
      description={localize(reward.description, locale)}
    />
  );
});
