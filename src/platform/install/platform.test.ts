import { describe, expect, it } from 'vitest';

import { detectInstallPlatform, isIosNonSafari } from './platform';

// Representative user agents (trimmed) for the current mobile/desktop browsers.
const UA = {
  android:
    'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36',
  iphoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
  iphoneChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/130 Mobile/15E148 Safari/604.1',
  iphoneInApp:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 340.0',
  ipadOsAsMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15',
  macDesktop:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15',
  windowsChrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36',
} as const;

describe('detectInstallPlatform', () => {
  it('detects Android', () => {
    expect(detectInstallPlatform(UA.android, 5)).toBe('android');
  });

  it('detects an iPhone', () => {
    expect(detectInstallPlatform(UA.iphoneSafari, 5)).toBe('ios');
  });

  it('treats a touch Mac UA (iPadOS 13+) as iOS', () => {
    expect(detectInstallPlatform(UA.ipadOsAsMac, 5)).toBe('ios');
  });

  it('treats a real Mac (no touch) as other', () => {
    expect(detectInstallPlatform(UA.macDesktop, 0)).toBe('other');
  });

  it('treats desktop Chrome as other', () => {
    expect(detectInstallPlatform(UA.windowsChrome, 0)).toBe('other');
  });
});

describe('isIosNonSafari', () => {
  it('flags Chrome on iOS', () => {
    expect(isIosNonSafari(UA.iphoneChrome)).toBe(true);
  });

  it('flags an in-app browser on iOS', () => {
    expect(isIosNonSafari(UA.iphoneInApp)).toBe(true);
  });

  it('does not flag Safari on iOS', () => {
    expect(isIosNonSafari(UA.iphoneSafari)).toBe(false);
  });

  it('does not flag non-iOS browsers', () => {
    expect(isIosNonSafari(UA.android)).toBe(false);
    expect(isIosNonSafari(UA.windowsChrome)).toBe(false);
  });
});
