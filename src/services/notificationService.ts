/**
 * Decides when a passenger should be told their bus is close.
 *
 * Input is already schema-validated and filtered for freshness by
 * `locationService`, so this module is concerned only with distance and with
 * when interrupting the passenger is warranted.
 */

import { ARRIVAL_RULES, NOTIFICATION_RULES } from "@/constants/config";
import { haversineKm } from "@/domain/geo";
import { hasPosition } from "@/domain/fleet/telemetry";
import type { Coordinate } from "@/domain/transit/stops";
import { classifyBuses, type LiveBus } from "./locationService";

/**
 * Straight-line distance to the closest usable bus, in kilometres; null when
 * nothing is reporting.
 *
 * Deliberately not an arrival time. The distance is honest about what the app
 * observed - a position, and how far it is from the stop in a straight line.
 * It says nothing about the road, the route the bus is on, or the direction it
 * is travelling, so it must never be presented to a passenger as minutes.
 */
export const selectNearestDistanceKm = (
  buses: LiveBus[],
  stop: Coordinate,
  now = Date.now()
): number | null => {
  let best: number | null = null;

  /*
    LIVE and RECENT only, not the full passenger-visible set.

    A map may draw a STALE vehicle, because the dot sits next to the age and a
    reader can weigh it. A push notification carries no age at all - it says
    "your bus is near" - so alerting on a position that may be five minutes
    old would tell somebody to run for a bus that has already gone.
  */
  for (const { telemetry } of classifyBuses(buses, now).filter(
    (vehicle) => vehicle.state === "LIVE" || vehicle.state === "RECENT"
  )) {
    // The contract allows a vehicle with no position, and real feeds publish
    // them. One cannot be near anything.
    if (!hasPosition(telemetry)) continue;

    const distance = haversineKm({ lat: telemetry.lat, lng: telemetry.lng }, stop);
    if (best === null || distance < best) best = distance;
  }

  return best;
};

/** Whether a bus is close enough to be worth interrupting the passenger. */
export const shouldAlert = (distanceKm: number | null): distanceKm is number =>
  distanceKm !== null && distanceKm <= ARRIVAL_RULES.ALERT_RADIUS_KM;

/**
 * Asks the browser to allow arrival alerts.
 *
 * Called when a passenger switches alerts on, rather than on page load, so the
 * prompt follows a deliberate choice instead of interrupting every visitor.
 * A refusal is not an error: the in-app popup still works without it.
 */
export const requestAlertPermission = async (): Promise<void> => {
  if (!("Notification" in window) || Notification.permission !== "default") return;

  try {
    await Notification.requestPermission();
  } catch {
    return;
  }
};

/**
 * Tracks which alerts have already fired so a bus lingering near a stop does
 * not notify repeatedly. Keyed by route and stop.
 */
export const createAlertThrottle = () => {
  const lastSentAt = new Map<string, number>();

  return {
    /** Records the alert and reports whether it should be shown now. */
    claim(routeId: string, stop: string, now = Date.now()): boolean {
      const key = `${routeId}::${stop}`;
      const previous = lastSentAt.get(key);

      if (
        previous !== undefined &&
        now - previous < NOTIFICATION_RULES.DEDUPE_WINDOW_MS
      ) {
        return false;
      }

      lastSentAt.set(key, now);
      return true;
    },
  };
};
