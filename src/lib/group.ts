/** A group-size interval as a compact label: "2" when exact, "2–4" when a range (spec 9.2). */
export function formatGroupSize(min: number, max: number): string {
  return min === max ? String(min) : `${min}–${max}`;
}
