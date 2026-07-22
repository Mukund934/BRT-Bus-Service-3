/**
 * Account and profile types.
 *
 * Previously declared inline inside the user context, which meant components
 * could not name the shapes they were consuming.
 */

import type { Timestamp } from "firebase/firestore";

export type UserRole = "user" | "admin" | "driver";

export const USER_ROLES: readonly UserRole[] = ["user", "admin", "driver"];

/** A user record as stored in Firestore. */
export interface UserRecord {
  uid: string;
  name?: string;
  email?: string;
  role: UserRole;
  createdAt?: Timestamp;
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
