import { describe, expect, it } from 'vitest';

import { Day, PlayerId } from '../ids';
import {
  canCancelReservation,
  createReservation,
  hasAccepted,
  isInvitee,
  isReservationValid,
  reservationMembers,
  reservationTally,
  withResponse,
} from '../reservation';

import { loc, makePlayer, makeReservation, makeTask, makeTurnus } from './fixtures';

const day = Day(2);

describe('createReservation', () => {
  it('creates a solo reservation with no invitees', () => {
    const result = createReservation({
      player: makePlayer(),
      task: makeTask(),
      day,
      inviteeIds: [],
      createdAt: 1000,
    });
    expect(result).toEqual({
      ok: true,
      value: {
        playerId: 'p1',
        day: 2,
        taskId: 't1',
        taskName: loc('Sweep the yard'),
        minPlayers: 1,
        maxPlayers: 1,
        invitees: [],
        responses: {},
        createdAt: 1000,
      },
    });
  });

  it('reserves a group task individually, ignoring any invitees', () => {
    const task = makeTask({ minPlayers: 2, maxPlayers: 3 });
    const result = createReservation({
      player: makePlayer(),
      task,
      day,
      inviteeIds: [PlayerId('p2'), PlayerId('p3')],
      createdAt: 1000,
    });
    expect(result.ok).toBe(true);
    expect(result.ok && result.value.invitees).toEqual([]);
    expect(result.ok && result.value.minPlayers).toBe(2);
  });

  it('creates a pair reservation with the invited partner', () => {
    const result = createReservation({
      player: makePlayer(),
      task: makeTask({ minPlayers: 2, maxPlayers: 2 }),
      day,
      inviteeIds: [PlayerId('p2')],
      createdAt: 500,
    });
    expect(result.ok && result.value.invitees).toEqual(['p2']);
  });

  it('rejects inviting yourself', () => {
    const result = createReservation({
      player: makePlayer(),
      task: makeTask({ minPlayers: 2, maxPlayers: 2 }),
      day,
      inviteeIds: [PlayerId('p1')],
      createdAt: 0,
    });
    expect(result).toEqual({ ok: false, error: { code: 'PARTNER_IS_SELF' } });
  });

  it('rejects a pair reserved without a partner', () => {
    const result = createReservation({
      player: makePlayer(),
      task: makeTask({ minPlayers: 2, maxPlayers: 2 }),
      day,
      inviteeIds: [],
      createdAt: 0,
    });
    expect(result).toEqual({ ok: false, error: { code: 'PARTNER_REQUIRED' } });
  });
});

describe('responses and membership', () => {
  const base = makeReservation({
    playerId: PlayerId('p1'),
    minPlayers: 2,
    maxPlayers: 3,
    invitees: [PlayerId('p2'), PlayerId('p3')],
  });

  it('counts the initiator plus accepted invitees as members', () => {
    const r = withResponse(withResponse(base, PlayerId('p2'), true), PlayerId('p3'), false);
    expect(reservationMembers(r)).toEqual(['p1', 'p2']);
  });

  it('is valid once members reach the lower bound', () => {
    expect(isReservationValid(base)).toBe(false);
    expect(isReservationValid(withResponse(base, PlayerId('p2'), true))).toBe(true);
  });

  it('lets an invitee flip their answer', () => {
    const r = withResponse(withResponse(base, PlayerId('p2'), true), PlayerId('p2'), false);
    expect(r.responses.p2).toBe('declined');
    expect(reservationMembers(r)).toEqual(['p1']);
  });

  it('tallies invited / accepted / declined / pending', () => {
    expect(reservationTally(withResponse(base, PlayerId('p2'), true))).toEqual({
      invited: 2,
      accepted: 1,
      declined: 0,
      pending: 1,
    });
    const both = withResponse(withResponse(base, PlayerId('p2'), true), PlayerId('p3'), false);
    expect(reservationTally(both)).toEqual({ invited: 2, accepted: 1, declined: 1, pending: 0 });
  });

  it('knows who was invited', () => {
    expect(isInvitee(base, PlayerId('p2'))).toBe(true);
    expect(isInvitee(base, PlayerId('p9'))).toBe(false);
  });
});

describe('cancelling a pair reservation', () => {
  const pair = makeReservation({
    playerId: PlayerId('p1'),
    minPlayers: 2,
    maxPlayers: 2,
    invitees: [PlayerId('p2')],
  });
  const accepted = withResponse(pair, PlayerId('p2'), true);
  const open = makeTurnus();

  it('knows who accepted the invite', () => {
    expect(hasAccepted(accepted, PlayerId('p2'))).toBe(true);
    expect(hasAccepted(pair, PlayerId('p2'))).toBe(false);
  });

  it('lets the initiator or the accepted partner call it off for both', () => {
    expect(canCancelReservation(accepted, PlayerId('p1'), open).ok).toBe(true);
    expect(canCancelReservation(accepted, PlayerId('p2'), open).ok).toBe(true);
  });

  it('refuses an invitee who has not accepted, and anyone uninvolved', () => {
    const refused = { ok: false, error: { code: 'NOT_RESERVATION_MEMBER' } };
    expect(canCancelReservation(pair, PlayerId('p2'), open)).toEqual(refused);
    expect(canCancelReservation(accepted, PlayerId('p9'), open)).toEqual(refused);
  });

  it('is frozen while the round is locked', () => {
    const locked = makeTurnus({ dayLocked: true });
    expect(canCancelReservation(accepted, PlayerId('p1'), locked)).toEqual({
      ok: false,
      error: { code: 'DAY_LOCKED' },
    });
  });
});
