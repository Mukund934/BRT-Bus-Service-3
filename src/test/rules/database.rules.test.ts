/**
 * The Realtime Database rules, enforced by Firebase rather than read by us.
 *
 * `src/test/security/rules-contract.test.ts` proves the rules JSON agrees with
 * the domain. It cannot prove the evaluator agrees with either, and the two
 * are genuinely different claims: a `.validate` in the wrong node, a cascade
 * that grants where we thought it denied, or a `matches()` anchored wrongly
 * all read as correct and behave differently under the engine.
 *
 * This is the only place the `driverAllowlist` gate is actually exercised.
 * Nothing else can: no client may read that node, the repo's Firebase mock
 * enforces no rules at all, and the rules are not deployed yet.
 *
 * Run with `npm run test:rules`, which starts the emulator around it.
 */

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { get, ref, remove, serverTimestamp, set } from "firebase/database";
import { ROUTE_IDS } from "@/domain/transit/routes";

const DRIVER = "driver-allowed";
const OUTSIDER = "driver-not-allowed";

let env: RulesTestEnvironment;

/** A telemetry payload the rules should accept, before any field is broken. */
const validPosition = (over: Record<string, unknown> = {}) => ({
  lat: 21.25,
  lng: 81.63,
  updatedAt: Date.now(),
  busId: "BUS-01",
  routeId: "101",
  ...over,
});

const positionRef = (db: unknown, uid: string) =>
  ref(db as Parameters<typeof ref>[0], `busLocations/${uid}`);

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-brt",
    database: {
      rules: readFileSync("database.rules.json", "utf8"),
      host: "127.0.0.1",
      port: 9000,
    },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearDatabase();

  /*
    Seeded with the rules bypassed, which is the only way it can be: the
    allowlist is unwritable by every client BY DESIGN, because it is a list of
    driver UIDs and publishing it would recreate the personal-data exposure
    that stripping names off the public map was meant to end. In production
    this node is populated from the Firebase console or the Admin SDK.

    That makes this a FIXTURE, not a development driver and not a production
    one. No real UID appears anywhere in this file.
  */
  await env.withSecurityRulesDisabled(async (context) => {
    await set(ref(context.database(), `driverAllowlist/${DRIVER}`), true);
  });
});

describe("who may publish a bus position", () => {
  it("lets an allowlisted driver write their own position", async () => {
    const db = env.authenticatedContext(DRIVER).database();

    await assertSucceeds(set(positionRef(db, DRIVER), validPosition()));
  });

  /*
    The gate the whole design rests on. Being signed in is not enough, and
    holding the Firestore `driver` role is not enough either - Realtime
    Database rules cannot read Firestore, which is exactly why the allowlist
    exists as a separate grant.
  */
  it("refuses a signed-in driver who is not on the allowlist", async () => {
    const db = env.authenticatedContext(OUTSIDER).database();

    await assertFails(set(positionRef(db, OUTSIDER), validPosition()));
  });

  it("refuses an unauthenticated write", async () => {
    const db = env.unauthenticatedContext().database();

    await assertFails(set(positionRef(db, DRIVER), validPosition()));
  });

  /* An allowlisted driver is still only allowed to be themselves. */
  it("refuses an allowlisted driver writing under someone else's uid", async () => {
    const db = env.authenticatedContext(DRIVER).database();

    await assertFails(set(positionRef(db, OUTSIDER), validPosition()));
  });

  it("lets a driver clear their own position when service ends", async () => {
    const db = env.authenticatedContext(DRIVER).database();

    await assertSucceeds(set(positionRef(db, DRIVER), validPosition()));
    await assertSucceeds(remove(positionRef(db, DRIVER)));
  });

  /*
    Revocation has to bite immediately - removing the allowlist entry is the
    operator's only lever if a device or account is compromised.
  */
  it("stops a driver the moment they are removed from the allowlist", async () => {
    const db = env.authenticatedContext(DRIVER).database();

    await assertSucceeds(set(positionRef(db, DRIVER), validPosition()));

    await env.withSecurityRulesDisabled(async (context) => {
      await remove(ref(context.database(), `driverAllowlist/${DRIVER}`));
    });

    await assertFails(set(positionRef(db, DRIVER), validPosition()));
  });

  it("publishes nothing at all while the allowlist is empty", async () => {
    await env.clearDatabase();

    const db = env.authenticatedContext(DRIVER).database();

    await assertFails(set(positionRef(db, DRIVER), validPosition()));
  });
});

