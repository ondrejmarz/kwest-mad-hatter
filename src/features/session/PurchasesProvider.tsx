import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { db } from '../../data/firebase';
import { subscribeAllPurchases } from '../../data/repositories/purchases';
import type { PurchaseDoc } from '../../data/schemas/purchase';
import type { Subscription } from '../../data/subscriptions';

import { useSession } from './SessionProvider';

/** Live owned rewards for the turnus (spec 8) — every member reads them for the "has a reward" chip. */
const PurchasesContext = createContext<Subscription<readonly PurchaseDoc[]> | null>(null);

export function PurchasesProvider({ children }: { children: ReactNode }) {
  const { turnus, uid } = useSession();
  const [state, setState] = useState<Subscription<readonly PurchaseDoc[]>>({ status: 'loading' });

  // Gate on the uid like the other per-turnus listeners so it survives the sign-in race (spec 15.7).
  useEffect(() => {
    if (turnus === null || uid === null) {
      setState({ status: 'loading' });
      return;
    }
    setState({ status: 'loading' });
    return subscribeAllPurchases(db, turnus.id, setState);
  }, [turnus, uid]);

  return <PurchasesContext.Provider value={state}>{children}</PurchasesContext.Provider>;
}

export function usePurchases(): Subscription<readonly PurchaseDoc[]> {
  const context = useContext(PurchasesContext);
  if (!context) {
    throw new Error('usePurchases must be used within a PurchasesProvider');
  }
  return context;
}
