import { memo } from 'react';

import type { Player } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { Chip } from '../../../ui/Chip';
import { CoinAmount } from '../../../ui/CoinAmount';
import { EditButton } from '../../../ui/EditButton';
import { ListCard } from '../../../ui/ListCard';

/** One player in the list (spec 9.1): name, chips, active task, coins, admin pencil. */
export const PlayerRow = memo(function PlayerRow({
  player,
  mine,
  isAdmin,
  onOpen,
  onEdit,
}: {
  player: Player;
  mine: boolean;
  isAdmin: boolean;
  onOpen: () => void;
  onEdit: () => void;
}) {
  const { t, locale } = useTranslation();
  const partner =
    player.activeTask?.isPair && player.activeTask.partnerName
      ? ` · ${player.activeTask.partnerName}`
      : '';
  const hasChips = mine || player.needsPick;
  return (
    <ListCard
      onClick={onOpen}
      highlighted={mine}
      title={player.name}
      chips={
        hasChips ? (
          <>
            {mine && <Chip tone="accent">{t('players.you')}</Chip>}
            {player.needsPick && <Chip tone="warning">{t('players.needsPick')}</Chip>}
          </>
        ) : undefined
      }
      description={
        player.activeTask ? `${localize(player.activeTask.name, locale)}${partner}` : undefined
      }
      footerLeft={isAdmin ? <EditButton onClick={onEdit} /> : undefined}
      footerRight={<CoinAmount amount={player.coins} />}
    />
  );
});