describe("the routes a position may claim", () => {
  /*
    Derived from ROUTE_IDS, so opening a route without widening the rules
    fails here. The failure mode is severe and silent: a rejected field
    rejects the ENTIRE write, so the bus does not appear mislabelled, it does
    not appear at all - while the driver's app reports it is sharing.
  */
  it.each([...ROUTE_IDS])("accepts published route %s", async (routeId) => {
    const db = env.authenticatedContext(DRIVER).database();

    await assertSucceeds(
      set(positionRef(db, DRIVER), validPosition({ routeId }))
    );
  });

  it.each(["999", "10", "1011", "abc", "", "101x"])(
    "refuses unpublished route %s",
    async (routeId) => {
      const db = env.authenticatedContext(DRIVER).database();

      await assertFails(
        set(positionRef(db, DRIVER), validPosition({ routeId }))
      );
    }
  );
});

/*
  The load-bearing change of the ingest design (ARCHITECTURE-2.0 SS11.6).

  Until now `updatedAt` was whatever the publishing device said it was, and
  every freshness decision in the product rested on it. A device with a wrong
  clock - or a hostile one - could pin itself permanently fresh, and no amount
  of care on the reading side could detect that.

  The rules now require the claimed time to sit inside a narrow window around
  the SERVER's clock, which `ServerValue.TIMESTAMP` satisfies by construction
  and a guessed value does not. That removes the device clock from the trust
  model, and it is what makes the throttle below possible at all: a rate limit
  measured in times the client controls is not a rate limit.
*/
describe("whose clock decides when a position was taken", () => {
  const publish = (payload: Record<string, unknown>) => {
    const db = env.authenticatedContext(DRIVER).database();

    return set(positionRef(db, DRIVER), payload);
  };

  it("accepts a server-stamped time", async () => {
    await assertSucceeds(
      publish(validPosition({ updatedAt: serverTimestamp() }))
    );
  });

  it("accepts a client clock that agrees with the server", async () => {
    await assertSucceeds(publish(validPosition({ updatedAt: Date.now() })));
  });

  /*
    The permanently-fresh attack. `locationService` judges staleness by
    comparing `updatedAt` to now, so a timestamp in the future never ages -
    the bus would sit on the public map indefinitely, at a position nobody is
    at any more.
  */
  it("refuses a clock running ahead of the server", async () => {
    await assertFails(publish(validPosition({ updatedAt: Date.now() + 30_000 })));
  });

  it("refuses a clock running behind the server", async () => {
    await assertFails(publish(validPosition({ updatedAt: Date.now() - 30_000 })));
  });

  it("refuses a position back-dated to look older than it is", async () => {
    await assertFails(publish(validPosition({ updatedAt: 1 })));
  });
});

/*
  A server-enforced throttle, which the free tier provides nowhere else.

  Drivers publish every 15 s, so a 5 s floor never touches ordinary jitter.
  What it stops is a device - or a harvested token replayed against the REST
  API - writing thousands of times a second into a world-readable node, which
  is the one abuse no client-side check can prevent and the one that would
  actually cost money.
*/
describe("how often a bus may report", () => {
  const publish = () => {
    const db = env.authenticatedContext(DRIVER).database();

    return set(
      positionRef(db, DRIVER),
      validPosition({ updatedAt: serverTimestamp() })
    );
  };

  it("refuses a second position immediately after the first", async () => {
    await assertSucceeds(publish());
    await assertFails(publish());
  });

  it("allows the next one once the floor has passed", async () => {
    await assertSucceeds(publish());

    await new Promise((resolve) => setTimeout(resolve, 5_200));

    await assertSucceeds(publish());
  }, 20_000);

  /*
    Stopping a shift must never be throttled. A driver who finishes and
    cannot clear their position leaves a phantom bus on the public map, which
    is worse than any write they could have made.
  */
  it("never throttles clearing a position", async () => {
    const db = env.authenticatedContext(DRIVER).database();

    await assertSucceeds(publish());
    await assertSucceeds(remove(positionRef(db, DRIVER)));
  });

  it("lets a driver start again straight after stopping", async () => {
    const db = env.authenticatedContext(DRIVER).database();

    await assertSucceeds(publish());
    await assertSucceeds(remove(positionRef(db, DRIVER)));
    await assertSucceeds(publish());
  });
});

