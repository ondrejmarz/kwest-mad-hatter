/**
 * Captures Chrome/Chromium's `beforeinstallprompt` the moment it fires — which is often before
 * React has mounted the install banner — and stashes the deferred event so an Install button can
 * replay it on demand. Modern Chrome no longer shows an automatic install banner, so replaying
 * this captured event is the only reliable way to raise the real OS install dialog. iOS never
 * fires it. A React-free external store in the mould of `useOnlineStatus`; the hook subscribes
 * through `useSyncExternalStore`, so the listeners are attached once at module load.
 */

/** The non-standard event Chromium dispatches; not in the DOM lib types, so declared here. */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: readonly string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

export interface InstallCaptureState {
  /** A native install prompt is captured and can be replayed (Android/Chromium only). */
  readonly canPrompt: boolean;
  /** The app was installed during this session — hide the banner right away. */
  readonly installed: boolean;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
// A stable snapshot object: `useSyncExternalStore` requires `getSnapshot` to return an identical
// reference until something actually changes, so it is only rebuilt inside `update`.
let snapshot: InstallCaptureState = { canPrompt: false, installed: false };
const listeners = new Set<() => void>();

function update(next: InstallCaptureState): void {
  snapshot = next;
  for (const listener of listeners) listener();
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event: Event) => {
    // Suppress Chrome's own mini-infobar so our banner is the single install surface.
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    update({ ...snapshot, canPrompt: true });
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    update({ canPrompt: false, installed: true });
  });
}

export function subscribeInstallCapture(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getInstallCapture(): InstallCaptureState {
  return snapshot;
}

/**
 * Replay the captured install prompt (the real OS dialog) and resolve with the user's choice, or
 * `'unavailable'` when there is nothing to replay (already used, iOS, or not yet installable). The
 * deferred event may be prompted only once, so it is dropped as soon as we start — which also
 * hides the Install button.
 */
export async function promptInstall(): Promise<InstallOutcome> {
  const event = deferredPrompt;
  if (event === null) return 'unavailable';
  deferredPrompt = null;
  update({ ...snapshot, canPrompt: false });
  await event.prompt();
  const choice = await event.userChoice;
  return choice.outcome;
}
