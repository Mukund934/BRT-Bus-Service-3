/**
 * Arrival-alert logic.
 *
 * Extracted from the component in Sprint 4 precisely so it could be tested
 * without a live database connection. The rules that matter: a stale position
 * must not trigger an alert, the nearest bus wins, and the same alert must
 * not fire repeatedly.
 */

import { describe, expect, it } from "vitest";
import { ARRIVAL_RULES, NOTIFICATION_RULES } from "@/constants/config";
import {
  createAlertThrottle,
  selectFreshBuses,
  selectNearestEta,
  shouldAlert,
} from "@/services/notificationService";
import type { LiveBus } from "@/services/locationService";
import { STOP_COORDS } from "@/domain/transit/stops";

const NOW = 1_700_000_000_000;
const stop = STOP_COORDS["HNLU"];

const bus = (over: Partial<LiveBus> = {}): LiveBus => ({
  busId: "BUS-0001",
  lat: stop.lat,
  lng: stop.lng,
  updatedAt: NOW,
  ...over,
});

describe("stale positions", () => {
  it("keeps a position that reported recently", () => {
    expect(selectFreshBuses([bus()], NOW)).toHaveLength(1);
  });

  it("drops a position older than the staleness window", () => {
    // A parked or crashed driver app leaves its last position forever;
    // alerting on it would announce a bus that is not moving.
    const old = bus({ updatedAt: NOW - ARRIVAL_RULES.STALE_LOCATION_MS - 1 });

    expect(selectFreshBuses([old], NOW)).toEqual([]);
  });

  it("keeps a position with no timestamp rather than discarding it", () => {
    expect(selectFreshBuses([bus({ updatedAt: undefined })], NOW)).toHaveLength(1);
  });
});

describe("estimating arrival", () => {
  it("reports no estimate when nothing is reporting", () => {
    expect(selectNearestEta([], stop, NOW)).toBeNull();
  });

  it("reports no estimate when every bus is stale", () => {
    const old = bus({ updatedAt: NOW - ARRIVAL_RULES.STALE_LOCATION_MS - 1 });

    expect(selectNearestEta([old], stop, NOW)).toBeNull();
  });

  it("is zero minutes for a bus already at the stop", () => {
    expect(selectNearestEta([bus()], stop, NOW)).toBe(0);
  });

  it("picks the nearest bus, not the first", () => {
    const far = bus({ busId: "FAR", lat: stop.lat + 0.5, lng: stop.lng + 0.5 });
    const near = bus({ busId: "NEAR", lat: stop.lat + 0.01 });

    const withFarFirst = selectNearestEta([far, near], stop, NOW);
    const withNearFirst = selectNearestEta([near, far], stop, NOW);

    expect(withFarFirst).toBe(withNearFirst);
    expect(withFarFirst!).toBeLessThan(selectNearestEta([far], stop, NOW)!);
  });

  it("grows with distance", () => {
    const near = selectNearestEta([bus({ lat: stop.lat + 0.02 })], stop, NOW)!;
    const far = selectNearestEta([bus({ lat: stop.lat + 0.2 })], stop, NOW)!;

    expect(far).toBeGreaterThan(near);
  });
});

describe("deciding whether to interrupt the passenger", () => {
  it("alerts inside the threshold", () => {
    expect(shouldAlert(ARRIVAL_RULES.ALERT_MINUTES)).toBe(true);
  });

  it("stays quiet outside it", () => {
    expect(shouldAlert(ARRIVAL_RULES.ALERT_MINUTES + 1)).toBe(false);
  });

  it("stays quiet when there is no estimate at all", () => {
    expect(shouldAlert(null)).toBe(false);
  });
});

describe("alert throttling", () => {
  it("allows the first alert for a stop", () => {
    const throttle = createAlertThrottle();

    expect(throttle.claim("101", "HNLU", NOW)).toBe(true);
  });

  it("suppresses a repeat inside the dedupe window", () => {
    const throttle = createAlertThrottle();
    throttle.claim("101", "HNLU", NOW);

    expect(throttle.claim("101", "HNLU", NOW + 1000)).toBe(false);
  });

  it("allows the alert again once the window has passed", () => {
    const throttle = createAlertThrottle();
    throttle.claim("101", "HNLU", NOW);

    const later = NOW + NOTIFICATION_RULES.DEDUPE_WINDOW_MS + 1;
    expect(throttle.claim("101", "HNLU", later)).toBe(true);
  });

  it("tracks each route and stop separately", () => {
    const throttle = createAlertThrottle();
    throttle.claim("101", "HNLU", NOW);

    expect(throttle.claim("102", "HNLU", NOW)).toBe(true);
    expect(throttle.claim("101", "CBD", NOW)).toBe(true);
  });
});
