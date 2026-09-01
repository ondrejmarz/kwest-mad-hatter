import { readJson, remove, writeJson } from './storage';

/**
 * The turnus a device last entered (spec 3a). Persisted so a returning device goes
 * straight in; cleared by "switch turnus". Also recoverable from the `/t/{slug}` URL,
 * so a wipe (iOS clears PWA data after ~7 days) never strands the user (spec 12).
 */
export interface RememberedTurnus {
  readonly id: string;
  readonly slug: string;
}

const KEY = 'turnus';

export function readRememberedTurnus(): RememberedTurnus | null {
  const value = readJson<RememberedTurnus>(KEY);
  if (value && typeof value.id === 'string' && typeof value.slug === 'string') {
    return { id: value.id, slug: value.slug };
  }
  return null;
}

export function writeRememberedTurnus(turnus: RememberedTurnus): void {
  writeJson(KEY, turnus);
}

export function clearRememberedTurnus(): void {
  remove(KEY);
}
