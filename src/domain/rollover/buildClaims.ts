import { invariant } from '../../lib/invariant';
import { gameEvent, type GameEvent } from '../events';
import type { Day, PlayerId } from '../ids';
import type { Reservation } from '../types';

import type { Claim } from './types';

export interface BuildClaimsResult {
  readonly claims: readonly Claim[];
  readonly expiredEvents: readonly GameEvent[];
}

/**
 * Step 3.1–3.2 (spec 6): unconfirmed pair reservations expire (both partners lose
 * out); the rest become claims. A pair is one claim for two players, and its balance
 * is the poorer of the two so a poor partner can win the task for both.
 */
export function buildClaims(
  reservations: readonly Reservation[],
  coinsById: ReadonlyMap<PlayerId, number>,
  nextDay: Day,
): BuildClaimsResult {
  const claims: Claim[] = [];
  const expiredEvents: GameEvent[] = [];

  for (const reservation of reservations) {
    if (reservation.day !== nextDay) continue;

    if (reservation.isPair) {
      const partnerId = reservation.partnerId;
      invariant(partnerId !== undefined, 'a pair reservation names a partner');

      if (!reservation.confirmed) {
        expiredEvents.push(
          gameEvent.pairReservationExpired(nextDay, reservation.playerId, reservation.taskId),
          gameEvent.pairReservationExpired(nextDay, partnerId, reservation.taskId),
        );
        continue;
      }

      const balance = Math.min(
        balanceOf(coinsById, reservation.playerId),
        balanceOf(coinsById, partnerId),
      );
      const key = reservation.playerId < partnerId ? reservation.playerId : partnerId;
      claims.push(toClaim(reservation, [reservation.playerId, partnerId], balance, key));
    } else {
      const balance = balanceOf(coinsById, reservation.playerId);
      claims.push(toClaim(reservation, [reservation.playerId], balance, reservation.playerId));
    }
  }

  return { claims, expiredEvents };
}

function balanceOf(coinsById: ReadonlyMap<PlayerId, number>, playerId: PlayerId): number {
  const balance = coinsById.get(playerId);
  invariant(balance !== undefined, 'every reserving player was settled first');
  return balance;
}

function toClaim(
  reservation: Reservation,
  playerIds: readonly PlayerId[],
  balance: number,
  key: PlayerId,
): Claim {
  return {
    taskId: reservation.taskId,
    taskName: reservation.taskName,
    isPair: reservation.isPair,
    playerIds,
    balance,
    createdAt: reservation.createdAt,
    key,
  };
}
