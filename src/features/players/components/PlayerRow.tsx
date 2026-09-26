import { memo } from 'react';

import type { PurchaseDoc } from '../../../data/schemas/purchase';
import type { Player } from '../../../domain/types';
import { CardTopRight } from '../../../ui/CardTopRight';
import { CoinAmount } from '../../../ui/CoinAmount';
import { EditButton } from '../../../ui/EditButton';
import { ListCard } from '../../../ui/ListCard';

import { PlayerChips } from './PlayerChips';
import { type FactFilter, hasVisibleFacts, PlayerFactCards } from './PlayerFactCards';

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
  factFilter,
  onOpen,
  onEdit,
}: {
  player: Player;
  mine: boolean;
  isAdmin: boolean;
  won: readonly PurchaseDoc[];
  targetedBy: readonly PurchaseDoc[];
  hasReservation: boolean;
  /** Which nested fact cards to show (the roster's per-tab filter, spec 9.1). */
  factFilter: FactFilter;
  onOpen: () => void;
  onEdit: () => void;
}) {
  return (
    <ListCard
      onClick={onOpen}
      highlighted={mine}
      title={player.name}
      topRight={
        <CardTopRight
          coins={<CoinAmount amount={player.coins} />}
          {...(isAdmin ? { edit: <EditButton onClick={onEdit} /> } : {})}
        />
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
      {hasVisibleFacts(player, won, targetedBy, factFilter) && (
        <div className="mt-3 flex flex-col gap-2">
          <PlayerFactCards player={player} won={won} targetedBy={targetedBy} filter={factFilter} />
        </div>
      )}
    </ListCard>
  );
});
