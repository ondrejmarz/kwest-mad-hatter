import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isRetryable, withRetry } from '../subscriptions';

interface Rec {
  onNext: (snap: string) => void;
  onError: (e: unknown) => void;
  unsubbed: boolean;
}

/** A stand-in for `onSnapshot`: records every attachment so a test can fire next/error by hand. */
function fakeAttach() {
  const calls: Rec[] = [];
  const attach = (onNext: (snap: string) => void, onError: (e: unknown) => void): (() => void) => {
    const rec: Rec = { onNext, onError, unsubbed: false };
    calls.push(rec);
    return () => {
      rec.unsubbed = true;
    };
  };
  const at = (index: number): Rec => {
    const rec = calls[index];
    if (rec === undefined) throw new Error(`no attach #${index}`);
    return rec;
  };
  return { attach, calls, at, last: () => at(calls.length - 1) };
}

describe('isRetryable', () => {
  it('accepts the transient auth/rules codes and rejects the rest', () => {
    expect(isRetryable({ code: 'permission-denied' })).toBe(true);
    expect(isRetryable({ code: 'unauthenticated' })).toBe(true);
    expect(isRetryable({ code: 'unavailable' })).toBe(true);
    expect(isRetryable({ code: 'not-found' })).toBe(false);
    expect(isRetryable(new Error('boom'))).toBe(false);
    expect(isRetryable('nope')).toBe(false);
    expect(isRetryable(null)).toBe(false);
  });
});

describe('withRetry', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('re-attaches after a transient denial and then delivers the snapshot', () => {
    const fake = fakeAttach();
    const snaps: string[] = [];
    const errors: unknown[] = [];
    withRetry(
      fake.attach,
      (s) => snaps.push(s),
      (e) => errors.push(e),
    );

    expect(fake.calls).toHaveLength(1);
    fake.at(0).onError({ code: 'permission-denied' });
    expect(fake.at(0).unsubbed).toBe(true); // the dead listener is torn down before retrying

    vi.advanceTimersByTime(400);
    expect(fake.calls).toHaveLength(2); // re-attached
    fake.at(1).onNext('tasks');

    expect(snaps).toEqual(['tasks']);
    expect(errors).toEqual([]);
  });

  it('surfaces a non-retryable error immediately without re-attaching', () => {
    const fake = fakeAttach();
    const errors: unknown[] = [];
    withRetry(
      fake.attach,
      () => undefined,
      (e) => errors.push(e),
    );

    fake.at(0).onError({ code: 'not-found' });
    vi.advanceTimersByTime(5000);

    expect(fake.calls).toHaveLength(1);
    expect(errors).toEqual([{ code: 'not-found' }]);
  });

  it('surfaces the error past the burst yet keeps re-attaching, and recovers on a good snapshot', () => {
    const fake = fakeAttach();
    const snaps: string[] = [];
    const errors: unknown[] = [];
    withRetry(
      fake.attach,
      (s) => snaps.push(s),
      (e) => errors.push(e),
    );

    // 1 initial attach + 5 retries = 6 attempts; the 6th denial surfaces the error but still retries.
    for (let i = 0; i < 6; i += 1) {
      fake.last().onError({ code: 'permission-denied' });
      vi.advanceTimersByTime(5000);
    }
    expect(errors).toEqual([{ code: 'permission-denied' }]); // surfaced once, past the budget
    expect(fake.calls.length).toBeGreaterThan(6); // still re-attaching, not given up

    // Access is granted a moment later: a healthy snapshot recovers the subscription.
    fake.last().onNext('data');
    expect(snaps).toEqual(['data']);
  });

  it('stops retrying once unsubscribed', () => {
    const fake = fakeAttach();
    const errors: unknown[] = [];
    const cancel = withRetry(
      fake.attach,
      () => undefined,
      (e) => errors.push(e),
    );

    fake.at(0).onError({ code: 'permission-denied' });
    cancel();
    vi.advanceTimersByTime(5000);

    expect(fake.calls).toHaveLength(1); // no re-attach after cancel
    expect(errors).toEqual([]);
  });
});
