import { usePersistentState } from '../../platform/storage/usePersistentState';

/**
 * The answered invite cards this device has hidden with their ✕ (spec 7). Kept in localStorage, so a
 * hidden card stays hidden after a reload. Each card's key carries its answer, so a card that changes
 * shows up again. Dismissing prunes the keys of cards that are gone, so the list never grows.
 */
export function useDismissedInvites(storageKey: string): {
  isDismissed: (key: string) => boolean;
  dismiss: (key: string, liveKeys: readonly string[]) => void;
} {
  const [dismissed, setDismissed] = usePersistentState<readonly string[]>(storageKey, []);
  return {
    isDismissed: (key) => dismissed.includes(key),
    dismiss: (key, liveKeys) =>
      setDismissed([...dismissed.filter((kept) => liveKeys.includes(kept)), key]),
  };
}
