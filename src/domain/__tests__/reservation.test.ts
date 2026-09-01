import { describe, expect, it } from 'vitest';

import { Day, PlayerId } from '../ids';
import { confirmPairInvite, createReservation, isPendingPairInvite } from '../reservation';

import { makePlayer, makeReservation, makeTask } from './fixtures';

const day = Day(2);

describe('createReservation', () => {
  it('creates a confirmed non-pair reservation', () => {
    expect(
      createReservation({ player: makePlayer(), task: makeTask(), day, createdAt: 1000 }),
    ).toEqual({
      ok: true,
      value: {
        playerId: 'p1',
        day: 2,
        taskId: 't1',
        taskName: 'Sweep the yard',
        isPair: false,
        confirmed: true,
        createdAt: 1000,
      },
    });
  });

  it('creates an unconfirmed pair reservation with an outstanding invite', () => {
    expect(
      createReservation({
        player: makePlayer(),
        task: makeTask({ isPair: true }),
        day,
        partner: { id: PlayerId('p2'), name: 'Kuba' },
        createdAt: 1000,
      }),
    ).toEqual({
      ok: true,
      value: {
        playerId: 'p1',
        day: 2,
        taskId: 't1',
        taskName: 'Sweep the yard',
        isPair: true,
        partnerId: 'p2',
        partnerName: 'Kuba',
        confirmed: false,
        invitePartnerId: 'p2',
        createdAt: 1000,
      },
    });
  });

  it('requires a partner for a pair task', () => {
    expect(
      createReservation({
        player: makePlayer(),
        task: makeTask({ isPair: true }),
        day,
        createdAt: 1,
      }),
    ).toEqual({ ok: false, error: { code: 'PARTNER_REQUIRED' } });
  });

  it('forbids inviting yourself', () => {
    const player = makePlayer();
    expect(
      createReservation({
        player,
        task: makeTask({ isPair: true }),
        day,
        partner: { id: player.id, name: player.name },
        createdAt: 1,
      }),
    ).toEqual({ ok: false, error: { code: 'PARTNER_IS_SELF' } });
  });
});

describe('confirmPairInvite', () => {
  it('confirms the pair and clears the invite', () => {
    const reservation = makeReservation({
      isPair: true,
      confirmed: false,
      invitePartnerId: PlayerId('p2'),
      partnerName: 'Kuba',
    });
    expect(confirmPairInvite(reservation, PlayerId('p2'))).toEqual({
      ...reservation,
      confirmed: true,
      partnerId: 'p2',
      invitePartnerId: null,
    });
  });
});

describe('isPendingPairInvite', () => {
  const pending = makeReservation({
    isPair: true,
    confirmed: false,
    invitePartnerId: PlayerId('p2'),
  });

  it('is true for the invited player', () => {
    expect(isPendingPairInvite(pending, PlayerId('p2'))).toBe(true);
  });

  it('is false for a non-pair reservation', () => {
    expect(isPendingPairInvite(makeReservation({ isPair: false }), PlayerId('p2'))).toBe(false);
  });

  it('is false once confirmed', () => {
    const confirmed = makeReservation({
      isPair: true,
      confirmed: true,
      invitePartnerId: PlayerId('p2'),
    });
    expect(isPendingPairInvite(confirmed, PlayerId('p2'))).toBe(false);
  });

  it('is false for a different player', () => {
    expect(isPendingPairInvite(pending, PlayerId('p9'))).toBe(false);
  });
});
