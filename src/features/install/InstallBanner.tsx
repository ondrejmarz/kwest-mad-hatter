import { useState } from 'react';

import { useTranslation } from '../../i18n/LocaleProvider';
import { useInstallPrompt } from '../../platform/install/useInstallPrompt';
import { Button } from '../../ui/Button';

import { InstallInstructionsDialog } from './InstallInstructionsDialog';

/**
 * Add-to-home-screen nudge on the entry screen, where a player first opens the shared link.
 * Hidden once the app runs installed. On Android/Chromium the button replays the captured
 * native install prompt (the real OS dialog); on iOS — which has no such event — it opens the
 * platform how-to. Dismissible for the session; it reappears on the next visit to the entry
 * screen, which is rare once a player has joined a group.
 */
export function InstallBanner() {
  const { t } = useTranslation();
  const { isStandalone, installed, canPrompt, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);
  const [showHow, setShowHow] = useState(false);

  if (isStandalone || installed || dismissed) return null;

  const onInstall = (): void => {
    if (canPrompt) {
      void promptInstall();
    } else {
      setShowHow(true);
    }
  };

  return (
    <div className="px-6 pt-4">
      {/* Same shape as the pair-invite cards (InviteBanner): the ✕ sits top-right, and the action
          sits on its own full-width row below so it reaches the right wall, under the ✕. */}
      <div className="rounded-2xl border border-border bg-surface-raised p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <img
            src="/pwa-192x192.png"
            alt=""
            aria-hidden="true"
            className="h-10 w-10 shrink-0 rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-content">{t('install.title')}</p>
            <p className="mt-0.5 text-sm text-content-muted">{t('install.subtitle')}</p>
          </div>
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={() => setDismissed(true)}
            className="-mr-1 -mt-1 shrink-0 rounded-lg px-2 text-lg leading-none text-content-muted"
          >
            ✕
          </button>
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={onInstall}>
            {canPrompt ? t('install.installButton') : t('install.howToButton')}
          </Button>
        </div>
      </div>
      <InstallInstructionsDialog open={showHow} onClose={() => setShowHow(false)} />
    </div>
  );
}
