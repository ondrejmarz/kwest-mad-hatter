import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { db } from '../../data/firebase';
import { subscribeMyInvites, subscribeMyReservation } from '../../data/repositories/reservations';
import { subscribeMyBid } from '../../data/repositories/rewardBids';
import type { Subscription } from '../../data/subscriptions';
import type { Reservation, RewardBid } from '../../domain/types';

import { useSession } from './SessionProvider';
import { useMyPlayer } from './useMyPlayer';

/**
 * The claimed player's secret daily state (spec 7, 8): their own task reservation for tomorrow,
 * any group invites still awaiting their answer, and their sealed reward bid. Every listener is
 * scoped to the player's id (rules expose these only to the player themselves), so they run only
 * once a character is claimed on this device.
 */
interface ReservationValue {
  readonly mine: Subscription<Reservation | null>;
  readonly invites: Subscription<readonly Reservation[]>;
  readonly bid: Subscription<RewardBid | null>;
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
  const [bid, setBid] = useState<Subscription<RewardBid | null>>({ status: 'loading' });

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

  useEffect(() => {
    if (turnus === null || playerId === null) {
      setBid(empty(null));
      return;
    }
    setBid({ status: 'loading' });
    return subscribeMyBid(db, turnus.id, playerId, setBid);
  }, [turnus, playerId]);

  const value = useMemo<ReservationValue>(() => ({ mine, invites, bid }), [mine, invites, bid]);
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
export const useMyBid = (): Subscription<RewardBid | null> => useReservation().bid;
