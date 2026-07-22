/**
 * Security-relevant error types.
 *
 * Two rules govern the messages here:
 *
 *  - The message shown to a user must never reveal whether a record exists,
 *    who owns it, or why precisely a check failed. "You do not have
 *    permission" is the whole answer.
 *  - The detail a developer needs goes to the console, not the UI.
 */

import type { Permission } from "./permissions";

/** Thrown when an actor attempts something their role does not permit. */
export class AuthorizationError extends Error {
  readonly permission: Permission | null;

  constructor(permission: Permission | null = null) {
    super("You do not have permission to perform this action.");
    this.name = "AuthorizationError";
    this.permission = permission;
  }
}

/** Thrown when an operation requires a signed-in user and there is none. */
export class AuthenticationError extends Error {
  constructor() {
    super("Please sign in to continue.");
    this.name = "AuthenticationError";
  }
}

export const isAuthorizationError = (error: unknown): error is AuthorizationError =>
  error instanceof AuthorizationError;

/**
 * Converts any thrown value into something safe to render.
 *
 * Raw Firebase errors carry backend detail (project ids, index hints, rule
 * paths) that should not reach a user, so anything unrecognised collapses to
 * a generic message while the original is logged for the developer.
 */
export const toSafeMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string => {
  if (error instanceof AuthorizationError || error instanceof AuthenticationError) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String((error as { code: unknown }).code);

    // Permission denials are expected when rules do their job; they are not
    // a bug and should read as a plain refusal.
    if (code.includes("permission-denied") || code.includes("PERMISSION_DENIED")) {
      return "You do not have permission to perform this action.";
    }

    if (code.includes("unavailable") || code.includes("network")) {
      return "Network unavailable. Please check your connection and try again.";
    }
  }

  console.error("Unhandled error:", error);

  return fallback;
};

const authCodeOf = (error: unknown): string =>
  typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code)
    : "";

/**
 * Maps a Firebase Auth failure to a message safe to show a visitor.
 *
 * The important case is sign-in. Firebase distinguishes `auth/user-not-found`
 * from `auth/wrong-password`, and surfacing that difference turns the login
 * form into an account-enumeration oracle: an attacker can discover which
 * email addresses are registered by watching which error comes back. Every
 * credential failure therefore collapses to one indistinguishable message.
 */
export const toAuthMessage = (error: unknown): string => {
  const code = authCodeOf(error);

  switch (code) {
    // Deliberately identical - do not split these apart.
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
    case "auth/invalid-email":
      return "Incorrect email or password.";

    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and try again.";

    case "auth/user-disabled":
      return "This account has been disabled.";

    case "auth/email-already-in-use":
      return "That email address cannot be used to register.";

    case "auth/weak-password":
      return "Please choose a password of at least 6 characters.";

    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled.";

    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup. Please allow popups and retry.";

    case "auth/network-request-failed":
      return "Network unavailable. Please check your connection and try again.";

    default:
      console.error("Unhandled auth error:", error);
      return "Sign-in failed. Please try again.";
  }
};
