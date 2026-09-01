type ClassValue = string | number | false | null | undefined;

/** Minimal className joiner — intentionally avoids a clsx dependency. */
export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
