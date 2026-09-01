import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import { buildSeedDocuments, seedSummary } from './documents.ts';

/**
 * Seeds the REAL cloud Firestore with the demo turnus and catalog, via firebase-admin.
 * The admin SDK bypasses security rules with a service-account credential, so the
 * locked-down rules stay intact. Run with `npm run seed:cloud`.
 *
 * Needs a service-account key JSON (Firebase console -> Project settings ->
 * Service accounts -> Generate new private key). Point at it with the
 * GOOGLE_APPLICATION_CREDENTIALS env var, or drop it at `service-account.json`
 * in the repo root (gitignored).
 */
const here = dirname(fileURLToPath(import.meta.url));
const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ?? join(here, '..', 'service-account.json');

async function main(): Promise<void> {
  if (!existsSync(keyPath)) {
    throw new Error(
      `Service-account key not found at "${keyPath}". Generate one in the Firebase console ` +
        `(Project settings -> Service accounts -> Generate new private key) and save it as ` +
        `service-account.json in the repo root, or set GOOGLE_APPLICATION_CREDENTIALS.`,
    );
  }

  const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8')) as {
    project_id: string;
  };
  initializeApp({ credential: cert(keyPath) });

  const db = getFirestore();
  const documents = buildSeedDocuments();

  // Firestore batches cap at 500 writes; chunk to stay safe as the catalog grows.
  for (let i = 0; i < documents.length; i += 400) {
    const batch = db.batch();
    for (const { path, data } of documents.slice(i, i + 400)) {
      batch.set(db.doc(path), data);
    }
    await batch.commit();
  }

  console.log(`Seeded ${seedSummary(documents)} into project "${serviceAccount.project_id}".`);
}

main().catch((error: unknown) => {
  console.error('Cloud seed failed:', error);
  process.exitCode = 1;
});
