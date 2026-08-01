/**
 * Live bus positions.
 *
 * Two properties matter here. Positions are published to a world-readable
 * node, so nothing identifying may go into the payload; and only a driver may
 * publish at all. The Realtime Database itself is unavailable in tests, which
 * also exercises the degraded path the app has to survive in production when
 * the SDK cannot load.
 */

import { describe, expect, it, vi } from "vitest";
import {
  isLiveTrackingAvailable,
  publishLocation,
  selectFreshBuses,
  stopPublishing,
  subscribeToBuses,
  toBusId,
  type LiveBus,
} from "@/services/locationService";
import { ARRIVAL_RULES } from "@/constants/config";
import { AuthorizationError } from "@/domain/auth/errors";
import type { Actor } from "@/types/user";

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
