/**
 * The Firestore rules, enforced by Firebase rather than read by us.
 *
 * These rules had never been executed. They were reviewed by eye, and eye
 * review is exactly what misses the difference between `get` and `list`, or a
 * `hasOnly` that admits one more key than intended - the two places where this
 * file's central promise lives.
 *
 * That promise: a user may create and edit their own profile, but may NEVER
 * set or change their own `role`. Everything else in the app derives
 * authorization from that field, so it is the one privilege-escalation path
 * that matters, and it is asserted here against the real evaluator.
 *
 * Run with `npm run test:rules`.
 */

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";

const RIDER = "rider-1";
const OTHER = "rider-2";
const ADMIN = "admin-1";

let env: RulesTestEnvironment;

const profile = (over: Record<string, unknown> = {}) => ({
  name: "Test Rider",
  email: "rider@example.com",
  role: "user",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

const ticket = (userId: string, over: Record<string, unknown> = {}) => ({
  userId,
  ticketId: "TICKET-1",
  fare: 10,
  status: "ACTIVE",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

/*
  `rules-unit-testing` hands back a compat Firestore instance while these
  tests, like the app, speak the modular API. It is the same object, but the
  two type declarations do not overlap, so the conversion has to pass through
  `unknown` - done once here rather than at every call site.
*/
const modular = (db: unknown) => db as Firestore;

const asRider = () => modular(env.authenticatedContext(RIDER).firestore());
const asAdmin = () => modular(env.authenticatedContext(ADMIN).firestore());
const asVisitor = () => modular(env.unauthenticatedContext().firestore());

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-brt",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8081,
    },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();

  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(doc(db, "users", RIDER), profile());
    await setDoc(doc(db, "users", OTHER), profile({ email: "other@example.com" }));
    await setDoc(doc(db, "users", ADMIN), profile({ role: "admin" }));
  });
});

describe("reading profiles", () => {
  it("lets a rider read their own profile", async () => {
    await assertSucceeds(getDoc(doc(asRider(), "users", RIDER)));
  });

  it("refuses a rider reading somebody else's profile", async () => {
    await assertFails(getDoc(doc(asRider(), "users", OTHER)));
  });

  it("refuses a signed-out visitor entirely", async () => {
    await assertFails(getDoc(doc(asVisitor(), "users", RIDER)));
  });

  /*
    `get` and `list` are split deliberately. Without the split, any signed-in
    account could page the whole collection and harvest every name and email -
    the mass-read the audit called out. Rules cannot express "you may query
    only your own document" for a collection scan, so listing is admin-only.
  */
  it("refuses a rider enumerating the collection", async () => {
    await assertFails(getDocs(collection(asRider(), "users")));
  });

  it("lets an admin enumerate the collection", async () => {
    await assertSucceeds(getDocs(collection(asAdmin(), "users")));
  });

  it("lets an admin read any single profile", async () => {
    await assertSucceeds(getDoc(doc(asAdmin(), "users", RIDER)));
  });
});

describe("the role field", () => {
  const NEW_USER = "brand-new";

  it("lets somebody register themselves as an ordinary user", async () => {
    const db = modular(env.authenticatedContext(NEW_USER).firestore());

    await assertSucceeds(
      setDoc(doc(db, "users", NEW_USER), {
        name: "New",
        email: "new@example.com",
        role: "user",
        createdAt: "2026-01-01T00:00:00.000Z",
      })
    );
  });

  /* The escalation this whole file exists to prevent. */
  it("refuses somebody registering themselves as an admin", async () => {
    const db = modular(env.authenticatedContext(NEW_USER).firestore());

    await assertFails(
      setDoc(doc(db, "users", NEW_USER), {
        name: "New",
        email: "new@example.com",
        role: "admin",
        createdAt: "2026-01-01T00:00:00.000Z",
      })
    );
  });

  it("refuses somebody registering themselves as a driver", async () => {
    const db = modular(env.authenticatedContext(NEW_USER).firestore());

    await assertFails(
      setDoc(doc(db, "users", NEW_USER), {
        name: "New",
        email: "new@example.com",
        role: "driver",
        createdAt: "2026-01-01T00:00:00.000Z",
      })
    );
  });

  it("refuses a rider promoting themselves later", async () => {
    await assertFails(
      updateDoc(doc(asRider(), "users", RIDER), { role: "admin" })
    );
  });

  it("refuses a rider promoting somebody else", async () => {
    await assertFails(
      updateDoc(doc(asRider(), "users", OTHER), { role: "admin" })
    );
  });

  it("lets an admin change a role", async () => {
    await assertSucceeds(
      updateDoc(doc(asAdmin(), "users", RIDER), {
        role: "driver",
        updatedAt: "2026-02-01T00:00:00.000Z",
      })
    );
  });

  it("refuses an admin inventing a role that does not exist", async () => {
    await assertFails(
      updateDoc(doc(asAdmin(), "users", RIDER), {
        role: "superuser",
        updatedAt: "2026-02-01T00:00:00.000Z",
      })
    );
  });

  /*
    An admin may change a role and nothing else. Role administration is not a
    licence to rewrite somebody's name or email.
  */
  it("refuses an admin editing a rider's name under cover of a role change", async () => {
    await assertFails(
      updateDoc(doc(asAdmin(), "users", RIDER), {
        role: "driver",
        name: "Renamed By Admin",
      })
    );
  });
});

