import { memo } from 'react';

import type { PurchaseDoc } from '../../../data/schemas/purchase';
import type { Player } from '../../../domain/types';
import { CoinAmount } from '../../../ui/CoinAmount';
import { ListCard } from '../../../ui/ListCard';

import { AdminCoinControls } from './AdminCoinControls';
import { PlayerChips } from './PlayerChips';
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
  return (
    <ListCard
      onClick={onOpen}
      highlighted={mine}
      title={player.name}
      chips={
        <PlayerChips
          player={player}
          mine={mine}
          won={won}
          targetedBy={targetedBy}
          hasReservation={hasReservation}
        />
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
