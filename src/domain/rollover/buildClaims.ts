import { taskType } from '../../lib/group';
import { invariant } from '../../lib/invariant';
import type { Day, PlayerId, TaskId } from '../ids';
import { reservationMembers } from '../reservation';
import type { LocalizedText, Reservation } from '../types';

import { compareClaims } from './sortClaims';
import type { Claim } from './types';

interface Reserver {
  readonly playerId: PlayerId;
  readonly balance: number;
  readonly createdAt: number;
  readonly key: string;
}

interface GroupPool {
  readonly minPlayers: number;
  readonly maxPlayers: number;
  readonly taskName: LocalizedText;
  readonly reservers: Reserver[];
}

/**
 * Step 3.1–3.2 (spec 6, revised): turn the day's reservations into task claims.
 *
 * Solo and pair tasks each stand alone — a pair carries its accepted invitee, and falls short (and
 * expires) if the invitee did not accept. Group tasks (3+) are reserved individually and pooled per
 * task here: below `minPlayers` the pool expires for everyone; above `maxPlayers` the richest
 * reservers are dropped so the poorest fill the seats, and the survivors become one claim.
 */
export function buildClaims(
  reservations: readonly Reservation[],
  coinsById: ReadonlyMap<PlayerId, number>,
  nextDay: Day,
): readonly Claim[] {
  const claims: Claim[] = [];
  const pools = new Map<TaskId, GroupPool>();

  for (const reservation of reservations) {
    if (reservation.day !== nextDay) continue;

    if (taskType(reservation.minPlayers, reservation.maxPlayers) === 'group') {
      const pool = pools.get(reservation.taskId) ?? {
        minPlayers: reservation.minPlayers,
        maxPlayers: reservation.maxPlayers,
        taskName: reservation.taskName,
        reservers: [],
      };
      pool.reservers.push({
        playerId: reservation.playerId,
        balance: balanceOf(coinsById, reservation.playerId),
        createdAt: reservation.createdAt,
        key: reservation.playerId,
      });
      pools.set(reservation.taskId, pool);
      continue;
    }

    const members = reservationMembers(reservation);
    if (members.length < reservation.minPlayers) {
      // A pair/group short of its lower bound expires — nobody in it gets the task.
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

  for (const [taskId, pool] of pools) {
    const ordered = [...pool.reservers].sort(compareClaims);
    if (ordered.length < pool.minPlayers) {
      // The whole pool is below the task's lower bound — it expires for everyone.
      continue;
    }
    // Over the upper bound the richest reservers are dropped so the poorest fill the seats.
    const survivors = ordered.slice(0, pool.maxPlayers);
    claims.push({
      taskId,
      taskName: pool.taskName,
      playerIds: survivors.map((reserver) => reserver.playerId),
      balance: Math.min(...survivors.map((reserver) => reserver.balance)),
      createdAt: Math.min(...survivors.map((reserver) => reserver.createdAt)),
      key: taskId,
    });
  }

  return claims;
}

function balanceOf(coinsById: ReadonlyMap<PlayerId, number>, playerId: PlayerId): number {
  const balance = coinsById.get(playerId);
  invariant(balance !== undefined, 'every reserving player was settled first');
  return balance;
}
