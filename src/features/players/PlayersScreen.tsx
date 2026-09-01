import { useState } from 'react';

import type { Player } from '../../domain/types';
import { useTranslation } from '../../i18n/LocaleProvider';
import { byName, csCollator } from '../../lib/collator';
import { byNumber, byText } from '../../lib/sort';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { Select } from '../../ui/Select';
import { Spinner } from '../../ui/Spinner';
import { usePlayers, useMyPlayer, useSession, useTurnus } from '../session';

import { CreatePlayerDialog } from './components/CreatePlayerDialog';
import { PendingPlayersSection } from './components/PendingPlayersSection';
import { PlayerDetailDialog } from './components/PlayerDetailDialog';
import { PlayerEditDialog } from './components/PlayerEditDialog';
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
  const { uid, turnus, role } = useSession();
  const playersState = usePlayers();
  const turnusState = useTurnus();
  const myPlayer = useMyPlayer();
  const isAdmin = role === 'admin';

  const [sort, setSort] = useState<PlayerSort>('nameAsc');
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Player | null>(null);
  const [editing, setEditing] = useState<Player | null>(null);

  if (turnus === null) return null;
  const turnusId = turnus.id;
  const day = turnusState.status === 'ready' && turnusState.data ? turnusState.data.currentDay : 1;
  const meta = { actorUid: uid ?? '', actorLabel: myPlayer?.name ?? 'Admin' };

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
      <div className="flex items-start gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Select value={sort} onChange={(event) => setSort(event.target.value as PlayerSort)}>
            {PLAYER_SORTS.map((value) => (
              <option key={value} value={value}>
                {t(`sort.${value}`)}
              </option>
            ))}
          </Select>
        </div>
        <Button variant="secondary" className="shrink-0" onClick={() => setCreateOpen(true)}>
          {t('players.addPlayer')}
        </Button>
      </div>

      {myPlayer && (
        <PlayerRow
          player={myPlayer}
          mine
          isAdmin={isAdmin}
          onOpen={() => setSelected(myPlayer)}
          onEdit={() => setEditing(myPlayer)}
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
              onOpen={() => setSelected(player)}
              onEdit={() => setEditing(player)}
            />
          ))
        )}
      </div>

      <PendingPlayersSection
        pending={pending}
        isAdmin={isAdmin}
        turnusId={turnusId}
        day={day}
        meta={meta}
      />

      <CreatePlayerDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        turnusId={turnusId}
        day={day}
      />
      {selected !== null && (
        <PlayerDetailDialog
          player={selected}
          onClose={() => setSelected(null)}
          turnusId={turnusId}
          day={day}
        />
      )}
      {editing !== null && (
        <PlayerEditDialog
          player={editing}
          onClose={() => setEditing(null)}
          turnusId={turnusId}
          meta={meta}
        />
      )}
    </section>
  );
}
