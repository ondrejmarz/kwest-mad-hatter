import type { Config } from 'tailwindcss';

/**
 * Semantic design tokens only (spec 15.8). Components must never reference raw
 * palette colors like `bg-blue-500`. Colors are backed by CSS custom properties
 * (see src/index.css) so a dark theme can be added later by swapping variables,
 * without touching component code.
 *
 * Token -> utility mapping:
 *   surface        -> bg-surface
 *   surface-raised -> bg-surface-raised
 *   border         -> border-border
 *   text           -> text-content
 *   text-muted     -> text-content-muted
 *   accent, danger, warning, success, coin -> bg-x, text-x, border-x
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-raised': 'rgb(var(--color-surface-raised) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        content: {
          DEFAULT: 'rgb(var(--color-text) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
        },
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        coin: 'rgb(var(--color-coin) / <alpha-value>)',
      },
    },
  },
  plugins: [],
} satisfies Config;
