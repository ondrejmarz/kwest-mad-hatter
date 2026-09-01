import { useState } from 'react';

import type { Player } from '../../domain/types';
import { useTranslation } from '../../i18n/LocaleProvider';
import { byName } from '../../lib/collator';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { Spinner } from '../../ui/Spinner';
import { usePlayers, useSession, useTurnus } from '../session';

import { CreatePlayerDialog } from './components/CreatePlayerDialog';
import { PendingPlayersSection } from './components/PendingPlayersSection';
import { PlayerDetailDialog } from './components/PlayerDetailDialog';
import { PlayerRow } from './components/PlayerRow';
import { useMyPlayer } from './hooks/useMyPlayer';

/** The main screen (spec 9.1): own card, the approved roster, pending section, add + claim. */
export function PlayersScreen() {
  const { t } = useTranslation();
  const { uid, turnus, role } = useSession();
  const playersState = usePlayers();
  const turnusState = useTurnus();
  const myPlayer = useMyPlayer();
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Player | null>(null);

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
  const approved = players
    .filter((player) => player.status === 'approved')
    .sort(byName((p) => p.name));
  const pending = players
    .filter((player) => player.status === 'pending')
    .sort(byName((p) => p.name));
  const others = myPlayer ? approved.filter((player) => player.id !== myPlayer.id) : approved;

  return (
    <section className="flex flex-col gap-4">
      <ScreenHeader title={t('nav.players')} />

      {myPlayer && <PlayerRow player={myPlayer} mine onClick={() => setSelected(myPlayer)} />}

      <div className="flex flex-col gap-2">
        {others.length === 0 && myPlayer === null ? (
          <EmptyState title={t('nav.players')} description={t('players.empty')} />
        ) : (
          others.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              mine={false}
              onClick={() => setSelected(player)}
            />
          ))
        )}
      </div>

      <PendingPlayersSection
        pending={pending}
        isAdmin={role === 'admin'}
        turnusId={turnusId}
        day={day}
        meta={meta}
      />

      <Button variant="secondary" onClick={() => setCreateOpen(true)}>
        {t('players.addPlayer')}
      </Button>

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
    </section>
  );
}
