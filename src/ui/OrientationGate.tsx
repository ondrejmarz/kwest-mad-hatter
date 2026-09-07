import { useTranslation } from '../i18n/LocaleProvider';

/**
 * A "turn your phone upright" overlay. The manifest already pins the installed PWA to portrait, but
 * in a browser we can't lock orientation — so on a phone held in landscape this covers the app and
 * asks for portrait (spec 15). Visibility is pure CSS (`.orientation-gate`, see `index.css`): shown
 * only on a short, coarse-pointer landscape viewport, hidden everywhere else.
 */
export function OrientationGate() {
  const { t } = useTranslation();
  return (
    <div className="orientation-gate fixed inset-0 z-[100] items-center justify-center bg-surface p-8">
      <p className="text-center text-lg font-semibold text-content">{t('common.rotateDevice')}</p>
    </div>
  );
}
