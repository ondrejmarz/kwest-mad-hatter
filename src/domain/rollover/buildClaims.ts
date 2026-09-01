import { invariant } from '../../lib/invariant';
import { gameEvent, type GameEvent } from '../events';
import type { Day, PlayerId } from '../ids';
import { reservationMembers } from '../reservation';
import type { Reservation } from '../types';

import type { Claim } from './types';

export interface BuildClaimsResult {
  readonly claims: readonly Claim[];
  readonly expiredEvents: readonly GameEvent[];
}

/**
 * Step 3.1–3.2 (spec 6): a reservation whose accepted members fall short of `minPlayers` expires
 * (everyone who was in loses out); the rest become claims. A group is one claim for all its
 * members, and its balance is the poorest member's, so a poor member can win the task for the group.
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
    const members = reservationMembers(reservation);

    if (members.length < reservation.minPlayers) {
      for (const playerId of members) {
        expiredEvents.push(gameEvent.reservationExpired(nextDay, playerId, reservation.taskId));
      }
      continue;
    }

    const balance = Math.min(...members.map((playerId) => balanceOf(coinsById, playerId)));
    claims.push({
      taskId: reservation.taskId,
      taskName: reservation.taskName,
      playerIds: members,
      balance,
      createdAt: reservation.createdAt,
      key: reservation.playerId,
    });
  }

  return { claims, expiredEvents };
}

function balanceOf(coinsById: ReadonlyMap<PlayerId, number>, playerId: PlayerId): number {
  const balance = coinsById.get(playerId);
  invariant(balance !== undefined, 'every reserving player was settled first');
  return balance;
}
