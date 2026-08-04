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
  resetRtdbMock();
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

  sendPasswordResetEmail: vi.fn(async () => {
    takeQueuedError();
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

    `getRtdb` resolves to null by default, which is the documented "live
    tracking unavailable" case. A test that wants the database calls
    `enableRtdb()` first; leaving it off keeps every existing suite on the
    path it was written against.
  */
  getDb: vi.fn(async () => ({ __mock: "firestore" })),
  getRtdb: vi.fn(async () => (rtdb.enabled ? { __mock: "rtdb" } : null)),
  prefetchFirestore: vi.fn(),

  default: {},
});

/** Exposed so a test can assert how many listeners are still attached. */
export const activeAuthListeners = (): number => state.listeners.size;

// ---- Realtime Database -----------------------------------------------
//
// A node tree with live listeners, rather than a stub per call, so
// `locationService` runs its real subscription, parsing and cleanup logic.
// Disabled by default: `getRtdb` resolving to null is the app's documented
// "live tracking unavailable" state and several suites depend on it.

interface RtdbRef {
  path: string;
}

const rtdb = {
  enabled: false,
  failNextSubscription: false,
  nodes: new Map<string, unknown>(),
  listeners: new Map<string, Set<(snapshot: unknown) => void>>(),
  onDisconnects: new Map<string, "remove">(),
};

/** Switches the in-memory database on for the current test. */
export const enableRtdb = (): void => {
  rtdb.enabled = true;
};

/** Writes a node directly, bypassing the service layer. */
export const seedRtdb = (path: string, value: unknown): void => {
  rtdb.nodes.set(path, value);
  notifyRtdb(path);
};

export const readRtdb = (path: string): unknown => rtdb.nodes.get(path);

/** Whether the server has been asked to clear a node if the driver drops. */
export const hasDisconnectCleanup = (path: string): boolean =>
  rtdb.onDisconnects.get(path) === "remove";

/** Runs what the server would run when a connection is lost. */
export const dropRtdbConnection = (): void => {
  for (const path of [...rtdb.onDisconnects.keys()]) {
    rtdb.nodes.delete(path);
    rtdb.onDisconnects.delete(path);
    notifyRtdb(path);
  }
};

const childrenOf = (path: string): Record<string, unknown> => {
  const prefix = `${path}/`;
  const children: Record<string, unknown> = {};

  for (const [key, value] of rtdb.nodes) {
    if (key.startsWith(prefix)) children[key.slice(prefix.length)] = value;
  }

  return children;
};

const snapshotAt = (path: string) => {
  const direct = rtdb.nodes.get(path);
  const children = childrenOf(path);
  const value = direct ?? (Object.keys(children).length ? children : null);

  return {
    exists: () => value !== null && value !== undefined,
    val: () => value,
  };
};

const notifyRtdb = (path: string): void => {
  for (const [listenPath, handlers] of rtdb.listeners) {
    if (path === listenPath || path.startsWith(`${listenPath}/`)) {
      handlers.forEach((handler) => handler(snapshotAt(listenPath)));
    }
  }
};

export const resetRtdbMock = (): void => {
  rtdb.enabled = false;
  rtdb.failNextSubscription = false;
  rtdb.nodes.clear();
  rtdb.listeners.clear();
  rtdb.onDisconnects.clear();
};

/** Replacement for the `firebase/database` module. */
export const firebaseDatabaseMock = () => ({
  getDatabase: vi.fn(() => ({ __mock: "rtdb" })),

  ref: vi.fn((_db: unknown, path: string): RtdbRef => ({ path })),

  set: vi.fn(async (node: RtdbRef, value: unknown) => {
    rtdb.nodes.set(node.path, value);
    notifyRtdb(node.path);
  }),

  remove: vi.fn(async (node: RtdbRef) => {
    rtdb.nodes.delete(node.path);
    notifyRtdb(node.path);
  }),

  onDisconnect: vi.fn((node: RtdbRef) => ({
    remove: vi.fn(async () => {
      rtdb.onDisconnects.set(node.path, "remove");
    }),
  })),

  onValue: vi.fn(
    (
      node: RtdbRef,
      handler: (snapshot: unknown) => void,
      onError?: (error: Error) => void
    ) => {
      const handlers = rtdb.listeners.get(node.path) ?? new Set();

      handlers.add(handler);
      rtdb.listeners.set(node.path, handlers);

      if (rtdb.failNextSubscription) {
        rtdb.failNextSubscription = false;
        onError?.(new Error("permission denied"));
        return () => handlers.delete(handler);
      }

      handler(snapshotAt(node.path));

      return () => handlers.delete(handler);
    }
  ),

  off: vi.fn((node: RtdbRef, _event: string, handler: (snapshot: unknown) => void) => {
    rtdb.listeners.get(node.path)?.delete(handler);
  }),
});

/** Makes the next subscription report a failure instead of delivering data. */
export const failNextRtdbSubscription = (): void => {
  rtdb.failNextSubscription = true;
};

/** How many listeners are still attached to a node. */
export const rtdbListenerCount = (path: string): number =>
  rtdb.listeners.get(path)?.size ?? 0;

// ---- Firestore -------------------------------------------------------
//
// An in-memory document store rather than a per-call stub, so `userService`
// runs its real logic - role narrowing, permission gating, sorting,
// truncation - against something that behaves like a database.

const docs = new Map<string, Record<string, unknown>>();

let generatedDocs = 0;

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

export const clearDocs = (): void => {
  docs.clear();
  generatedDocs = 0;
};

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

  deleteDoc: vi.fn(async (ref: DocRef) => {
    docs.delete(ref.path);
  }),

  addDoc: vi.fn(
    async (source: { collection: string }, data: Record<string, unknown>) => {
      const id = `generated-${++generatedDocs}`;

      docs.set(`${source.collection}/${id}`, data);

      return { id };
    }
  ),

  collection: vi.fn((_db: unknown, name: string) => ({ collection: name })),

  limit: vi.fn((count: number) => ({ kind: "limit" as const, count })),

  where: vi.fn((field: string, _op: string, value: unknown) => ({
    kind: "where" as const,
    field,
    value,
  })),

  query: vi.fn(
    (
      source: { collection: string },
      ...constraints: Array<{
        kind: string;
        count?: number;
        field?: string;
        value?: unknown;
      }>
    ) => ({
      collection: source.collection,
      limit: constraints.find((c) => c.kind === "limit")?.count ?? Infinity,
      wheres: constraints.filter((c) => c.kind === "where") as Array<{
        field: string;
        value: unknown;
      }>,
    })
  ),

  getDocs: vi.fn(
    async (q: {
      collection: string;
      limit: number;
      wheres?: Array<{ field: string; value: unknown }>;
    }) => {
      const entries = [...docs.entries()]
        .filter(([path]) => path.startsWith(`${q.collection}/`))
        .filter(([, data]) =>
          (q.wheres ?? []).every((clause) => data[clause.field] === clause.value)
        )
        .slice(0, q.limit);

      return {
        docs: entries.map(([path, data]) => ({
          id: path.split("/")[1]!,
          data: () => data,
        })),
      };
    }
  ),
});
