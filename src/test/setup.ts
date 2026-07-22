/**
 * Global test setup.
 *
 * Everything here exists so that an individual test file can focus on the
 * behaviour it is checking rather than re-stubbing the same browser and
 * Firebase surfaces. Anything a test needs to *control* lives in
 * `helpers/`; this file only establishes safe defaults.
 */

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

/*
  The Firebase SDK is never loaded in tests.

  `src/firebase.ts` calls `initializeApp` at module load and opens real
  network connections, and it is reachable from the auth context that most
  component tests mount. Replacing the module wholesale keeps tests fast,
  offline and deterministic. `helpers/firebase.ts` owns the controllable
  state behind it.
*/
vi.mock("@/firebase", async () => {
  const helper = await import("./helpers/firebase");
  return helper.firebaseModuleMock();
});

vi.mock("firebase/auth", async () => {
  const helper = await import("./helpers/firebase");
  return helper.firebaseAuthMock();
});

/*
  Firestore is backed by an in-memory document store rather than stubbed
  per-call, so `userService` runs its real logic against something that
  behaves like a database.
*/
vi.mock("firebase/firestore", async () => {
  const helper = await import("./helpers/firebase");
  return helper.firestoreMock();
});

/** jsdom implements neither of these, and several components call them. */
beforeEach(() => {
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }),
    });
  }

  // Radix scroll-locking and the notification popup both reach for these.
  window.HTMLElement.prototype.scrollIntoView ??= vi.fn();
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;

  // The Notification constructor is not implemented by jsdom.
  Object.defineProperty(window, "Notification", {
    writable: true,
    configurable: true,
    value: Object.assign(vi.fn(), { permission: "default", requestPermission: vi.fn() }),
  });

  /*
    jsdom exposes `navigator.clipboard` as a getter-only property, so it
    cannot be assigned. Defining it fresh each test gives copy-to-clipboard
    behaviour a spy to assert on, and stops one test's calls leaking into
    the next.
  */
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

afterEach(async () => {
  cleanup();

  // Storage is shared process-wide, so a ticket written by one test would
  // otherwise be visible to the next.
  localStorage.clear();

  const { resetFirebaseMocks } = await import("./helpers/firebase");
  resetFirebaseMocks();

  vi.useRealTimers();
});
