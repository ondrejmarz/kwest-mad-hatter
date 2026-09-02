import { useSyncExternalStore } from 'react';

import {
  getInstallCapture,
  promptInstall as replayInstallPrompt,
  subscribeInstallCapture,
  type InstallOutcome,
} from './beforeInstallPrompt';
import {
  detectInstallPlatform,
  isIosNonSafari,
  isRunningStandalone,
  type InstallPlatform,
} from './platform';

export interface InstallPromptState {
  platform: InstallPlatform;
  /** Already installed (running standalone) — the banner should stay hidden. */
  isStandalone: boolean;
  /** iOS opened outside Safari, where Add to Home Screen is unavailable. */
  iosNeedsSafari: boolean;
  /** A native install prompt can be replayed (Android/Chromium). */
  canPrompt: boolean;
  /** The app was installed during this session. */
  installed: boolean;
  /** Raise the real OS install dialog; resolves with the user's choice. */
  promptInstall: () => Promise<InstallOutcome>;
}

/**
 * The install context for the add-to-home-screen banner. The capture flags come from the
 * live external store; the environment reads (platform, standalone, in-app browser) don't change
 * within a session, so they are computed each render rather than subscribed.
 */
export function useInstallPrompt(): InstallPromptState {
  const capture = useSyncExternalStore(
    subscribeInstallCapture,
    getInstallCapture,
    getInstallCapture,
  );
  return {
    platform: detectInstallPlatform(),
    isStandalone: isRunningStandalone(),
    iosNeedsSafari: isIosNonSafari(),
    canPrompt: capture.canPrompt,
    installed: capture.installed,
    promptInstall: replayInstallPrompt,
  };
}
