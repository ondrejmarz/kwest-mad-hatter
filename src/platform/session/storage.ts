/**
 * Versioned localStorage helpers (spec 15.13). The version prefix lets us migrate
 * or invalidate persisted keys without wiping unrelated data.
 */
const PREFIX = 'tabor.v1.';

export function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Persisting is best-effort (storage may be full or unavailable).
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // best-effort
  }
}
