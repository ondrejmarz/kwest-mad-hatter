import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Bottom sheet — the primary mobile pattern for detail and form surfaces (spec 15.8).
 * Closes on backdrop click and Escape; the panel respects the bottom safe-area inset.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="safe-bottom w-full max-w-lg rounded-t-2xl border-t border-border bg-surface-raised p-4"
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
