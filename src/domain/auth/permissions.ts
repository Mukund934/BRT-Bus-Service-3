/**
 * The authorization model.
 *
 * Every privileged capability in the app is named here and mapped to the
 * roles that hold it. Screens and services ask `can(actor, PERMISSION)`
 * rather than comparing role strings inline, so adding a role or moving a
 * capability is a one-line change with no hunt through components.
 *
 * This layer is defense in depth and a UX affordance - it decides what to
 * render and which calls to even attempt. It is NOT the security boundary.
 * Firestore rules are, because anything decided in the browser can be
 * bypassed by editing the browser.
 */

import type { Actor, UserRole } from "@/types/user";

export const PERMISSIONS = {
  /** See the administrator panel at all. */
  VIEW_ADMIN_PANEL: "admin:view",
  /** Read the full user roster. */
  READ_ALL_USERS: "users:read-all",
  /** Change another account's role. */
  ASSIGN_ROLES: "users:assign-role",
  /** Publish live GPS position as a bus driver. */
  PUBLISH_LOCATION: "location:publish",
  /** Purchase a ticket. */
  BOOK_TICKET: "ticket:book",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Role capabilities, stated in full rather than by inheritance.
 *
 * Explicit lists are longer but make "what can a driver actually do?"
 * answerable by reading one array instead of tracing an inheritance chain.
 */
const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  user: [PERMISSIONS.BOOK_TICKET],

  driver: [PERMISSIONS.BOOK_TICKET, PERMISSIONS.PUBLISH_LOCATION],

  admin: [
    PERMISSIONS.BOOK_TICKET,
    PERMISSIONS.VIEW_ADMIN_PANEL,
    PERMISSIONS.READ_ALL_USERS,
    PERMISSIONS.ASSIGN_ROLES,
  ],
};

/** Whether a role holds a capability. */
export const roleCan = (role: UserRole | null, permission: Permission): boolean =>
  role !== null && ROLE_PERMISSIONS[role].includes(permission);

/**
 * Whether an actor holds a capability.
 *
 * A null actor - signed out, or signed in but with an unresolved role - holds
 * nothing. Failing closed matters here: during the auth loading window `role`
 * is briefly null, and treating that as "no permissions" is what stops
 * privileged UI flashing before the real role arrives.
 */
export const can = (actor: Actor | null, permission: Permission): boolean =>
  actor !== null && roleCan(actor.role, permission);

/** Whether the actor owns the resource belonging to `ownerId`. */
export const owns = (actor: Actor | null, ownerId: string): boolean =>
  actor !== null && actor.uid === ownerId;

/** Every capability a role holds; useful for diagnostics and admin display. */
export const permissionsFor = (role: UserRole | null): readonly Permission[] =>
  role === null ? [] : ROLE_PERMISSIONS[role];
