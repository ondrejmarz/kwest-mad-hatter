import { useMemo } from 'react';

import type { Player } from '../../../domain/types';
import { usePlayers, useSession } from '../../session';

/** The character this device owns (spec 9.1) — derived from the live list, never a listener. */
export function useMyPlayer(): Player | null {
  const { uid } = useSession();
  const players = usePlayers();
  return useMemo(() => {
    if (uid === null || players.status !== 'ready') return null;
    return players.data.find((player) => player.ownerUids.includes(uid)) ?? null;
  }, [uid, players]);
}
