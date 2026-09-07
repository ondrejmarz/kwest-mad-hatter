import { type ReactNode } from 'react';

/** A titled section on the profile (spec 9). The shared "card = preview + optional dialog" frame. */
export function ProfileCard({
  title,
  action,
  children,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface-raised p-4">
      {(title !== undefined || action !== undefined) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title !== undefined && <h2 className="font-semibold text-content">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
