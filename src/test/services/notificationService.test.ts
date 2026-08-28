/**
 * Arrival-alert logic.
 *
 * Extracted from the component in Sprint 4 precisely so it could be tested
 * without a live database connection. The rules that matter: a stale position
 * must not trigger an alert, the nearest bus wins, and the same alert must
 * not fire repeatedly.
 */

import { DEFAULT_FRESHNESS } from "@/domain/fleet/state";
import { describe, expect, it, vi } from "vitest";
import { ARRIVAL_RULES, NOTIFICATION_RULES } from "@/constants/config";
import {
  createAlertThrottle,
  requestAlertPermission,
  selectNearestDistanceKm,
  shouldAlert,
} from "@/services/notificationService";
import type { LiveBus } from "@/services/locationService";
import { STOP_COORDS } from "@/domain/transit/stops";

const NOW = 1_700_000_000_000;
const stop = STOP_COORDS["HNLU"]!;

const bus = (over: Partial<LiveBus> = {}): LiveBus => ({
  busId: "BUS-0001",
  lat: stop.lat,
  lng: stop.lng,
  updatedAt: NOW,
  ...over,
});

describe("measuring how close the nearest bus is", () => {
  it("reports no distance when nothing is reporting", () => {
    expect(selectNearestDistanceKm([], stop, NOW)).toBeNull();
  });

  it("reports no distance when every bus is stale", () => {
    const old = bus({ updatedAt: NOW - DEFAULT_FRESHNESS.staleMs - 1 });

    expect(selectNearestDistanceKm([old], stop, NOW)).toBeNull();
  });

  it("is zero for a bus already at the stop", () => {
    expect(selectNearestDistanceKm([bus()], stop, NOW)).toBe(0);
  });

  it("picks the nearest bus, not the first", () => {
    const far = bus({ busId: "FAR", lat: stop.lat + 0.5, lng: stop.lng + 0.5 });
    const near = bus({ busId: "NEAR", lat: stop.lat + 0.01 });

    const withFarFirst = selectNearestDistanceKm([far, near], stop, NOW);
    const withNearFirst = selectNearestDistanceKm([near, far], stop, NOW);

    expect(withFarFirst).toBe(withNearFirst);
    expect(withFarFirst!).toBeLessThan(selectNearestDistanceKm([far], stop, NOW)!);
  });

  it("grows with distance", () => {
    const near = selectNearestDistanceKm([bus({ lat: stop.lat + 0.02 })], stop, NOW)!;
    const far = selectNearestDistanceKm([bus({ lat: stop.lat + 0.2 })], stop, NOW)!;

    expect(far).toBeGreaterThan(near);
  });

  /*
    The defect this replaced: distance was divided by an assumed 30 km/h and
    published as minutes. A kilometre reading must stay a kilometre reading.
  */
  it("returns kilometres, not minutes", () => {
    const oneStopNorth = bus({ lat: stop.lat + 0.01 });

    const km = selectNearestDistanceKm([oneStopNorth], stop, NOW)!;

    expect(km).toBeGreaterThan(1);
    expect(km).toBeLessThan(1.3);
  });
});

describe("deciding whether to interrupt the passenger", () => {
  it("alerts inside the threshold", () => {
    expect(shouldAlert(ARRIVAL_RULES.ALERT_RADIUS_KM)).toBe(true);
  });

  it("stays quiet outside it", () => {
    expect(shouldAlert(ARRIVAL_RULES.ALERT_RADIUS_KM + 0.1)).toBe(false);
  });

  it("stays quiet when nothing is reporting at all", () => {
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

describe("asking to raise browser alerts", () => {
  const notification = () =>
    window.Notification as unknown as {
      permission: string;
      requestPermission: ReturnType<typeof vi.fn>;
    };

  it("asks once the passenger has switched alerts on", async () => {
    await requestAlertPermission();

    expect(notification().requestPermission).toHaveBeenCalled();
  });

  it("does not ask again once the choice has been made", async () => {
    notification().permission = "denied";

    await requestAlertPermission();

    expect(notification().requestPermission).not.toHaveBeenCalled();
  });

  it("does nothing on a browser without notifications", async () => {
    Reflect.deleteProperty(window, "Notification");

    await expect(requestAlertPermission()).resolves.toBeUndefined();
  });

  it("treats a refusal as an ordinary outcome", async () => {
    notification().requestPermission.mockRejectedValueOnce(new Error("blocked"));

    await expect(requestAlertPermission()).resolves.toBeUndefined();
  });
});
