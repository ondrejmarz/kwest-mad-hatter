import { memo } from 'react';

import type { PurchaseDoc } from '../../../data/schemas/purchase';
import type { Player } from '../../../domain/types';
import { CoinAmount } from '../../../ui/CoinAmount';
import { EditButton } from '../../../ui/EditButton';
import { ListCard } from '../../../ui/ListCard';

import { PlayerChips } from './PlayerChips';
import { PlayerFacts } from './PlayerFacts';

/**
 * One player in the list (spec 9.1): name, status chips, coins and (for an admin) an edit pencil.
 * Below the bands come the shared fact sections — task, won rewards, being a target — so a row
 * shows the same facts as the opened detail. Chips always state whether the player has a task, and
 * flag a won reward or being a target. All coin changes go through the edit dialog, which requires
 * a note.
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
}: {
  player: Player;
  mine: boolean;
  isAdmin: boolean;
  won: readonly PurchaseDoc[];
  targetedBy: readonly PurchaseDoc[];
  hasReservation: boolean;
  onOpen: () => void;
  onEdit: () => void;
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
      footerLeft={isAdmin ? <EditButton onClick={onEdit} /> : undefined}
      footerRight={<CoinAmount amount={player.coins} />}
    >
      <PlayerFacts player={player} won={won} targetedBy={targetedBy} />
    </ListCard>
  );
});
