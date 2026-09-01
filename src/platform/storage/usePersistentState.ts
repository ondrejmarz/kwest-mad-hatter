import { useCallback, useState } from 'react';

/**
 * `useState` mirrored to `localStorage` under `key`, so a list's sort and filter choices survive
 * a reload and navigation (spec 9). Best-effort: storage can be unavailable (private mode), so
 * every read and write is guarded. The setter takes a value (no updater form), which is all the
 * list controls need.
 */
export function usePersistentState<T>(key: string, initial: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });

  const set = useCallback(
    (value: T) => {
      setState(value);
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Persisting the preference is best-effort.
      }
    },
    [key],
  );

  return [state, set];
}
