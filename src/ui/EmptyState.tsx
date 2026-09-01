import { type ReactNode } from 'react';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-8 text-center">
      <p className="text-base font-medium text-content">{title}</p>
      {description ? <p className="text-sm text-content-muted">{description}</p> : null}
      {action}
    </div>
  );
}
