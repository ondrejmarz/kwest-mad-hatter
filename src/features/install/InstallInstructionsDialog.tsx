import { type ReactNode } from 'react';

import { useTranslation } from '../../i18n/LocaleProvider';
import { useInstallPrompt } from '../../platform/install/useInstallPrompt';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';

/**
 * How to add the app to the home screen, tailored to the device. iOS gets Safari's
 * Share → Add to Home Screen walkthrough (the only route Apple offers); Android and desktop get
 * the manual browser-menu steps as a fallback for when the automatic prompt doesn't appear
 * (e.g. Firefox). When a native prompt is actually captured, the dialog just offers the button.
 */
export function InstallInstructionsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { platform, canPrompt, iosNeedsSafari, promptInstall } = useInstallPrompt();

  return (
    <Dialog open={open} onClose={onClose} title={t('install.dialogTitle')}>
      {canPrompt ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-content-muted">{t('install.nativeIntro')}</p>
          <Button
            onClick={() => {
              void promptInstall().finally(onClose);
            }}
          >
            {t('install.installButton')}
          </Button>
        </div>
      ) : platform === 'ios' ? (
        <IosSteps needsSafari={iosNeedsSafari} />
      ) : platform === 'android' ? (
        <AndroidSteps />
      ) : (
        <OtherSteps />
      )}
      <div className="mt-5 flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          {t('common.close')}
        </Button>
      </div>
    </Dialog>
  );
}

/**
 * One numbered instruction, with an optional glyph mimicking the button the user must tap. Rows are
 * top-aligned and the text sits in a badge-height line box (`leading-7`), so a step that wraps to
 * two lines keeps its gap to the neighbouring steps even — matching the single-line ones.
 */
function Step({ n, icon, children }: { n: number; icon?: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
        {n}
      </span>
      {icon !== undefined && (
        <span className="flex h-7 shrink-0 items-center text-content">{icon}</span>
      )}
      <span className="text-sm leading-7 text-content">{children}</span>
    </li>
  );
}

function IosSteps({ needsSafari }: { needsSafari: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3">
      {needsSafari && (
        <p className="rounded-xl bg-warning/15 px-3 py-2 text-sm text-warning">
          {t('install.ios.notSafari')}
        </p>
      )}
      <p className="text-sm text-content-muted">{t('install.ios.intro')}</p>
      <ol className="flex flex-col gap-3">
        <Step n={1} icon={<MenuDotsHorizontalIcon />}>
          {t('install.ios.step1')}
        </Step>
        <Step n={2} icon={<ShareIosIcon />}>
          {t('install.ios.step2')}
        </Step>
        <Step n={3} icon={<AddToHomeIcon />}>
          {t('install.ios.step3')}
        </Step>
        <Step n={4}>{t('install.ios.step4')}</Step>
      </ol>
      <p className="text-xs text-content-muted">{t('install.ios.shareNote')}</p>
    </div>
  );
}

function AndroidSteps() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-content-muted">{t('install.android.intro')}</p>
      <ol className="flex flex-col gap-3">
        <Step n={1} icon={<MenuDotsIcon />}>
          {t('install.android.step1')}
        </Step>
        <Step n={2} icon={<AddToHomeIcon />}>
          {t('install.android.step2')}
        </Step>
        <Step n={3}>{t('install.android.step3')}</Step>
      </ol>
    </div>
  );
}

function OtherSteps() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-content-muted">{t('install.other.intro')}</p>
      <ol className="flex flex-col gap-3">
        <Step n={1} icon={<MenuDotsIcon />}>
          {t('install.other.step1')}
        </Step>
        <Step n={2} icon={<AddToHomeIcon />}>
          {t('install.other.step2')}
        </Step>
      </ol>
    </div>
  );
}

const ICON = 'h-5 w-5';

/** iOS Share glyph: a box with an arrow lifting out of the top. */
function ShareIosIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={ICON}
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="M8 7l4-4 4 4" />
      <path d="M6 12H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-1" />
    </svg>
  );
}

/** Add-to-home glyph: a rounded square with a plus, matching the menu item's icon. */
function AddToHomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={ICON}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

/** The browser's overflow menu (Android/desktop): three stacked dots. */
function MenuDotsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={ICON} aria-hidden="true">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}

/** Safari's bottom-right "more" button on iPhone: three dots in a row. */
function MenuDotsHorizontalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={ICON} aria-hidden="true">
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}
