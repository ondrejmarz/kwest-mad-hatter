import { describe, expect, it } from 'vitest';

import { err, isErr, isOk, ok } from '../../src/lib/result';

describe('Result', () => {
  it('ok wraps a value and narrows', () => {
    const result = ok(42);
    expect(isOk(result)).toBe(true);
    expect(isErr(result)).toBe(false);
    if (result.ok) {
      expect(result.value).toBe(42);
    }
  });

  it('err wraps an error and narrows', () => {
    const result = err('boom');
    expect(isErr(result)).toBe(true);
    expect(isOk(result)).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('boom');
    }
  });
});
