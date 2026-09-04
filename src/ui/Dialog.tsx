import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { useTranslation } from '../i18n/LocaleProvider';

/**
 * Centered modal dialog — the shared surface for every dialog in the app (a code prompt, a player
 * detail, a task/reward action). Closes on backdrop click, Escape, and a ✕ in the top-right — the
 * same dismiss control the pair invites use (spec 15.8), so every dialog carries a visible way out.
 * The panel keeps clear of the top/bottom safe-area insets. It is deliberately a touch wider than
 * the list cards it floats over (`max-w-lg` panel vs. the `max-w-lg` content column's inner card
 * width, plus a slim `px-2` backdrop so it still overhangs the cards on a phone) — every dialog
 * stays the same width.
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
      className="safe-top safe-bottom fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-2 py-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title ?? ariaLabel}
        className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface-raised p-5 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        {/* A header row so the ✕ sits top-right whether or not there is a visible title (`ml-auto`
            pushes it to the wall) — matching the pair-invite dismiss control. */}
        <div className="mb-3 flex items-start gap-3">
          {title !== undefined && <h2 className="text-lg font-semibold text-content">{title}</h2>}
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={onClose}
            className="-mr-1 -mt-1 ml-auto shrink-0 rounded-lg px-2 text-lg leading-none text-content-muted"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
