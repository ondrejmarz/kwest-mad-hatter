import { taskType } from '../lib/group';
import { err, ok, type Result } from '../lib/result';

import type { DomainError } from './errors';
import type { Day, PlayerId } from './ids';
import type { Player, Reservation, Task } from './types';

/**
 * Reservations by task type (spec 7, revised). A solo task (1/1) is reserved alone. A pair (2/2)
 * invites exactly one partner, who answers in `responses`, toggleable until evaluation — the pair
 * only competes if the partner accepts. A group (3+, a range) is reserved individually, with no
 * invitees: the pool of reservers is formed at evaluation, where it needs `minPlayers` to survive
 * and is trimmed to the poorest `maxPlayers` (see `buildClaims`).
 */
export interface ReservationInput {
  readonly player: Player;
  readonly task: Task;
  readonly day: Day;
  readonly inviteeIds: readonly PlayerId[];
  /** serverTimestamp millis — an input, never Date.now() (spec 15.5). */
  readonly createdAt: number;
}

export function createReservation(input: ReservationInput): Result<Reservation, DomainError> {
  const { player, task, day, inviteeIds, createdAt } = input;
  const type = taskType(task.minPlayers, task.maxPlayers);
  // A group is reserved individually — the invitees are ignored; the pool forms at evaluation.
  const invitees = type === 'group' ? [] : inviteeIds;
  if (invitees.includes(player.id)) return err({ code: 'PARTNER_IS_SELF' });
  // Only a pair needs its partner invited up front; a group pools at evaluation instead.
  if (type === 'pair' && invitees.length === 0) return err({ code: 'PARTNER_REQUIRED' });
  return ok({
    playerId: player.id,
    day,
    taskId: task.id,
    taskName: task.name,
    minPlayers: task.minPlayers,
    maxPlayers: task.maxPlayers,
    invitees: [...invitees],
    responses: {},
    createdAt,
  });
}

/** An invitee sets or flips their answer (spec 7). */
export function withResponse(
  reservation: Reservation,
  inviteeId: PlayerId,
  accept: boolean,
): Reservation {
  return {
    ...reservation,
    responses: { ...reservation.responses, [inviteeId]: accept ? 'accepted' : 'declined' },
  };
}

/** The confirmed members: the initiator plus every invitee who has accepted. */
export function reservationMembers(reservation: Reservation): readonly PlayerId[] {
  return [
    reservation.playerId,
    ...reservation.invitees.filter((id) => reservation.responses[id] === 'accepted'),
  ];
}

/** A group reservation is valid once its members reach the lower bound (spec 7). */
export function isReservationValid(reservation: Reservation): boolean {
  return reservationMembers(reservation).length >= reservation.minPlayers;
}

/** True when `playerId` is one of the invited (they see the invite banner and can respond). */
export function isInvitee(reservation: Reservation, playerId: PlayerId): boolean {
  return reservation.invitees.includes(playerId);
}

export interface ReservationTally {
  readonly invited: number;
  readonly accepted: number;
  readonly declined: number;
  readonly pending: number;
}

/** Counts for the invite banner: invited / accepted / declined / still pending (spec 7). */
export function reservationTally(reservation: Reservation): ReservationTally {
  let accepted = 0;
  let declined = 0;
  for (const id of reservation.invitees) {
    const response = reservation.responses[id];
    if (response === 'accepted') accepted += 1;
    else if (response === 'declined') declined += 1;
  }
  const invited = reservation.invitees.length;
  return { invited, accepted, declined, pending: invited - accepted - declined };
}
