/**
 * Validated build-time environment.
 *
 * Vite inlines `import.meta.env.VITE_*` at build time, so a missing variable
 * does not fail loudly - it silently becomes `undefined` and surfaces later
 * as an opaque Firebase error. Parsing the environment here turns that into
 * one precise message naming exactly which variables are absent.
 *
 * SECURITY NOTE: none of these are secrets. Firebase web configuration is
 * designed to be public and is embedded in the JavaScript bundle that every
 * visitor downloads. What protects the data is Firestore and Realtime
 * Database security rules, not the confidentiality of these values.
 */

import { z } from "zod";

const required = (name: string) =>
  z.string({ required_error: `${name} is missing` }).trim().min(1, `${name} is empty`);

const envSchema = z.object({
  VITE_FIREBASE_API_KEY: required("VITE_FIREBASE_API_KEY"),
  VITE_FIREBASE_AUTH_DOMAIN: required("VITE_FIREBASE_AUTH_DOMAIN"),
  VITE_FIREBASE_PROJECT_ID: required("VITE_FIREBASE_PROJECT_ID"),
  VITE_FIREBASE_STORAGE_BUCKET: required("VITE_FIREBASE_STORAGE_BUCKET"),
  VITE_FIREBASE_MESSAGING_SENDER_ID: required("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  VITE_FIREBASE_APP_ID: required("VITE_FIREBASE_APP_ID"),

  // Optional: analytics is not wired up, and live bus tracking degrades
  // gracefully when the Realtime Database URL is absent.
  VITE_FIREBASE_MEASUREMENT_ID: z.string().trim().optional(),
  VITE_FIREBASE_DATABASE_URL: z.string().trim().url().optional().catch(undefined),
});

export type FirebaseEnv = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(import.meta.env);

/** Human-readable reasons the environment is unusable; empty when valid. */
export const envIssues: string[] = parsed.success
  ? []
  : parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);

export const isEnvValid = parsed.success;

if (!parsed.success) {
  console.error(
    "Firebase environment is incomplete. Copy .env.example to .env and fill it in.\n" +
      envIssues.map((issue) => `  - ${issue}`).join("\n")
  );
}

const env: Partial<FirebaseEnv> = parsed.success ? parsed.data : {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? "",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? "",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: env.VITE_FIREBASE_APP_ID ?? "",
} as const;

/**
 * Realtime Database URL.
 *
 * Falls back to the default instance naming when unset, which is what the
 * SDK would otherwise attempt implicitly - stated explicitly here so the
 * behaviour is visible rather than magical.
 */
export const databaseUrl: string | undefined =
  env.VITE_FIREBASE_DATABASE_URL ??
  (firebaseConfig.projectId
    ? `https://${firebaseConfig.projectId}-default-rtdb.firebaseio.com`
    : undefined);