describe("editing your own profile", () => {
  it("lets a rider change their display name", async () => {
    await assertSucceeds(
      updateDoc(doc(asRider(), "users", RIDER), {
        name: "Renamed",
        updatedAt: "2026-02-01T00:00:00.000Z",
      })
    );
  });

  it("refuses a rider rewriting when they joined", async () => {
    await assertFails(
      updateDoc(doc(asRider(), "users", RIDER), {
        createdAt: "2020-01-01T00:00:00.000Z",
      })
    );
  });

  it("refuses a rider changing the email their account is identified by", async () => {
    await assertFails(
      updateDoc(doc(asRider(), "users", RIDER), { email: "someone@else.com" })
    );
  });

  /* Out-of-band by design: a stolen session cannot destroy the record. */
  it("refuses deleting a profile at all", async () => {
    await assertFails(deleteDoc(doc(asRider(), "users", RIDER)));
    await assertFails(deleteDoc(doc(asAdmin(), "users", RIDER)));
  });
});

describe("tickets", () => {
  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();

      await setDoc(doc(db, "tickets", "t-rider"), ticket(RIDER));
      await setDoc(doc(db, "tickets", "t-other"), ticket(OTHER));
    });
  });

  it("lets a passenger read their own ticket", async () => {
    await assertSucceeds(getDoc(doc(asRider(), "tickets", "t-rider")));
  });

  it("refuses a passenger reading somebody else's ticket", async () => {
    await assertFails(getDoc(doc(asRider(), "tickets", "t-other")));
  });

  /*
    Ownership is part of the query, not merely a cap. Without the ownership
    term any signed-in account could page through everyone's journeys, emails
    and validation tokens.
  */
  it("lets a passenger list only their own tickets", async () => {
    const scoped = query(
      collection(asRider(), "tickets"),
      where("userId", "==", RIDER),
      limit(100)
    );

    await assertSucceeds(getDocs(scoped));
  });

  it("refuses an unscoped listing of every ticket", async () => {
    await assertFails(getDocs(collection(asRider(), "tickets")));
  });

  it("refuses a listing scoped to somebody else", async () => {
    const scoped = query(
      collection(asRider(), "tickets"),
      where("userId", "==", OTHER),
      limit(100)
    );

    await assertFails(getDocs(scoped));
  });

  it("refuses booking a ticket in somebody else's name", async () => {
    await assertFails(
      setDoc(doc(asRider(), "tickets", "t-new"), ticket(OTHER))
    );
  });

  it("lets a passenger cancel their own ticket", async () => {
    await assertSucceeds(
      updateDoc(doc(asRider(), "tickets", "t-rider"), {
        status: "CANCELLED",
        updatedAt: "2026-02-01T00:00:00.000Z",
      })
    );
  });

  /* Fare and journey are fixed at purchase; nobody re-prices their own trip. */
  it("refuses a passenger re-pricing their ticket", async () => {
    await assertFails(
      updateDoc(doc(asRider(), "tickets", "t-rider"), { fare: 0 })
    );
  });

  it("refuses a passenger reassigning a ticket to themselves", async () => {
    await assertFails(
      updateDoc(doc(asRider(), "tickets", "t-other"), { userId: RIDER })
    );
  });

  it("refuses deleting a ticket", async () => {
    await assertFails(deleteDoc(doc(asRider(), "tickets", "t-rider")));
  });
});

describe("announcements", () => {
  const notice = (over: Record<string, unknown> = {}) => ({
    title: "Sector 27 stop closed",
    body: "Board at Sector 29 until further notice.",
    severity: "WARNING",
    active: true,
    ...over,
  });

  it("is readable by a signed-out visitor", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "announcements", "a1"), notice());
    });

    await assertSucceeds(getDoc(doc(asVisitor(), "announcements", "a1")));
  });

  /*
    This collection is the one place a human's words are shown to passengers
    as fact, which is why authoring is admin-only and length-limited in the
    rules as well as the client - the client is the part an attacker controls.
  */
  it("refuses a rider publishing a notice", async () => {
    await assertFails(
      setDoc(doc(asRider(), "announcements", "a2"), notice())
    );
  });

  it("lets an admin publish a notice", async () => {
    await assertSucceeds(
      setDoc(doc(asAdmin(), "announcements", "a2"), notice())
    );
  });

  it("refuses a severity the app cannot render", async () => {
    await assertFails(
      setDoc(doc(asAdmin(), "announcements", "a3"), notice({ severity: "PANIC" }))
    );
  });

  it("refuses an empty notice", async () => {
    await assertFails(
      setDoc(doc(asAdmin(), "announcements", "a4"), notice({ title: "" }))
    );
  });

  it("refuses a notice longer than the screen can show", async () => {
    await assertFails(
      setDoc(
        doc(asAdmin(), "announcements", "a5"),
        notice({ title: "T".repeat(121) })
      )
    );
  });

  it("refuses a notice whose active flag is not a boolean", async () => {
    await assertFails(
      setDoc(doc(asAdmin(), "announcements", "a6"), notice({ active: "yes" }))
    );
  });

  it("refuses a rider retiring a notice", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "announcements", "a1"), notice());
    });

    await assertFails(deleteDoc(doc(asRider(), "announcements", "a1")));
  });
});

describe("everything not named in the rules", () => {
  /*
    Deny by default, so forgetting to write a rule for a new collection fails
    closed rather than exposing it.
  */
  it("is closed to a rider", async () => {
    await assertFails(getDoc(doc(asRider(), "somethingNew", "x")));
    await assertFails(setDoc(doc(asRider(), "somethingNew", "x"), { a: 1 }));
  });

  it("is closed to an admin too", async () => {
    await assertFails(setDoc(doc(asAdmin(), "somethingNew", "x"), { a: 1 }));
  });

  it("is closed to a signed-out visitor", async () => {
    await assertFails(getDoc(doc(asVisitor(), "somethingNew", "x")));
  });
});
