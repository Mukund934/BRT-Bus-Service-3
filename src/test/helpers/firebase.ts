/**
 * The single Firebase mock.
 *
 * One place defines how Firebase behaves in tests, so a change to the real
 * integration means updating one file rather than hunting through spec files
 * for duplicated stubs.
 *
 * The mock models the parts of the SDK this app actually uses: an auth state
 * listener, the credential calls behind it, and the on-demand Firestore /
 * Realtime Database loaders. Tests drive it through `signInAs` and
 * `signOutMock` rather than reaching into the SDK.
 */

import { vi } from "vitest";
import type { User as FirebaseUser } from "firebase/auth";

type AuthListener = (user: FirebaseUser | null) => void;

interface MockState {
  currentUser: FirebaseUser | null;
  listeners: Set<AuthListener>;
  /** Set to a message to make the next credential call reject. */
  nextAuthError: { code: string; message: string } | null;
}

const state: MockState = {
  currentUser: null,
  listeners: new Set(),
  nextAuthError: null,
};

/** Builds a Firebase user with only the fields this app reads. */
export const makeUser = (over: Partial<FirebaseUser> = {}): FirebaseUser =>
  ({
    uid: "user-1",
    email: "rider@example.com",
    displayName: "Test Rider",
    photoURL: null,
    ...over,
  }) as FirebaseUser;

/** Emits an auth state change to every registered listener. */
const emit = () => {
  for (const listener of state.listeners) listener(state.currentUser);
};

/**
 * Signs a user in and notifies the app, as Firebase would.
 *
 * The matching Firestore record is seeded first, because the auth provider
 * resolves a role immediately on sign-in. Without it every test would run as
 * a user whose record could not be read, which is the app's fail-closed
 * "no role" state rather than a signed-in passenger.
 */
export const signInAs = (
  user: FirebaseUser | null = makeUser(),
  role: "user" | "admin" | "driver" = "user"
): void => {
  if (user) {
    docs.set(`users/${user.uid}`, {
      name: user.displayName ?? "Test Rider",
      email: user.email ?? "rider@example.com",
      role,
    });
  }

  state.currentUser = user;
  emit();
};

export const signOutMock = (): void => {
  state.currentUser = null;
  emit();
};

/** Makes the next credential call fail with a Firebase-shaped error. */
export const queueAuthError = (code: string, message = "auth failed"): void => {
  state.nextAuthError = { code, message };
};

const takeQueuedError = () => {
  const error = state.nextAuthError;
  state.nextAuthError = null;

  if (error) {
    const err = new Error(error.message) as Error & { code: string };
    err.code = error.code;
    throw err;
  }
};

export const resetFirebaseMocks = (): void => {
  state.currentUser = null;
  state.listeners.clear();
  state.nextAuthError = null;
  docs.clear();
};

/** Replacement for the `firebase/auth` module. */
export const firebaseAuthMock = () => ({
  getAuth: vi.fn(() => ({ currentUser: state.currentUser })),

  onAuthStateChanged: vi.fn((_auth: unknown, listener: AuthListener) => {
    state.listeners.add(listener);

    // Firebase always emits the current state once on subscribe; without
    // this the provider would sit in its loading state forever.
    queueMicrotask(() => listener(state.currentUser));

    return () => state.listeners.delete(listener);
  }),

  signInWithEmailAndPassword: vi.fn(async (_auth: unknown, email: string) => {
    takeQueuedError();
    signInAs(makeUser({ email }));
    return { user: state.currentUser };
  }),

  createUserWithEmailAndPassword: vi.fn(async (_auth: unknown, email: string) => {
    takeQueuedError();
    signInAs(makeUser({ email, displayName: null }));
    return { user: state.currentUser };
  }),

  signInWithPopup: vi.fn(async () => {
    takeQueuedError();
    signInAs(makeUser());
    return { user: state.currentUser };
  }),

  signOut: vi.fn(async () => {
    takeQueuedError();
    signOutMock();
  }),

  updateProfile: vi.fn(async (_user: FirebaseUser, patch: { displayName?: string }) => {
    if (state.currentUser && patch.displayName) {
      state.currentUser = makeUser({ ...state.currentUser, ...patch });
    }
  }),

  setPersistence: vi.fn(async () => undefined),
  browserLocalPersistence: "local",

  GoogleAuthProvider: class {
    setCustomParameters = vi.fn();
  },
});

/** Replacement for the app's own `@/firebase` module. */
export const firebaseModuleMock = () => ({
  auth: { get currentUser() { return state.currentUser; } },
  googleProvider: { setCustomParameters: vi.fn() },

  /*
    `getDb` hands back a sentinel that the mocked `firebase/firestore`
    ignores, so `userService` exercises its real code path against the
    in-memory store above.

    `getRtdb` resolves to null, which is the documented "live tracking
    unavailable" case; tests that need bus positions mock `locationService`
    directly rather than simulating a socket.
  */
  getDb: vi.fn(async () => ({ __mock: "firestore" })),
  getRtdb: vi.fn(async () => null),
  prefetchFirestore: vi.fn(),

  default: {},
});

/** Exposed so a test can assert how many listeners are still attached. */
export const activeAuthListeners = (): number => state.listeners.size;

// ---- Firestore -------------------------------------------------------
//
// An in-memory document store rather than a per-call stub, so `userService`
// runs its real logic - role narrowing, permission gating, sorting,
// truncation - against something that behaves like a database.

const docs = new Map<string, Record<string, unknown>>();

interface DocRef {
  path: string;
  collection: string;
  id: string;
}

/** Seeds a document, bypassing the service layer. */
export const seedDoc = (
  collection: string,
  id: string,
  data: Record<string, unknown>
): void => {
  docs.set(`${collection}/${id}`, data);
};

export const readDoc = (collection: string, id: string) =>
  docs.get(`${collection}/${id}`);

export const clearDocs = (): void => docs.clear();

/** A stored Firestore Timestamp, structurally compatible with the real one. */
export const timestamp = (date: Date) => ({ toDate: () => date });

export const firestoreMock = () => ({
  getFirestore: vi.fn(() => ({ __mock: "firestore" })),

  doc: vi.fn(
    (_db: unknown, collection: string, id: string): DocRef => ({
      path: `${collection}/${id}`,
      collection,
      id,
    })
  ),

  getDoc: vi.fn(async (ref: DocRef) => {
    const data = docs.get(ref.path);

    return {
      id: ref.id,
      exists: () => data !== undefined,
      data: () => data,
    };
  }),

  setDoc: vi.fn(async (ref: DocRef, data: Record<string, unknown>) => {
    docs.set(ref.path, data);
  }),

  updateDoc: vi.fn(async (ref: DocRef, patch: Record<string, unknown>) => {
    docs.set(ref.path, { ...(docs.get(ref.path) ?? {}), ...patch });
  }),

  collection: vi.fn((_db: unknown, name: string) => ({ collection: name })),

  limit: vi.fn((count: number) => ({ kind: "limit" as const, count })),

  query: vi.fn(
    (
      source: { collection: string },
      ...constraints: Array<{ kind: string; count: number }>
    ) => ({
      collection: source.collection,
      limit: constraints.find((c) => c.kind === "limit")?.count ?? Infinity,
    })
  ),

  getDocs: vi.fn(async (q: { collection: string; limit: number }) => {
    const entries = [...docs.entries()]
      .filter(([path]) => path.startsWith(`${q.collection}/`))
      .slice(0, q.limit);

    return {
      docs: entries.map(([path, data]) => ({
        id: path.split("/")[1]!,
        data: () => data,
      })),
    };
  }),
});