describe("what a position must look like", () => {
  const rejects = async (over: Record<string, unknown>) => {
    const db = env.authenticatedContext(DRIVER).database();

    await assertFails(set(positionRef(db, DRIVER), validPosition(over)));
  };

  it("refuses a position with no latitude", async () => {
    const db = env.authenticatedContext(DRIVER).database();
    const { lat: _lat, ...withoutLat } = validPosition();

    await assertFails(set(positionRef(db, DRIVER), withoutLat));
  });

  it("refuses a latitude off the planet", () => rejects({ lat: 91 }));
  it("refuses a longitude off the planet", () => rejects({ lng: -181 }));
  it("refuses a latitude that is not a number", () => rejects({ lat: "21.25" }));

  /*
    A device with a wrong clock could otherwise pin itself permanently fresh:
    the staleness rule in `locationService` compares `updatedAt` to now, so a
    timestamp far in the future would read as a bus that never goes stale.
  */
  it("refuses a timestamp far in the future", () =>
    rejects({ updatedAt: Date.now() + 600_000 }));

  it("refuses a bus id longer than the contract allows", () =>
    rejects({ busId: "B".repeat(17) }));

  /*
    `$other: false` is what keeps the payload from growing into a channel for
    anything else - a driver name, a phone number, a passenger count nobody
    verified.
  */
  it("refuses a field the contract does not define", () =>
    rejects({ passengerCount: 30 }));

  it("refuses a driver's name smuggled into the payload", () =>
    rejects({ driverName: "Someone Real" }));
});

describe("who may read what", () => {
  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await set(
        ref(context.database(), `busLocations/${DRIVER}`),
        validPosition()
      );
    });
  });

  /*
    Public by design: the map has to work for a passenger who has not signed
    in, and the payload carries no personal data precisely so it can be.
  */
  it("lets a signed-out passenger read bus positions", async () => {
    const db = env.unauthenticatedContext().database();

    await assertSucceeds(get(ref(db, "busLocations")));
  });

  it("keeps the driver allowlist unreadable, even to a driver on it", async () => {
    const db = env.authenticatedContext(DRIVER).database();

    await assertFails(get(ref(db, "driverAllowlist")));
  });

  it("keeps a single allowlist entry unreadable too", async () => {
    const db = env.authenticatedContext(DRIVER).database();

    await assertFails(get(ref(db, `driverAllowlist/${DRIVER}`)));
  });

  it("refuses to let anyone add themselves to the allowlist", async () => {
    const db = env.authenticatedContext(OUTSIDER).database();

    await assertFails(set(ref(db, `driverAllowlist/${OUTSIDER}`), true));
  });

  it("refuses to let anyone replace the whole allowlist", async () => {
    const db = env.authenticatedContext(DRIVER).database();

    await assertFails(set(ref(db, "driverAllowlist"), { [OUTSIDER]: true }));
  });

  /* Deny by default: anything not named in the rules is closed. */
  it("refuses reads and writes outside the two declared nodes", async () => {
    const db = env.authenticatedContext(DRIVER).database();

    await assertFails(get(ref(db, "anythingElse")));
    await assertFails(set(ref(db, "anythingElse/x"), true));
  });
});

describe("the rules file these tests ran against", () => {
  /*
    Guards the harness itself. If the emulator were ever handed different
    rules than the repo's - a stale copy, a wrong path - every assertion above
    would still pass or fail for reasons unrelated to what ships.
  */
  it("is the one the application deploys", () => {
    const rules = readFileSync("database.rules.json", "utf8");

    expect(rules).toContain("driverAllowlist");
    expect(JSON.parse(rules)).toHaveProperty("rules.busLocations");
  });
});
