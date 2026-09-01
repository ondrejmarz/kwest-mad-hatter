/**
 * Non-reactive connectivity check for transaction guards (spec 15.6). Firestore
 * transactions always fail offline, so every transaction bails out early with a clear
 * error; the UI also disables the trigger up front. Kept React-free so `data/` can use it.
 */
export function isOnline(): boolean {
  return navigator.onLine;
}
