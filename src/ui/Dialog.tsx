import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Centered modal dialog — the surface for short focused prompts such as entering an
 * access code (turnus login or the hidden admin unlock). Closes on backdrop click and
 * Escape; the panel keeps clear of the top/bottom safe-area insets.
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
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="safe-top safe-bottom fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title ?? ariaLabel}
        className="w-full max-w-sm rounded-2xl border border-border bg-surface-raised p-5 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        {title !== undefined && (
          <h2 className="mb-3 text-lg font-semibold text-content">{title}</h2>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
