import { memo } from 'react';

import type { Reward } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { categoryLabel } from '../../../lib/category';
import { Chip } from '../../../ui/Chip';
import { CoinAmount } from '../../../ui/CoinAmount';
import { EditButton } from '../../../ui/EditButton';
import { ListCard } from '../../../ui/ListCard';

/** A reward card (spec 9.3): name, form chip, description, price, admin pencil. */
export const RewardCard = memo(function RewardCard({
  reward,
  isAdmin,
  onEdit,
}: {
  reward: Reward;
  isAdmin: boolean;
  onEdit: () => void;
}) {
  const { t, locale } = useTranslation();
  return (
    <ListCard
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
      description={localize(reward.description, locale)}
      footerLeft={isAdmin ? <EditButton onClick={onEdit} /> : undefined}
      footerRight={<CoinAmount amount={reward.price} />}
    />
  );
});
