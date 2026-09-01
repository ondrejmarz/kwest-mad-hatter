import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { db } from '../../data/firebase';
import {
  subscribeMyInvites,
  subscribeMyReservation,
  subscribeReservationCounts,
} from '../../data/repositories/reservations';
import { subscribeClaimedTargets, subscribeMyBid } from '../../data/repositories/rewardBids';
import { subscribeTaskClaims } from '../../data/repositories/taskClaims';
import type { ReservationCounts } from '../../data/schemas/reservation';
import type { TaskClaim } from '../../data/schemas/taskClaim';
import type { Subscription } from '../../data/subscriptions';
import type { Reservation, RewardBid } from '../../domain/types';

import { useSession } from './SessionProvider';
import { useTurnus } from './TurnusProvider';
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
  /** Public aggregates for tomorrow's reservations — per-task interest and who holds one. */
  readonly counts: Subscription<ReservationCounts | null>;
  /** Same-day claim markers, incl. pending pair picks (member-readable). */
  readonly claims: Subscription<readonly TaskClaim[]>;
  /** Ids of players already claimed as a punishment target this turnus (first-come, member-readable). */
  readonly claimedTargets: Subscription<readonly string[]>;
}

const empty = <T,>(data: T): Subscription<T> => ({ status: 'ready', data, fromCache: false });

const ReservationContext = createContext<ReservationValue | null>(null);

export function ReservationProvider({ children }: { children: ReactNode }) {
  const { turnus } = useSession();
  const turnusState = useTurnus();
  const myPlayer = useMyPlayer();
  const playerId = myPlayer?.id ?? null;
  // Tomorrow, whose reservations we are counting. The counts document is keyed by that day.
  const nextDay =
    turnusState.status === 'ready' && turnusState.data ? turnusState.data.currentDay + 1 : null;

  const [mine, setMine] = useState<Subscription<Reservation | null>>({ status: 'loading' });
  const [invites, setInvites] = useState<Subscription<readonly Reservation[]>>({
    status: 'loading',
  });
  const [bid, setBid] = useState<Subscription<RewardBid | null>>({ status: 'loading' });
  const [counts, setCounts] = useState<Subscription<ReservationCounts | null>>({
    status: 'loading',
  });
  const [claims, setClaims] = useState<Subscription<readonly TaskClaim[]>>({ status: 'loading' });
  const [claimedTargets, setClaimedTargets] = useState<Subscription<readonly string[]>>({
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

  useEffect(() => {
    if (turnus === null || playerId === null) {
      setBid(empty(null));
      return;
    }
    setBid({ status: 'loading' });
    return subscribeMyBid(db, turnus.id, playerId, setBid);
  }, [turnus, playerId]);

  useEffect(() => {
    if (turnus === null || nextDay === null) {
      setCounts(empty(null));
      return;
    }
    setCounts({ status: 'loading' });
    return subscribeReservationCounts(db, turnus.id, nextDay, setCounts);
  }, [turnus, nextDay]);

  useEffect(() => {
    if (turnus === null) {
      setClaims(empty([]));
      return;
    }
    setClaims({ status: 'loading' });
    return subscribeTaskClaims(db, turnus.id, setClaims);
  }, [turnus]);

  useEffect(() => {
    if (turnus === null) {
      setClaimedTargets(empty([]));
      return;
    }
    setClaimedTargets({ status: 'loading' });
    return subscribeClaimedTargets(db, turnus.id, setClaimedTargets);
  }, [turnus]);

  const value = useMemo<ReservationValue>(
    () => ({ mine, invites, bid, counts, claims, claimedTargets }),
    [mine, invites, bid, counts, claims, claimedTargets],
  );
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
export const useReservationCounts = (): Subscription<ReservationCounts | null> =>
  useReservation().counts;
export const useTaskClaims = (): Subscription<readonly TaskClaim[]> => useReservation().claims;
export const useClaimedTargets = (): Subscription<readonly string[]> =>
  useReservation().claimedTargets;
