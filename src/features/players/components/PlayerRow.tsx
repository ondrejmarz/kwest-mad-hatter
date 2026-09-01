import { memo } from 'react';

import type { PurchaseDoc } from '../../../data/schemas/purchase';
import type { Player } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { Chip } from '../../../ui/Chip';
import { CoinAmount } from '../../../ui/CoinAmount';
import { ListCard } from '../../../ui/ListCard';

import { AdminCoinControls } from './AdminCoinControls';
import { PlayerFacts } from './PlayerFacts';

/**
 * One player in the list (spec 9.1): name, status chips, coins and (for an admin) the coin
 * controls. Below the bands come the shared fact sections — task, won rewards, being a target —
 * so a row shows the same facts as the opened detail. Chips always state whether the player has a
 * task, and flag a won reward or being a target.
 */
export const PlayerRow = memo(function PlayerRow({
  player,
  mine,
  isAdmin,
  won,
  targetedBy,
  hasReservation,
  onOpen,
  onEdit,
  onAdjustCoins,
}: {
  player: Player;
  mine: boolean;
  isAdmin: boolean;
  won: readonly PurchaseDoc[];
  targetedBy: readonly PurchaseDoc[];
  hasReservation: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onAdjustCoins: (delta: number) => void;
}) {
  const { t } = useTranslation();
  const hasTask = player.activeTask !== null;
  return (
    <ListCard
      onClick={onOpen}
      highlighted={mine}
      title={player.name}
      chips={
        <>
          {mine && <Chip tone="accent">{t('players.you')}</Chip>}
          <Chip tone={hasTask ? 'success' : 'danger'}>
            {hasTask ? t('players.hasTask') : t('players.needsPick')}
          </Chip>
          <Chip tone={hasReservation ? 'success' : 'warning'}>
            {hasReservation ? t('players.hasReservation') : t('players.noReservationChip')}
          </Chip>
          {won.length > 0 && <Chip tone="success">{t('players.hasReward')}</Chip>}
          {targetedBy.length > 0 && <Chip tone="danger">{t('players.isTargeted')}</Chip>}
        </>
      }
      footerLeft={
        isAdmin ? <AdminCoinControls onAdjust={onAdjustCoins} onEdit={onEdit} /> : undefined
      }
      footerRight={<CoinAmount amount={player.coins} />}
    >
      <PlayerFacts player={player} won={won} targetedBy={targetedBy} />
    </ListCard>
  );
});
