import { memo } from 'react';

import type { Player } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { Chip } from '../../../ui/Chip';
import { CoinAmount } from '../../../ui/CoinAmount';
import { ListCard } from '../../../ui/ListCard';

import { AdminCoinControls } from './AdminCoinControls';

/** One player in the list (spec 9.1): name, chips, active task, coins, admin coin controls. */
export const PlayerRow = memo(function PlayerRow({
  player,
  mine,
  isAdmin,
  onOpen,
  onEdit,
  onAdjustCoins,
}: {
  player: Player;
  mine: boolean;
  isAdmin: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onAdjustCoins: (delta: number) => void;
}) {
  const { t, locale } = useTranslation();
  const active = player.activeTask;
  const partner =
    active && active.partnerNames.length > 0 ? ` · ${active.partnerNames.join(', ')}` : '';
  // What they're actually doing reads better as the task's description than its name (spec 9.1).
  const activeLabel = active
    ? `${localize(active.description, locale) || localize(active.name, locale)}${partner}`
    : undefined;
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
      description={activeLabel}
      footerLeft={
        isAdmin ? <AdminCoinControls onAdjust={onAdjustCoins} onEdit={onEdit} /> : undefined
      }
      footerRight={<CoinAmount amount={player.coins} />}
    />
  );
});
