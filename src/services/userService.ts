/**
 * Firestore access for user records and roles.
 *
 * Lifted out of the user context so that the context holds state and actions
 * only, and so admin screens can call these directly instead of every
 * consumer of the context carrying admin methods it will never use.
 *
 * The role checks below are client-side conveniences that keep the UI honest.
 * They are not a security boundary - server-side Firestore rules are the
 * enforcement point and are Sprint 5's subject.
 */

import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";
import { db } from "@/firebase";
import { REMOTE_PATHS } from "@/constants/config";
import type { Actor, UserProfile, UserRecord, UserRole } from "@/types/user";

const userDoc = (uid: string) => doc(db, REMOTE_PATHS.USERS, uid);

const toRole = (value: unknown): UserRole =>
  value === "admin" || value === "driver" ? value : "user";

/** Reads a user's stored record, or null when they have none yet. */
export const fetchUserRecord = async (uid: string): Promise<UserRecord | null> => {
  const snap = await getDoc(userDoc(uid));
  if (!snap.exists()) return null;

  const data = snap.data();

  return {
    uid,
    name: data.name,
    email: data.email,
    role: toRole(data.role),
    createdAt: data.createdAt,
    photoURL: data.photoURL,
    notifications_enabled: data.notifications_enabled,
  };
};

/** Creates the Firestore record that backs a newly registered account. */
export const createUserRecord = async (
  user: FirebaseUser,
  name?: string
): Promise<UserRecord> => {
  const name_ = name ?? user.displayName ?? "User";
  const createdAt = Timestamp.now();

  // Firestore stores absent values as null; the domain type uses undefined.
  await setDoc(userDoc(user.uid), {
    name: name_,
    email: user.email,
    role: "user",
    createdAt,
    photoURL: user.photoURL ?? null,
  });

  return {
    uid: user.uid,
    name: name_,
    email: user.email ?? undefined,
    role: "user",
    createdAt,
    photoURL: user.photoURL ?? undefined,
  };
};

/**
 * Returns a user's record, creating a default one if it is missing.
 *
 * Accounts created before the users collection existed - and Google sign-ins,
 * which never pass through registration - land here on first login.
 */
export const ensureUserRecord = async (
  user: FirebaseUser,
  name?: string
): Promise<UserRecord> => {
  const existing = await fetchUserRecord(user.uid);
  if (existing) return existing;

  return createUserRecord(user, name);
};

/** Builds the display profile shown to the signed-in passenger. */
export const toUserProfile = (
  user: FirebaseUser,
  record: UserRecord | null
): UserProfile => ({
  name: record?.name ?? user.displayName ?? "Passenger",
  email: record?.email ?? user.email ?? "",
  // Opt-out, not opt-in: only an explicit `false` silences alerts.
  notifications_enabled: record?.notifications_enabled !== false,
});

const isAdmin = (actor: Actor | null): boolean => actor?.role === "admin";

/** Every user record, newest first. Admin only. */
export const fetchAllUsers = async (actor: Actor | null): Promise<UserRecord[]> => {
  if (!isAdmin(actor)) throw new Error("Only admins can fetch all users");

  const snapshot = await getDocs(collection(db, REMOTE_PATHS.USERS));

  const users: UserRecord[] = snapshot.docs.map((entry) => {
    const data = entry.data();

    return {
      uid: entry.id,
      name: data.name,
      email: data.email,
      role: toRole(data.role),
      createdAt: data.createdAt,
      photoURL: data.photoURL,
    };
  });

  const createdAtMs = (record: UserRecord): number =>
    record.createdAt instanceof Timestamp
      ? record.createdAt.toDate().getTime()
      : 0;

  return users.sort((a, b) => createdAtMs(b) - createdAtMs(a));
};

/**
 * Changes a user's role. Admin only.
 *
 * Returns null on success or a message describing the failure.
 */
export const updateUserRole = async (
  actor: Actor | null,
  userId: string,
  newRole: UserRole
): Promise<string | null> => {
  if (!isAdmin(actor)) return "Only admins can update user roles";

  try {
    const ref = userDoc(userId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      await updateDoc(ref, { role: newRole, updatedAt: Timestamp.now() });
    } else {
      await setDoc(ref, {
        role: newRole,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    return null;
  } catch (error) {
    console.error("Failed to update user role:", error);
    return error instanceof Error ? error.message : "Failed to update user role";
  }
};
