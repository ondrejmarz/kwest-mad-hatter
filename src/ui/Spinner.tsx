export function Spinner({ label }: { label?: string }) {
  return (
    <span
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-2 text-content-muted"
    >
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent motion-reduce:animate-none" />
      {label}
    </span>
  );
}
