import { readFileSync } from 'node:fs';

import { assertFails, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc } from 'firebase/firestore';
import { afterAll, beforeAll, describe, it } from 'vitest';

/**
 * Phase-0 rules are deny-all. These tests prove the emulator + test harness work
 * and that access is closed by default. Phase 2 replaces them with the real,
 * adversarial ruleset (spec 15.10).
 */
let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-tabor',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('phase-0 deny-all rules', () => {
  it('denies an unauthenticated read', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'turnuses/anything')));
  });

  it('denies an authenticated read', async () => {
    const db = testEnv.authenticatedContext('user-1').firestore();
    await assertFails(getDoc(doc(db, 'players/anything')));
  });
});
