/**
 * Error messages that reach a user.
 *
 * The sign-in mapping is a security control, not cosmetics: Firebase
 * distinguishes "no such user" from "wrong password", and surfacing that
 * difference turns the login form into an oracle for discovering which email
 * addresses are registered. The first test here is the one that matters.
 */

import { describe, expect, it } from "vitest";
import {
  AuthenticationError,
  AuthorizationError,
  isAuthorizationError,
  toAuthMessage,
  toSafeMessage,
} from "@/domain/auth/errors";
import { PERMISSIONS } from "@/domain/auth/permissions";

const firebaseError = (code: string) => Object.assign(new Error("raw"), { code });

describe("sign-in failures cannot be used to enumerate accounts", () => {
  it("returns one identical message for every credential failure", () => {
    const codes = [
      "auth/user-not-found",
      "auth/wrong-password",
      "auth/invalid-credential",
      "auth/invalid-email",
    ];

    const messages = new Set(codes.map((code) => toAuthMessage(firebaseError(code))));

    // A single distinct message across all four is the whole point.
    expect(messages.size).toBe(1);
    expect([...messages][0]).toBe("Incorrect email or password.");
  });

  it("never leaks the underlying Firebase code", () => {
    const message = toAuthMessage(firebaseError("auth/user-not-found"));

    expect(message).not.toMatch(/auth\//);
    expect(message).not.toMatch(/firebase/i);
  });
});

describe("other sign-in failures are explained usefully", () => {
  it.each([
    ["auth/too-many-requests", /too many attempts/i],
    ["auth/user-disabled", /disabled/i],
    ["auth/weak-password", /at least 6 characters/i],
    ["auth/popup-closed-by-user", /cancelled/i],
    ["auth/popup-blocked", /popup/i],
    ["auth/network-request-failed", /network/i],
  ])("maps %s to something actionable", (code, expected) => {
    expect(toAuthMessage(firebaseError(code))).toMatch(expected);
  });

  it("falls back to a generic message for an unrecognised code", () => {
    expect(toAuthMessage(firebaseError("auth/something-new"))).toBe(
      "Sign-in failed. Please try again."
    );
  });

  it("handles a thrown value that is not a Firebase error at all", () => {
    expect(toAuthMessage("just a string")).toBe("Sign-in failed. Please try again.");
  });
});

describe("authorization errors", () => {
  it("says nothing about what was being protected", () => {
    const error = new AuthorizationError(PERMISSIONS.ASSIGN_ROLES);

    // The permission is available to the developer but absent from the text.
    expect(error.permission).toBe(PERMISSIONS.ASSIGN_ROLES);
    expect(error.message).toBe("You do not have permission to perform this action.");
    expect(error.message).not.toMatch(/users:/);
  });

  it("is recognisable to callers", () => {
    expect(isAuthorizationError(new AuthorizationError())).toBe(true);
    expect(isAuthorizationError(new Error("nope"))).toBe(false);
  });
});

describe("turning any thrown value into something safe to show", () => {
  it("passes through our own authorization message", () => {
    expect(toSafeMessage(new AuthorizationError())).toMatch(/do not have permission/i);
  });

  it("passes through our own authentication message", () => {
    expect(toSafeMessage(new AuthenticationError())).toMatch(/sign in/i);
  });

  it("reads a rules rejection as a plain refusal", () => {
    // Permission denied is the rules doing their job, not a bug.
    expect(toSafeMessage(firebaseError("permission-denied"))).toMatch(
      /do not have permission/i
    );
  });

  it("distinguishes a network problem so the user knows to retry", () => {
    expect(toSafeMessage(firebaseError("unavailable"))).toMatch(/network/i);
  });

  it("collapses anything unrecognised rather than leaking backend detail", () => {
    const leaky = new Error(
      "FIRESTORE (12.0.0) INTERNAL ASSERTION FAILED: project brtbus-116fa index missing"
    );

    const message = toSafeMessage(leaky);

    expect(message).toBe("Something went wrong. Please try again.");
    expect(message).not.toMatch(/brtbus/);
  });

  it("accepts a caller-supplied fallback", () => {
    expect(toSafeMessage(new Error("x"), "Could not load users.")).toBe(
      "Could not load users."
    );
  });
});
