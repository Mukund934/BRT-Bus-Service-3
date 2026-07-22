/**
 * Firebase initialization.
 *
 * Two things this guards against:
 *
 *  1. Duplicate initialization. Vite's HMR re-executes modules, and calling
 *     `initializeApp` twice throws. Reusing an existing app keeps hot reloads
 *     from wedging the dev server.
 *
 *  2. A hard dependency on the Realtime Database. Live bus tracking is a
 *     secondary feature; if its URL is missing or the SDK cannot reach it,
 *     authentication and ticketing must still work. `rtdb` is therefore
 *     nullable and every consumer is required to handle its absence.
 */

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase, type Database } from "firebase/database";
import { databaseUrl, firebaseConfig, isEnvValid } from "@/config/env";

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();

// Forces the account chooser instead of silently reusing a single signed-in
// Google account, which matters on shared devices.
googleProvider.setCustomParameters({ prompt: "select_account" });

/**
 * Realtime Database handle, or null when unavailable.
 *
 * Consumers must null-check. Live tracking degrades to "no buses reporting"
 * rather than crashing the page.
 */
export const rtdb: Database | null = (() => {
  if (!isEnvValid) return null;

  try {
    return databaseUrl ? getDatabase(app, databaseUrl) : getDatabase(app);
  } catch (error) {
    console.error(
      "Realtime Database unavailable - live bus tracking is disabled. " +
        "Set VITE_FIREBASE_DATABASE_URL if this project uses a non-default instance.",
      error
    );
    return null;
  }
})();

export const isLiveTrackingAvailable = rtdb !== null;

export default app;
