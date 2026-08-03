/**
 * Live bus positions.
 *
 * Two properties matter here. Positions are published to a world-readable
 * node, so nothing identifying may go into the payload; and only a driver may
 * publish at all.
 *
 * The database is switched off by default, which exercises the degraded path
 * the app has to survive when the SDK cannot load. The suites at the end call
 * `enableRtdb` to drive the real subscription and cleanup logic instead.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  isLiveTrackingAvailable,
  publishLocation,
  selectFreshBuses,
  stopPublishing,
  subscribeToBuses,
  toBusId,
  type LiveBus,
} from "@/services/locationService";
import { ARRIVAL_RULES, REMOTE_PATHS } from "@/constants/config";
import { AuthorizationError } from "@/domain/auth/errors";
import type { Actor } from "@/types/user";
import {
  dropRtdbConnection,
  enableRtdb,
  failNextRtdbSubscription,
  hasDisconnectCleanup,
  readRtdb,
  rtdbListenerCount,
  seedRtdb,
} from "../helpers/firebase";

const driver: Actor = { uid: "driver-1", role: "driver" };
const passenger: Actor = { uid: "user-1", role: "user" };
const admin: Actor = { uid: "admin-1", role: "admin" };

const NOW = 1_770_000_000_000;

const bus = (over: Partial<LiveBus> = {}): LiveBus => ({
  busId: "BUS-0001",
  lat: 21.2514,
  lng: 81.6296,
  updatedAt: NOW,
  ...over,
});

describe("bus labels", () => {
  it("is stable for the same driver", () => {
    expect(toBusId("driver-1")).toBe(toBusId("driver-1"));
  });

  it("differs between drivers", () => {
    expect(toBusId("driver-1")).not.toBe(toBusId("driver-2"));
  });

  it("does not contain the account id it was derived from", () => {
    // The label is published publicly; the uid must not be recoverable from it.
    const uid = "aVeryDistinctiveUid123";

    expect(toBusId(uid)).not.toContain(uid);
    expect(toBusId(uid)).toMatch(/^BUS-[0-9A-Z]{4}$/);
  });
});

describe("who may publish a position", () => {
  it("refuses a passenger", async () => {
    await expect(
      publishLocation(passenger, { latitude: 21.25, longitude: 81.62 })
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("refuses an admin, who does not hold this capability", async () => {
    await expect(
      publishLocation(admin, { latitude: 21.25, longitude: 81.62 })
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("refuses a signed-out caller", async () => {
    await expect(
      publishLocation(null, { latitude: 21.25, longitude: 81.62 })
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("allows a driver, and degrades quietly when tracking is unavailable", async () => {
    // The permission check passes; the write is skipped because the mocked
    // environment has no Realtime Database.
    await expect(
      publishLocation(driver, { latitude: 21.25, longitude: 81.62 })
    ).resolves.toBeUndefined();
  });
});

describe("when live tracking is unavailable", () => {
  it("reports itself as unavailable rather than throwing", async () => {
    expect(await isLiveTrackingAvailable()).toBe(false);
  });

  it("tells the subscriber instead of leaving it loading forever", async () => {
    const onBuses = vi.fn();
    const onError = vi.fn();

    subscribeToBuses(onBuses, onError);

    await vi.waitFor(() => expect(onError).toHaveBeenCalled());
    expect(onBuses).toHaveBeenCalledWith([]);
  });

  it("returns an unsubscribe that is safe to call immediately", () => {
    // A component that mounts and unmounts before the SDK resolves must not
    // leave a listener attached or throw on cleanup.
    const unsubscribe = subscribeToBuses(vi.fn());

    expect(() => unsubscribe()).not.toThrow();
  });

  it("stops publishing without error", async () => {
    await expect(stopPublishing(driver)).resolves.toBeUndefined();
  });

  it("ignores a stop request from a signed-out caller", async () => {
    await expect(stopPublishing(null)).resolves.toBeUndefined();
  });
});

describe("which positions still count as live", () => {
  it("keeps a position that reported recently", () => {
    expect(selectFreshBuses([bus()], NOW)).toHaveLength(1);
  });

  it("keeps a position reporting exactly on the threshold", () => {
    const edge = bus({ updatedAt: NOW - ARRIVAL_RULES.STALE_LOCATION_MS });

    expect(selectFreshBuses([edge], NOW)).toHaveLength(1);
  });

  it("drops a position older than the staleness window", () => {
    const old = bus({ updatedAt: NOW - ARRIVAL_RULES.STALE_LOCATION_MS - 1 });

    expect(selectFreshBuses([old], NOW)).toEqual([]);
  });

  it("keeps a position with no timestamp rather than discarding it", () => {
    expect(selectFreshBuses([bus({ updatedAt: undefined })], NOW)).toHaveLength(1);
  });

  it("keeps only the fresh half of a mixed fleet", () => {
    const fleet = [
      bus({ busId: "BUS-FRESH" }),
      bus({
        busId: "BUS-STALE",
        updatedAt: NOW - ARRIVAL_RULES.STALE_LOCATION_MS - 1,
      }),
    ];

    expect(selectFreshBuses(fleet, NOW).map((entry) => entry.busId)).toEqual([
      "BUS-FRESH",
    ]);
  });
});

describe("publishing to a database that is reachable", () => {
  const node = `${REMOTE_PATHS.BUS_LOCATIONS}/${driver.uid}`;

  beforeEach(() => {
    enableRtdb();
  });

  it("writes the position to the driver's own node", async () => {
    await publishLocation(driver, { latitude: 21.25, longitude: 81.62 });

    expect(readRtdb(node)).toMatchObject({ lat: 21.25, lng: 81.62 });
  });

  it("publishes the opaque label rather than the account it belongs to", async () => {
    await publishLocation(driver, { latitude: 21.25, longitude: 81.62 });

    const published = readRtdb(node) as Record<string, unknown>;

    expect(published.busId).toBe(toBusId(driver.uid));
    expect(Object.keys(published).sort()).toEqual([
      "busId",
      "lat",
      "lng",
      "updatedAt",
    ]);
    expect(JSON.stringify(published)).not.toContain(driver.uid);
  });

  it("refuses a coordinate that could not exist", async () => {
    const refused = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await publishLocation(driver, { latitude: 91, longitude: 81.62 });

    expect(readRtdb(node)).toBeUndefined();

    refused.mockRestore();
  });

  it("publishes the route the driver declared", async () => {
    await publishLocation(driver, { latitude: 21.25, longitude: 81.62 }, "102");

    expect(readRtdb(node)).toMatchObject({ routeId: "102" });
  });

  it("omits the route rather than guessing one", async () => {
    await publishLocation(driver, { latitude: 21.25, longitude: 81.62 });

    expect(readRtdb(node)).not.toHaveProperty("routeId");
  });

  it("clears the position when the driver stops", async () => {
    await publishLocation(driver, { latitude: 21.25, longitude: 81.62 });
    await stopPublishing(driver);

    expect(readRtdb(node)).toBeUndefined();
  });
});

describe("a driver who drops off the network", () => {
  const node = `${REMOTE_PATHS.BUS_LOCATIONS}/${driver.uid}`;

  beforeEach(() => {
    enableRtdb();
  });

  it("asks the server to clear the position if the connection dies", async () => {
    await publishLocation(driver, { latitude: 21.25, longitude: 81.62 });

    expect(hasDisconnectCleanup(node)).toBe(true);
  });

  it("is taken off the map without anyone stopping deliberately", async () => {
    await publishLocation(driver, { latitude: 21.25, longitude: 81.62 });

    expect(readRtdb(node)).toBeDefined();

    dropRtdbConnection();

    expect(readRtdb(node)).toBeUndefined();
  });

  it("leaves nothing behind in a world-readable database", async () => {
    await publishLocation(driver, { latitude: 21.25, longitude: 81.62 });

    dropRtdbConnection();

    const onBuses = vi.fn();
    subscribeToBuses(onBuses);

    await vi.waitFor(() => expect(onBuses).toHaveBeenCalledWith([]));
  });
});

describe("watching the fleet", () => {
  beforeEach(() => {
    enableRtdb();
  });

  it("reports every position that is reporting", async () => {
    seedRtdb(`${REMOTE_PATHS.BUS_LOCATIONS}/driver-9`, {
      lat: 21.25,
      lng: 81.62,
      updatedAt: NOW,
      busId: "BUS-ABCD",
    });

    const onBuses = vi.fn();
    subscribeToBuses(onBuses);

    await vi.waitFor(() =>
      expect(onBuses).toHaveBeenCalledWith([
        { lat: 21.25, lng: 81.62, updatedAt: NOW, busId: "BUS-ABCD" },
      ])
    );
  });

  it("carries the route through to the subscriber", async () => {
    seedRtdb(`${REMOTE_PATHS.BUS_LOCATIONS}/driver-9`, {
      lat: 21.25,
      lng: 81.62,
      updatedAt: NOW,
      busId: "BUS-ROUTE",
      routeId: "102",
    });

    const onBuses = vi.fn();
    subscribeToBuses(onBuses);

    await vi.waitFor(() =>
      expect(onBuses).toHaveBeenCalledWith([
        expect.objectContaining({ routeId: "102" }),
      ])
    );
  });

  it("drops an entry claiming a route that does not exist", async () => {
    seedRtdb(`${REMOTE_PATHS.BUS_LOCATIONS}/driver-9`, {
      lat: 21.25,
      lng: 81.62,
      updatedAt: NOW,
      routeId: "999",
    });

    const onBuses = vi.fn();
    subscribeToBuses(onBuses);

    await vi.waitFor(() => expect(onBuses).toHaveBeenCalledWith([]));
  });

  it("labels a vehicle that never published one", async () => {
    seedRtdb(`${REMOTE_PATHS.BUS_LOCATIONS}/driver-9`, {
      lat: 21.25,
      lng: 81.62,
      updatedAt: NOW,
    });

    const onBuses = vi.fn();
    subscribeToBuses(onBuses);

    await vi.waitFor(() =>
      expect(onBuses).toHaveBeenCalledWith([
        expect.objectContaining({ busId: toBusId("driver-9") }),
      ])
    );
  });

  it("drops a hostile entry without losing the rest of the fleet", async () => {
    seedRtdb(`${REMOTE_PATHS.BUS_LOCATIONS}/good`, {
      lat: 21.25,
      lng: 81.62,
      updatedAt: NOW,
      busId: "BUS-GOOD",
    });
    seedRtdb(`${REMOTE_PATHS.BUS_LOCATIONS}/bad`, {
      lat: "not a latitude",
      lng: 81.62,
    });

    const onBuses = vi.fn();
    subscribeToBuses(onBuses);

    await vi.waitFor(() =>
      expect(onBuses).toHaveBeenCalledWith([
        expect.objectContaining({ busId: "BUS-GOOD" }),
      ])
    );
  });

  it("reports an empty fleet when nothing is running", async () => {
    const onBuses = vi.fn();
    subscribeToBuses(onBuses);

    await vi.waitFor(() => expect(onBuses).toHaveBeenCalledWith([]));
  });

  it("delivers a position that arrives after the subscription", async () => {
    const onBuses = vi.fn();
    subscribeToBuses(onBuses);

    await vi.waitFor(() => expect(onBuses).toHaveBeenCalledWith([]));

    seedRtdb(`${REMOTE_PATHS.BUS_LOCATIONS}/driver-9`, {
      lat: 21.25,
      lng: 81.62,
      updatedAt: NOW,
      busId: "BUS-LATE",
    });

    await vi.waitFor(() =>
      expect(onBuses).toHaveBeenLastCalledWith([
        expect.objectContaining({ busId: "BUS-LATE" }),
      ])
    );
  });

  it("detaches the listener when the caller unsubscribes", async () => {
    const unsubscribe = subscribeToBuses(vi.fn());

    await vi.waitFor(() =>
      expect(rtdbListenerCount(REMOTE_PATHS.BUS_LOCATIONS)).toBe(1)
    );

    unsubscribe();

    expect(rtdbListenerCount(REMOTE_PATHS.BUS_LOCATIONS)).toBe(0);
  });

  it("reports a refused subscription rather than showing a stale fleet", async () => {
    const refused = vi.spyOn(console, "error").mockImplementation(() => undefined);

    failNextRtdbSubscription();

    const onBuses = vi.fn();
    const onError = vi.fn();

    subscribeToBuses(onBuses, onError);

    await vi.waitFor(() => expect(onError).toHaveBeenCalled());
    expect(onBuses).toHaveBeenCalledWith([]);

    refused.mockRestore();
  });
});
