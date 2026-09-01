import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { db } from '../../data/firebase';
import { subscribeRewards, subscribeTasks } from '../../data/repositories/catalog';
import type { Subscription } from '../../data/subscriptions';
import type { Reward, Task } from '../../domain/types';

import { useSession } from './SessionProvider';

/** Live task + reward catalog for the current turnus (spec 15.7). */
interface CatalogValue {
  readonly tasks: Subscription<readonly Task[]>;
  readonly rewards: Subscription<readonly Reward[]>;
}

const CatalogContext = createContext<CatalogValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { turnus, uid } = useSession();
  const [tasks, setTasks] = useState<Subscription<readonly Task[]>>({ status: 'loading' });
  const [rewards, setRewards] = useState<Subscription<readonly Reward[]>>({ status: 'loading' });

  // Wait for the anonymous uid: a catalog listener attached before sign-in finishes is rejected by
  // the rules (member-only reads) and Firestore never retries it — the classic "tasks stay blank
  // until you leave and come back" bug. Keying on `uid` re-subscribes once auth resolves.
  useEffect(() => {
    if (turnus === null || uid === null) return;
    setTasks({ status: 'loading' });
    return subscribeTasks(db, turnus.id, setTasks);
  }, [turnus, uid]);

  useEffect(() => {
    if (turnus === null || uid === null) return;
    setRewards({ status: 'loading' });
    return subscribeRewards(db, turnus.id, setRewards);
  }, [turnus, uid]);

  const value = useMemo<CatalogValue>(() => ({ tasks, rewards }), [tasks, rewards]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

function useCatalog(): CatalogValue {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
}

export const useCatalogTasks = (): Subscription<readonly Task[]> => useCatalog().tasks;
export const useCatalogRewards = (): Subscription<readonly Reward[]> => useCatalog().rewards;
