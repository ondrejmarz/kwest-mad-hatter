import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * The domain layer must stay framework-free (spec 15.3 / 15.5). This scans every
 * file under src/domain and fails if any imports React or Firebase. It complements
 * the eslint-plugin-boundaries `external` rule with a second, independent guard.
 */
const DOMAIN_DIR = join(process.cwd(), 'src', 'domain');

const FORBIDDEN: readonly { label: string; pattern: RegExp }[] = [
  { label: 'react', pattern: /from\s+['"]react(['"/]|-dom)/ },
  { label: 'firebase', pattern: /from\s+['"]@?firebase/ },
];

function collectSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if (full.endsWith('.ts') || full.endsWith('.tsx')) {
      files.push(full);
    }
  }
  return files;
}

describe('domain purity', () => {
  const files = collectSourceFiles(DOMAIN_DIR);

  it('finds domain source to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s imports neither React nor Firebase', (file) => {
    const source = readFileSync(file, 'utf8');
    for (const { label, pattern } of FORBIDDEN) {
      expect(pattern.test(source), `${file} must not import ${label}`).toBe(false);
    }
  });
});
