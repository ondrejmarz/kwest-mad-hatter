import { memo } from 'react';

import type { PurchaseDoc } from '../../../data/schemas/purchase';
import type { Player } from '../../../domain/types';
import { CoinAmount } from '../../../ui/CoinAmount';
import { EditButton } from '../../../ui/EditButton';
import { ListCard } from '../../../ui/ListCard';

import { PlayerChips } from './PlayerChips';
import { PlayerFactCards } from './PlayerFactCards';

/**
 * One player in the list (spec 9.1): name, status chips, coins and (for an admin) an edit pencil.
 * Below the bands come the shared fact cards — task, won rewards, being a target, one card each — so
 * a row shows the same facts (and the same card shape) as the profile. Chips always state whether the
 * player has a task, and flag a won reward or being a target. All coin changes go through the edit
 * dialog, which requires a note.
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
      topRight={
        <div className="flex items-center gap-2">
          {isAdmin && <EditButton onClick={onEdit} />}
          <CoinAmount amount={player.coins} />
        </div>
      }
      chips={
        <PlayerChips
          player={player}
          mine={mine}
          won={won}
          targetedBy={targetedBy}
          hasReservation={hasReservation}
        />
      }
    >
      {(player.activeTask !== null || won.length > 0 || targetedBy.length > 0) && (
        <div className="mt-3 flex flex-col gap-2">
          <PlayerFactCards player={player} won={won} targetedBy={targetedBy} />
        </div>
      )}
    </ListCard>
  );
});
