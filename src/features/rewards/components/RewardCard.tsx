import { memo } from 'react';

import type { Reward } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { categoryLabel } from '../../../lib/category';
import { Chip } from '../../../ui/Chip';
import { CoinAmount } from '../../../ui/CoinAmount';
import { EditButton } from '../../../ui/EditButton';
import { ListCard } from '../../../ui/ListCard';

/**
 * A reward card (spec 9.3): name, form chip, interest count and my-bid marker, description, the
 * starting price, admin pencil. Tapping it opens the hidden-auction bid dialog (spec 8).
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
      footerLeft={isAdmin ? <EditButton onClick={onEdit} /> : undefined}
      footerRight={<CoinAmount amount={reward.price} />}
    />
  );
});
