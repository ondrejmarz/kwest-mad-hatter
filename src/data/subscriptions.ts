import {
  type DocumentData,
  type DocumentReference,
  type DocumentSnapshot,
  onSnapshot,
  type Query,
  type QuerySnapshot,
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

// A listener attached in the sliver before Firebase Auth has handed Firestore the anonymous token
// (or before a freshly written membership is visible to the rules) is rejected once and then NEVER
// retried by the SDK — which is what left every member-only screen showing "something went wrong"
// until the user left the turnus and rejoined. We re-attach with a short backoff. A retryable denial
// keeps re-attaching (capped backoff) rather than giving up for good, because it usually clears on
// its own — the anonymous token lands, or a just-written membership (e.g. unlocking admin) becomes
// visible to the rules a moment later. The error is still surfaced after the first burst so a truly
// stuck read is not hidden behind an endless spinner, but a later healthy snapshot recovers it.
const RETRYABLE_CODES = new Set([
  'permission-denied',
  'unauthenticated',
  'unavailable',
  'cancelled',
]);
const MAX_RETRIES = 5;
const RETRY_BASE_MS = 350;
const MAX_BACKOFF_MS = 5000;

export function isRetryable(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string' &&
    RETRYABLE_CODES.has((error as { code: string }).code)
  );
}

/**
 * Wrap an `onSnapshot` attachment so a transient, retryable denial re-attaches instead of turning
 * into a permanent error. A healthy snapshot resets the retry budget; a lasting denial still
 * surfaces once the budget is spent, so genuinely forbidden reads are not hidden.
 */
export function withRetry<S>(
  attach: (onNext: (snap: S) => void, onError: (error: unknown) => void) => () => void,
  onSnap: (snap: S) => void,
  onError: (error: unknown) => void,
): () => void {
  let cancelled = false;
  let unsubscribe: () => void = () => {};
  let attempts = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const start = (): void => {
    unsubscribe = attach(
      (snap) => {
        attempts = 0;
        onSnap(snap);
      },
      (error) => {
        unsubscribe();
        if (cancelled) return;
        if (isRetryable(error)) {
          attempts += 1;
          // Surface the error once the first burst is spent, but keep re-attaching — access often
          // becomes permitted shortly after (token/membership propagation), and a healthy snapshot
          // then resets `attempts` and recovers the subscription without a reload.
          if (attempts > MAX_RETRIES) onError(error);
          timer = setTimeout(start, Math.min(RETRY_BASE_MS * attempts, MAX_BACKOFF_MS));
        } else {
          onError(error);
        }
      },
    );
  };

  start();
  return () => {
    cancelled = true;
    if (timer !== undefined) clearTimeout(timer);
    unsubscribe();
  };
}

/** Subscribe to a single document; `data` is null when it does not exist. */
export function subscribeDoc<T>(
  ref: DocumentReference,
  parse: Parse<T>,
  onState: (state: Subscription<T | null>) => void,
): () => void {
  return withRetry<DocumentSnapshot>(
    (onNext, onError) => onSnapshot(ref, onNext, onError),
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
  return withRetry<QuerySnapshot>(
    (onNext, onError) => onSnapshot(query, onNext, onError),
    (snap) => {
      const data = snap.docs
        .map((docSnap) => parse(docSnap.id, dataOf(docSnap)))
        .filter((value): value is T => value !== null);
      onState({ status: 'ready', data, fromCache: snap.metadata.fromCache });
    },
    (error) => onState({ status: 'error', error }),
  );
}
