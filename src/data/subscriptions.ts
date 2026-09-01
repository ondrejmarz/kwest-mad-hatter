import {
  type DocumentData,
  type DocumentReference,
  onSnapshot,
  type Query,
} from 'firebase/firestore';

/**
 * Uniform shape every provider exposes (spec 15.7). `fromCache` is propagated so the UI
 * can tell the user they are looking at yesterday's data.
 */
export type Subscription<T> =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly error: unknown }
  | { readonly status: 'ready'; readonly data: T; readonly fromCache: boolean };

type Parse<T> = (id: string, data: DocumentData) => T | null;

/** `serverTimestamps: 'estimate'` gives a just-written pending timestamp a local value. */
const dataOf = (snap: {
  data: (options?: { serverTimestamps: 'estimate' }) => DocumentData | undefined;
}): DocumentData => snap.data({ serverTimestamps: 'estimate' }) ?? {};

/** Subscribe to a single document; `data` is null when it does not exist. */
export function subscribeDoc<T>(
  ref: DocumentReference,
  parse: Parse<T>,
  onState: (state: Subscription<T | null>) => void,
): () => void {
  return onSnapshot(
    ref,
    (snap) => {
      const data = snap.exists() ? parse(snap.id, dataOf(snap)) : null;
      onState({ status: 'ready', data, fromCache: snap.metadata.fromCache });
    },
    (error) => onState({ status: 'error', error }),
  );
}

/** Subscribe to a query; documents that fail validation are logged and skipped (spec 15.6). */
export function subscribeQuery<T>(
  query: Query,
  parse: Parse<T>,
  onState: (state: Subscription<readonly T[]>) => void,
): () => void {
  return onSnapshot(
    query,
    (snap) => {
      const data = snap.docs
        .map((docSnap) => parse(docSnap.id, dataOf(docSnap)))
        .filter((value): value is T => value !== null);
      onState({ status: 'ready', data, fromCache: snap.metadata.fromCache });
    },
    (error) => onState({ status: 'error', error }),
  );
}
