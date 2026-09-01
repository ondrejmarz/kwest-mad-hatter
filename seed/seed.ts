import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, type Firestore } from 'firebase/firestore';

import { buildSeedDocuments, seedSummary } from './documents.ts';

/**
 * Seeds the Firestore emulator with a demo turnus and fictional catalog.
 * Uses the rules-unit-testing "security rules disabled" context so no
 * firebase-admin dependency is needed. Run via `npm run seed` (or automatically
 * as part of `npm run dev`). For the real cloud project use `npm run seed:cloud`.
 */
const PROJECT_ID = 'demo-tabor';
const HOST = '127.0.0.1';
const PORT = 8080;

const here = dirname(fileURLToPath(import.meta.url));

async function waitForEmulator(): Promise<void> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      await fetch(`http://${HOST}:${PORT}/`);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error(`Firestore emulator not reachable at ${HOST}:${PORT}`);
}

async function main(): Promise<void> {
  await waitForEmulator();
  const documents = buildSeedDocuments();

  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: HOST,
      port: PORT,
      rules: readFileSync(join(here, '..', 'firestore.rules'), 'utf8'),
    },
  });

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore() as unknown as Firestore;
    await Promise.all(documents.map(({ path, data }) => setDoc(doc(db, path), data)));
  });
  await testEnv.cleanup();

  console.log(`Seeded ${seedSummary(documents)}.`);
}

main().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});
