import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

/**
 * Firebase bootstrap (spec 1, 15.2). Firestore uses a persistent, multi-tab cache so
 * the app stays reactive and offline-capable. In emulator mode we use a fixed demo
 * project id matching the seed and rules tests; the cloud config comes from `.env`.
 */
const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';

const firebaseConfig = useEmulators
  ? {
      apiKey: 'demo-api-key',
      authDomain: 'demo-tabor.firebaseapp.com',
      projectId: 'demo-tabor',
      appId: 'demo-app-id',
    }
  : {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

export const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

export const auth = getAuth(app);

if (useEmulators) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}
