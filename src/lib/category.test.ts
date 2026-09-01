import { describe, expect, it } from 'vitest';

import { categoryLabel } from './category';

describe('categoryLabel', () => {
  it('drops a leading emoji (and its spacing) from the category name', () => {
    expect(categoryLabel('🗣️ Mluva')).toBe('Mluva');
    expect(categoryLabel('💪 Výdrž')).toBe('Výdrž');
  });

  it('leaves a plain name untouched', () => {
    expect(categoryLabel('Ostatní')).toBe('Ostatní');
  });

  it('keeps the original when it is nothing but an emoji', () => {
    expect(categoryLabel('🎭')).toBe('🎭');
  });
});
