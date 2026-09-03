import { useState } from 'react';

import { db } from '../../data/firebase';
import { adjustCoins } from '../../data/transactions/adjustCoins';
import type { Player } from '../../domain/types';
import { useTranslation } from '../../i18n/LocaleProvider';
import { byName, csCollator } from '../../lib/collator';
import { byNumber, byText } from '../../lib/sort';
import { usePersistentState } from '../../platform/storage/usePersistentState';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { Select } from '../../ui/Select';
import { Spinner } from '../../ui/Spinner';
import {
  usePlayers,
  useMyPlayer,
  usePurchases,
  useReservationCounts,
  useSession,
} from '../session';

import { CreatePlayerDialog } from './components/CreatePlayerDialog';
import { PendingPlayersSection } from './components/PendingPlayersSection';
import { PlayerDetailDialog } from './components/PlayerDetailDialog';
import { PlayerEditDialog } from './components/PlayerEditDialog';
import { selectPlayerFacts } from './components/PlayerFacts';
import { PlayerRow } from './components/PlayerRow';

const PLAYER_SORTS = ['nameAsc', 'nameDesc', 'coinsDesc', 'coinsAsc'] as const;
type PlayerSort = (typeof PLAYER_SORTS)[number];

function playerComparator(sort: PlayerSort): (a: Player, b: Player) => number {
  switch (sort) {
    case 'nameAsc':
      return byText((player) => player.name, 'asc');
    case 'nameDesc':
      return byText((player) => player.name, 'desc');
    case 'coinsDesc':
      return byNumber((player) => player.coins, 'desc');
    case 'coinsAsc':
      return byNumber((player) => player.coins, 'asc');
  }
}

/** The main screen (spec 9.1): own card, sorted roster, pending section, add + claim + edit. */
export function PlayersScreen() {
  const { t } = useTranslation();
  const { turnus, role } = useSession();
  const playersState = usePlayers();
  const purchasesState = usePurchases();
  const countsState = useReservationCounts();
  const myPlayer = useMyPlayer();
  const isAdmin = role === 'admin';

  const [sort, setSort] = usePersistentState<PlayerSort>('kwest.players.sort', 'nameAsc');
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Player | null>(null);
  const [editing, setEditing] = useState<Player | null>(null);

  if (turnus === null) return null;
  const turnusId = turnus.id;
  // Quick coin steps from the roster (spec 9.4).
  const adjustCoinsFor = (playerId: string) => (delta: number) => {
    void adjustCoins(db, turnusId, playerId, delta);
  };

  if (playersState.status === 'loading') {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }
  if (playersState.status === 'error') {
    return <EmptyState title={t('common.somethingWrong')} description={t('common.retry')} />;
  }

  const players = playersState.data;
  // Each card shows the rewards a player won and the punishments aimed at them, split out of the
  // public purchases (spec 9.1). `selectPlayerFacts` reads a player's slice; the row also derives
  // its "má odměnu" / "je terčem" chips from whether those slices are non-empty.
  const purchases = purchasesState.status === 'ready' ? purchasesState.data : [];
  // Who holds a reservation for tomorrow — a public existence flag, no task revealed (spec 7).
  const reservedPlayers =
    countsState.status === 'ready' && countsState.data ? countsState.data.players : {};
  const approved = players.filter((player) => player.status === 'approved');
  const pending = players
    .filter((player) => player.status === 'pending')
    .sort(byName((p) => p.name));
  const compare = playerComparator(sort);
  const others = (
    myPlayer ? approved.filter((player) => player.id !== myPlayer.id) : approved
  ).sort((a, b) => compare(a, b) || csCollator.compare(a.name, b.name));

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Select value={sort} onChange={(event) => setSort(event.target.value as PlayerSort)}>
            {PLAYER_SORTS.map((value) => (
              <option key={value} value={value}>
                {t(`sort.${value}`)}
              </option>
            ))}
          </Select>
        </div>
        <Button
          variant="secondary"
          size="icon"
          className="shrink-0"
          aria-label={t('players.addPlayer')}
          onClick={() => setCreateOpen(true)}
        >
          +
        </Button>
      </div>

      {myPlayer && (
        <PlayerRow
          player={myPlayer}
          mine
          isAdmin={isAdmin}
          hasReservation={reservedPlayers[myPlayer.id] === true}
          {...selectPlayerFacts(purchases, myPlayer.id)}
          onOpen={() => setSelected(myPlayer)}
          onEdit={() => setEditing(myPlayer)}
          onAdjustCoins={adjustCoinsFor(myPlayer.id)}
        />
      )}

      <div className="flex flex-col gap-2">
        {others.length === 0 && myPlayer === null ? (
          <EmptyState title={t('nav.players')} description={t('players.empty')} />
        ) : (
          others.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              mine={false}
              isAdmin={isAdmin}
              hasReservation={reservedPlayers[player.id] === true}
              {...selectPlayerFacts(purchases, player.id)}
              onOpen={() => setSelected(player)}
              onEdit={() => setEditing(player)}
              onAdjustCoins={adjustCoinsFor(player.id)}
            />
          ))
        )}
      </div>

      <PendingPlayersSection pending={pending} isAdmin={isAdmin} turnusId={turnusId} />

      <CreatePlayerDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        turnusId={turnusId}
      />
      {selected !== null && (
        <PlayerDetailDialog
          player={selected}
          onClose={() => setSelected(null)}
          turnusId={turnusId}
          hasReservation={reservedPlayers[selected.id] === true}
        />
      )}
      {editing !== null && (
        <PlayerEditDialog player={editing} onClose={() => setEditing(null)} turnusId={turnusId} />
      )}
    </section>
  );
}
