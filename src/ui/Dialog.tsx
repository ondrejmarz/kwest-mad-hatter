import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { useTranslation } from '../i18n/LocaleProvider';

/**
 * Centered modal dialog — the shared surface for every dialog in the app (a code prompt, a player
 * detail, a task/reward action). It closes on Escape, on a click anywhere in the dim outside the
 * panel, and on the round ✕ button that sits just below the panel — one dismiss control for the whole
 * app (no per-panel corner ✕). The panel is top-anchored so a tall dialog rides up over the app-name
 * header (never the whole header) instead of overflowing, and scrolls inside itself; the ✕ stays put
 * right beneath it. The page behind is locked so only the dialog scrolls (spec 15.8).
 */
export function Dialog({
  open,
  onClose,
  title,
  ariaLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Accessible name when no visible `title` is rendered (the panel draws its own header). */
  ariaLabel?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    // Lock the page behind the modal so only the dialog scrolls (spec 15.8).
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-black/40 px-2"
      // Centered when it fits; a full-height dialog fills the space (capped by the panel's max-height)
      // and so rides up to just below the safe area, covering the app name but not the header's top
      // edge. The bottom inset keeps the ✕ off the home indicator.
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
      }}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title ?? ariaLabel}
        className="w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface-raised p-5 shadow-lg"
        // Cap the panel so the ✕ below it always stays on screen; the panel itself scrolls.
        style={{
          maxHeight: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 6rem)',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {title !== undefined && (
          <h2 className="mb-3 text-lg font-semibold text-content">{title}</h2>
        )}
        {children}
      </div>
      {/* The one dismiss control: a round ✕ hugging the bottom of the panel, so people learn to
          reach for it. The dim around it also closes (the presentation div above). */}
      <button
        type="button"
        aria-label={t('common.close')}
        onClick={onClose}
        className="mt-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface-raised text-lg leading-none text-content-muted shadow-lg"
      >
        ✕
      </button>
    </div>,
    document.body,
  );
}
