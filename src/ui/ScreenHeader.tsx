import { type ReactNode } from 'react';

export function ScreenHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h1 className="text-xl font-semibold text-content">{title}</h1>
      {action}
    </div>
  );
}
