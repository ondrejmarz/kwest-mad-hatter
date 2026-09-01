import { err, ok, type Result } from '../lib/result';

import type { DomainError } from './errors';
import type { Day, PlayerId } from './ids';
import type { Player, Reservation, Task } from './types';

/**
 * Group reservations (spec 7, extended). The initiator reserves a task and invites others up to
 * the task's `[minPlayers, maxPlayers]` (counting the initiator). Invitees answer in `responses`,
 * toggleable until the day is evaluated. Validity is decided then: the members are the initiator
 * plus the accepted invitees, and the group only competes for the task if it reaches `minPlayers`
 * (otherwise the reservation expires, like an unconfirmed pair did). A solo task (1/1) has no
 * invitees and is always valid.
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
  if (inviteeIds.includes(player.id)) return err({ code: 'PARTNER_IS_SELF' });
  // Enough invited for the lower bound to be reachable (the UI also caps at the upper bound).
  if (1 + inviteeIds.length < task.minPlayers) return err({ code: 'PARTNER_REQUIRED' });
  return ok({
    playerId: player.id,
    day,
    taskId: task.id,
    taskName: task.name,
    minPlayers: task.minPlayers,
    maxPlayers: task.maxPlayers,
    invitees: [...inviteeIds],
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
