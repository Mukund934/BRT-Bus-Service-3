/**
 * Firebase initialization.
 *
 * Only the app shell and Auth are loaded eagerly. Firestore and the Realtime
 * Database are imported on first use, because they are large and most first
 * visits never touch them:
 *
 *   @firebase/firestore   ~243 kB   needed only once a session is resolved
 *   @firebase/database    ~165 kB   needed only on the tracking screens
 *   @firebase/auth        ~122 kB   needed immediately, so kept eager
 *
 * Each loader memoizes its promise, so concurrent callers share one download
 * and one SDK instance.
 *
 * Two other things this guards against:
 *
 *  1. Duplicate initialization. Vite's HMR re-executes modules, and calling
 *     `initializeApp` twice throws.
 *  2. A hard dependency on the Realtime Database. Live tracking is secondary;
 *     if its URL is missing or unreachable, authentication and ticketing must
 *     still work, so its loader resolves to null rather than throwing.
 */

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { Database } from "firebase/database";
import { databaseUrl, firebaseConfig, isEnvValid } from "@/config/env";

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();

// Forces the account chooser instead of silently reusing a single signed-in
// Google account, which matters on shared devices.
googleProvider.setCustomParameters({ prompt: "select_account" });

let firestorePromise: Promise<Firestore> | null = null;

/** Loads Firestore on demand. Subsequent calls reuse the same instance. */
export const getDb = (): Promise<Firestore> =>
  (firestorePromise ??= import("firebase/firestore").then(({ getFirestore }) =>
    getFirestore(app)
  ));

let databasePromise: Promise<Database | null> | null = null;

/**
 * Loads the Realtime Database on demand.
 *
 * Resolves to null when the environment is incomplete or the SDK cannot
 * reach the instance; callers must handle that rather than assume a handle.
 */
export const getRtdb = (): Promise<Database | null> =>
  (databasePromise ??= (async () => {
    if (!isEnvValid) return null;

    try {
      const { getDatabase } = await import("firebase/database");

      return databaseUrl ? getDatabase(app, databaseUrl) : getDatabase(app);
    } catch (error) {
      console.error(
        "Realtime Database unavailable - live bus tracking is disabled. " +
          "Set VITE_FIREBASE_DATABASE_URL if this project uses a non-default instance.",
        error
      );
      return null;
    }
  })());

/**
 * Warms the Firestore chunk during idle time.
 *
 * A signed-in visitor needs it as soon as their session resolves, so fetching
 * it while the browser is idle removes that wait without competing with the
 * initial render.
 */
export const prefetchFirestore = (): void => {
  const warm = () => void getDb().catch(() => {});

  const idle = (
    window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void;
    }
  ).requestIdleCallback;

  if (idle) idle(warm, { timeout: 3000 });
  else window.setTimeout(warm, 1500);
};

export default app;
