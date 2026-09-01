import { type ButtonHTMLAttributes } from 'react';

import { cx } from '../lib/cx';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'default' | 'icon';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-white',
  secondary: 'border border-border bg-surface-raised text-content',
  danger: 'bg-danger text-white',
  ghost: 'text-content',
};

/**
 * `default` keeps the 44px comfortable tap target; `icon` is a compact 36px square — a single glyph
 * like "+", matching the height of a list-toolbar `Select` (which is also 36px).
 */
const SIZES: Record<Size, string> = {
  default: 'tap-target px-4 py-2 text-sm',
  icon: 'h-9 w-9 text-lg leading-none',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = 'primary',
  size = 'default',
  className,
  type,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium',
        'transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
