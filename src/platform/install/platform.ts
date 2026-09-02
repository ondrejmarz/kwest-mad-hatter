/**
 * PWA install-context detection for the add-to-home-screen flow. Kept React-free and side-effect
 * free so the install hook (and any guard) can read it; the functions only inspect the browser
 * environment. The user-agent and touch-point arguments default to the live values but are
 * injectable so the branch logic can be unit-tested without a DOM.
 */

export type InstallPlatform = 'ios' | 'android' | 'other';

/**
 * Which install flow applies. Android/Chromium fire `beforeinstallprompt`, so they get a real
 * Install button; iOS has no such event and needs the manual Share → Add to Home Screen guide.
 * iPadOS 13+ reports a desktop-Safari user agent ("Macintosh"), so a Mac UA with a touch screen
 * is treated as iOS.
 */
export function detectInstallPlatform(
  userAgent: string = navigator.userAgent,
  maxTouchPoints: number = navigator.maxTouchPoints,
): InstallPlatform {
  if (/android/i.test(userAgent)) return 'android';
  const isIos =
    /iphone|ipad|ipod/i.test(userAgent) || (/macintosh/i.test(userAgent) && maxTouchPoints > 1);
  return isIos ? 'ios' : 'other';
}

/**
 * True when the app is already running as an installed PWA, so there is nothing to offer.
 * Android/desktop match `display-mode: standalone`; iOS Safari instead sets the legacy
 * `navigator.standalone`.
 */
export function isRunningStandalone(): boolean {
  const displayStandalone =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return displayStandalone || iosStandalone;
}

/**
 * On iOS the "Add to Home Screen" item lives only in Safari's own Share sheet — third-party
 * browsers (Chrome `CriOS`, Firefox `FxiOS`, Edge `EdgiOS`, Opera `OPiOS`) and in-app webviews
 * (Instagram, Facebook/Messenger, Line) hide it. Used to tell the user to reopen the link in
 * Safari. Non-iOS always returns false.
 */
export function isIosNonSafari(userAgent: string = navigator.userAgent): boolean {
  if (detectInstallPlatform(userAgent) !== 'ios') return false;
  return /crios|fxios|edgios|opios|fban|fbav|instagram|line\//i.test(userAgent);
}
