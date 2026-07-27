/**
 * Account and profile types.
 *
 * Previously declared inline inside the user context, which meant components
 * could not name the shapes they were consuming.
 */

/**
 * A Firestore Timestamp, structurally.
 *
 * Declared here rather than imported from `firebase/firestore` so that these
 * types carry no dependency on the Firestore SDK - importing the real
 * `Timestamp` for its type would be erased at compile time, but any file that
 * also needed it as a value would drag the whole 243 kB module in.
 */
export interface TimestampLike {
  toDate(): Date;
}

export const isTimestampLike = (value: unknown): value is TimestampLike =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as TimestampLike).toDate === "function";

/**
 * Every role the system recognises.
 *
 * Declared once as a const tuple; `UserRole` is derived from it so the list
 * and the type cannot drift, and so runtime validators can consume it
 * directly.
 */
export const USER_ROLES = ["user", "admin", "driver"] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** The role assigned to every newly registered account. */
export const DEFAULT_ROLE: UserRole = "user";

/** A user record as stored in Firestore. */
export interface UserRecord {
  uid: string;
  name?: string;
  email?: string;
  role: UserRole;
  createdAt?: TimestampLike;
  photoURL?: string;
  /** Absent means opted in; only an explicit `false` disables alerts. */
  notifications_enabled?: boolean;
}

/** The signed-in passenger's own profile, as shown in the app. */
export interface UserProfile {
  name: string;
  email: string;
  notifications_enabled: boolean;
}

/** Identity and privileges of whoever is performing an action. */
export interface Actor {
  uid: string;
  role: UserRole | null;
}
