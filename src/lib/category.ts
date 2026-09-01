/**
 * Categories are authored with a leading emoji (e.g. "🗣️ Mluva") so the picker and
 * source spreadsheet stay readable. The compact "Kategorie: …" chip drops it to the
 * bare name; if a category is nothing but an emoji we keep the original (spec 9.2).
 */
export function categoryLabel(category: string): string {
  const stripped = category.replace(/^[^\p{L}\p{N}]+/u, '').trim();
  return stripped.length > 0 ? stripped : category;
}
