import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { db } from '../../data/firebase';
import { subscribePlayers } from '../../data/repositories/players';
import type { Subscription } from '../../data/subscriptions';
import type { Player } from '../../domain/types';

import { useSession } from './SessionProvider';

/** Live listener on the turnus players (spec 15.7). The main-screen source of truth. */
const PlayersContext = createContext<Subscription<readonly Player[]> | null>(null);

export function PlayersProvider({ children }: { children: ReactNode }) {
  const { turnus, uid } = useSession();
  const [state, setState] = useState<Subscription<readonly Player[]>>({ status: 'loading' });

  // Only listen once signed in — a listener attached before the uid arrives is denied by the rules
  // and never retried, so keying on `uid` re-subscribes as soon as auth resolves (spec 15.7).
  useEffect(() => {
    if (turnus === null || uid === null) {
      setState({ status: 'loading' });
      return;
    }
    setState({ status: 'loading' });
    return subscribePlayers(db, turnus.id, setState);
  }, [turnus, uid]);

  return <PlayersContext.Provider value={state}>{children}</PlayersContext.Provider>;
}

export function usePlayers(): Subscription<readonly Player[]> {
  const context = useContext(PlayersContext);
  if (!context) {
    throw new Error('usePlayers must be used within a PlayersProvider');
  }
  return context;
}
