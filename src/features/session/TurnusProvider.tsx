import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { db } from '../../data/firebase';
import { subscribeTurnus } from '../../data/repositories/turnus';
import type { Turnus } from '../../data/schemas/turnus';
import type { Subscription } from '../../data/subscriptions';

import { useSession } from './SessionProvider';

/** Live listener on the current turnus document (spec 15.7). One of the main-screen listeners. */
const TurnusContext = createContext<Subscription<Turnus | null> | null>(null);

export function TurnusProvider({ children }: { children: ReactNode }) {
  const { turnus } = useSession();
  const [state, setState] = useState<Subscription<Turnus | null>>({ status: 'loading' });

  useEffect(() => {
    if (turnus === null) {
      setState({ status: 'loading' });
      return;
    }
    setState({ status: 'loading' });
    return subscribeTurnus(db, turnus.id, setState);
  }, [turnus]);

  return <TurnusContext.Provider value={state}>{children}</TurnusContext.Provider>;
}

export function useTurnus(): Subscription<Turnus | null> {
  const context = useContext(TurnusContext);
  if (!context) {
    throw new Error('useTurnus must be used within a TurnusProvider');
  }
  return context;
}
