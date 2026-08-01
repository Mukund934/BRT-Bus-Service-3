/**
 * Stand-in for `userService` in tests that mount the auth provider.
 *
 * Anything rendering `AuthProvider` resolves a user record on sign-in. Most
 * such tests are about tickets or UI, not about Firestore, and letting the
 * real service run there mixes a mocked `@/firebase` with a real
 * `firebase/firestore` - the two disagree about what a database handle is,
 * and the provider quietly falls back to its "no role" state.
 *
 * Mocking the service instead keeps those tests focused and lets them choose
 * a role outright. `userService` itself is covered directly in
 * `services/userService.test.ts`, where the Firestore mock is the subject.
 */

import { vi } from "vitest";
import type { UserRole } from "@/types/user";

let role: UserRole = "user";
let notifications = true;

/** Sets the role every subsequent sign-in resolves to. */
export const setMockRole = (next: UserRole): void => {
  role = next;
};

/** Sets whether the resolved profile has arrival alerts switched on. */
export const setMockNotifications = (next: boolean): void => {
  notifications = next;
};

export const resetMockRole = (): void => {
  role = "user";
};

/** The module replacement. Pass to `vi.mock("@/services/userService", ...)`. */
export const userServiceMock = () => ({
  fetchUserRecord: vi.fn(async (uid: string) => ({
    uid,
    name: "Test Rider",
    email: "rider@example.com",
    role,
  })),

  createUserRecord: vi.fn(async (user: { uid: string }) => ({
    uid: user.uid,
    name: "Test Rider",
    email: "rider@example.com",
    role,
  })),

  ensureUserRecord: vi.fn(async (user: { uid: string }) => ({
    uid: user.uid,
    name: "Test Rider",
    email: "rider@example.com",
    role,
  })),

  toUserProfile: vi.fn(
    (user: { displayName?: string | null; email?: string | null }) => ({
      name: user.displayName ?? "Passenger",
      email: user.email ?? "",
      notifications_enabled: notifications,
    })
  ),

  fetchAllUsers: vi.fn(async () => ({ users: [], truncated: false })),
  updateUserRole: vi.fn(async () => ({ ok: true as const })),
  updateNotificationPreference: vi.fn(async (_uid: string, enabled: boolean) => {
    notifications = enabled;
  }),
  MAX_USERS_PER_READ: 500,
});
