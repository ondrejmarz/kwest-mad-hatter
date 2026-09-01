import { err, ok, type Result } from '../lib/result';

import type { DomainError } from './errors';
import type { Day, PlayerId } from './ids';
import type { Player, Reservation, Task } from './types';

/**
 * The pair-invite state machine (spec 7). A pair reservation starts unconfirmed
 * with an outstanding invite; the partner accepts to confirm it. Unconfirmed pairs
 * expire at day evaluation. Non-pair reservations are confirmed immediately.
 */

export interface ReservationInput {
  readonly player: Player;
  readonly task: Task;
  readonly day: Day;
  readonly partner?: { readonly id: PlayerId; readonly name: string };
  /** serverTimestamp millis — an input, never Date.now() (spec 15.5). */
  readonly createdAt: number;
}

export function createReservation(input: ReservationInput): Result<Reservation, DomainError> {
  const { player, task, day, partner, createdAt } = input;

  if (task.isPair) {
    if (partner === undefined) return err({ code: 'PARTNER_REQUIRED' });
    if (partner.id === player.id) return err({ code: 'PARTNER_IS_SELF' });
    return ok({
      playerId: player.id,
      day,
      taskId: task.id,
      taskName: task.name,
      isPair: true,
      partnerId: partner.id,
      partnerName: partner.name,
      confirmed: false,
      invitePartnerId: partner.id,
      createdAt,
    });
  }

  return ok({
    playerId: player.id,
    day,
    taskId: task.id,
    taskName: task.name,
    isPair: false,
    confirmed: true,
    createdAt,
  });
}

/** The invited partner accepts: confirm the pair and clear the outstanding invite. */
export function confirmPairInvite(reservation: Reservation, accepterId: PlayerId): Reservation {
  return { ...reservation, confirmed: true, partnerId: accepterId, invitePartnerId: null };
}

/** True when `playerId` has an outstanding invite to this reservation (spec 9.1 banner). */
export function isPendingPairInvite(reservation: Reservation, playerId: PlayerId): boolean {
  return reservation.isPair && !reservation.confirmed && reservation.invitePartnerId === playerId;
}
