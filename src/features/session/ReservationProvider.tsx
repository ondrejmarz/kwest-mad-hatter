import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { db } from '../../data/firebase';
import { subscribeMyInvites, subscribeMyReservation } from '../../data/repositories/reservations';
import type { Subscription } from '../../data/subscriptions';
import type { Reservation } from '../../domain/types';

import { useSession } from './SessionProvider';
import { useMyPlayer } from './useMyPlayer';

/**
 * The claimed player's reservation state (spec 7): their own reservation for tomorrow and
 * any pair invites still awaiting their answer. Both listeners are scoped to the player's id
 * (rules let a player read only their own reservation and ones that name them as partner), so
 * they only run once a character is claimed on this device.
 */
interface ReservationValue {
  readonly mine: Subscription<Reservation | null>;
  readonly invites: Subscription<readonly Reservation[]>;
}

const empty = <T,>(data: T): Subscription<T> => ({ status: 'ready', data, fromCache: false });

const ReservationContext = createContext<ReservationValue | null>(null);

export function ReservationProvider({ children }: { children: ReactNode }) {
  const { turnus } = useSession();
  const myPlayer = useMyPlayer();
  const playerId = myPlayer?.id ?? null;

  const [mine, setMine] = useState<Subscription<Reservation | null>>({ status: 'loading' });
  const [invites, setInvites] = useState<Subscription<readonly Reservation[]>>({
    status: 'loading',
  });

  useEffect(() => {
    if (turnus === null || playerId === null) {
      setMine(empty(null));
      return;
    }
    setMine({ status: 'loading' });
    return subscribeMyReservation(db, turnus.id, playerId, setMine);
  }, [turnus, playerId]);

  useEffect(() => {
    if (turnus === null || playerId === null) {
      setInvites(empty([]));
      return;
    }
    setInvites({ status: 'loading' });
    return subscribeMyInvites(db, turnus.id, playerId, setInvites);
  }, [turnus, playerId]);

  const value = useMemo<ReservationValue>(() => ({ mine, invites }), [mine, invites]);
  return <ReservationContext.Provider value={value}>{children}</ReservationContext.Provider>;
}

function useReservation(): ReservationValue {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error('useReservation must be used within a ReservationProvider');
  }
  return context;
}

export const useMyReservation = (): Subscription<Reservation | null> => useReservation().mine;
export const useMyInvites = (): Subscription<readonly Reservation[]> => useReservation().invites;
