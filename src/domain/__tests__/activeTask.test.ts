import { describe, expect, it } from 'vitest';

import { buildActiveTask, pairPartnerOf, partnerToRelease } from '../activeTask';
import { PlayerId, TaskId } from '../ids';

import { makeActiveTask, makePlayer, makeTask } from './fixtures';

const A = PlayerId('a');
const B = PlayerId('b');
const C = PlayerId('c');

const pairTask = (partner: PlayerId) =>
  makeActiveTask({ taskId: TaskId('pair'), partnerIds: [partner], partnerNames: ['?'] });

describe('buildActiveTask', () => {
  it('keeps the partner ids and names side by side', () => {
    const task = makeTask({ id: TaskId('pair'), minPlayers: 2, maxPlayers: 2 });
    const built = buildActiveTask(task, [{ id: B, name: 'Bob' }]);
    expect(built.partnerIds).toEqual(['b']);
    expect(built.partnerNames).toEqual(['Bob']);
  });
});

describe('pairPartnerOf', () => {
  it('names the single partner of a pair task', () => {
    expect(pairPartnerOf(pairTask(B))).toBe('b');
  });

  it('has no single partner for a solo task, a group, or no task at all', () => {
    expect(pairPartnerOf(makeActiveTask())).toBeNull();
    expect(pairPartnerOf(makeActiveTask({ partnerIds: [B, C] }))).toBeNull();
    expect(pairPartnerOf(null)).toBeNull();
  });
});

describe('partnerToRelease', () => {
  const partnerOnPair = makePlayer({ id: B, activeTask: pairTask(A) });

  it('releases the partner when a player leaves their pair for another task', () => {
    expect(partnerToRelease(pairTask(B), TaskId('solo'), [A], partnerOnPair)).toBe('b');
  });

  it('keeps the partner who moves on to the same next task', () => {
    expect(partnerToRelease(pairTask(B), TaskId('next'), [A, B], partnerOnPair)).toBeNull();
  });

  it('does nothing when the player is not actually leaving the pair', () => {
    expect(partnerToRelease(pairTask(B), TaskId('pair'), [A], partnerOnPair)).toBeNull();
  });

  it('does nothing for a solo task or a player with no task', () => {
    expect(partnerToRelease(makeActiveTask(), TaskId('solo'), [A], partnerOnPair)).toBeNull();
    expect(partnerToRelease(null, TaskId('solo'), [A], partnerOnPair)).toBeNull();
  });

  it('leaves a partner alone who no longer holds the pair task', () => {
    const movedOn = makePlayer({ id: B, activeTask: makeActiveTask({ taskId: TaskId('other') }) });
    const idle = makePlayer({ id: B, activeTask: null });
    expect(partnerToRelease(pairTask(B), TaskId('solo'), [A], movedOn)).toBeNull();
    expect(partnerToRelease(pairTask(B), TaskId('solo'), [A], idle)).toBeNull();
  });

  it('needs the partner themselves, read by their id', () => {
    const someoneElse = makePlayer({ id: C, activeTask: pairTask(A) });
    expect(partnerToRelease(pairTask(B), TaskId('solo'), [A], someoneElse)).toBeNull();
    expect(partnerToRelease(pairTask(B), TaskId('solo'), [A], null)).toBeNull();
  });
});
