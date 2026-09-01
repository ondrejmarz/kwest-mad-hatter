import { type InputHTMLAttributes } from 'react';

import { cx } from '../lib/cx';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function TextInput({ label, className, ...props }: TextInputProps) {
  return (
    <label className="block">
      {label !== undefined && (
        <span className="mb-1 block text-sm font-medium text-content-muted">{label}</span>
      )}
      <input
        className={cx(
          'tap-target w-full rounded-xl border border-border bg-surface px-3 py-2 text-content',
          'outline-none placeholder:text-content-muted focus:border-accent',
          className,
        )}
        {...props}
      />
    </label>
  );
}
