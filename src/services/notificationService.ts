/**
 * Decides when a passenger should be told their bus is close.
 *
 * The ETA maths used to live inside the ArrivalMonitor component alongside
 * the Realtime Database subscription, which made it impossible to exercise
 * without a live connection.
 */

import { ARRIVAL_RULES, NOTIFICATION_RULES } from "@/constants/config";
import { etaBetween } from "@/domain/geo";
import type { Coordinate } from "@/domain/transit/stops";

/** A live driver position as published to the Realtime Database. */
export interface BusPosition {
  lat: number;
  lng: number;
  name?: string;
  email?: string;
  /** Epoch milliseconds of the last update. */
  updatedAt?: number;
}

const isUsable = (bus: unknown): bus is BusPosition =>
  typeof bus === "object" &&
  bus !== null &&
  typeof (bus as BusPosition).lat === "number" &&
  typeof (bus as BusPosition).lng === "number";

/** Drops malformed entries and positions that have gone stale. */
export const selectFreshBuses = (
  buses: unknown[],
  now = Date.now()
): BusPosition[] =>
  buses.filter(
    (bus): bus is BusPosition =>
      isUsable(bus) &&
      !(bus.updatedAt !== undefined &&
        now - bus.updatedAt > ARRIVAL_RULES.STALE_LOCATION_MS)
  );

/**
 * Minutes until the closest usable bus reaches a stop.
 *
 * Null when no bus is reporting a fresh position.
 */
export const selectNearestEta = (
  buses: unknown[],
  stop: Coordinate,
  now = Date.now()
): number | null => {
  let best: number | null = null;

  for (const bus of selectFreshBuses(buses, now)) {
    const eta = etaBetween({ lat: bus.lat, lng: bus.lng }, stop);
    if (best === null || eta < best) best = eta;
  }

  return best;
};

/** Whether an ETA is close enough to be worth interrupting the passenger. */
export const shouldAlert = (etaMinutes: number | null): etaMinutes is number =>
  etaMinutes !== null && etaMinutes <= ARRIVAL_RULES.ALERT_MINUTES;

/**
 * Tracks which alerts have already fired so a bus circling a stop does not
 * notify repeatedly. Keyed by route and stop.
 */
export const createAlertThrottle = () => {
  const lastSentAt = new Map<string, number>();

  return {
    /** Records the alert and reports whether it should be shown now. */
    claim(routeId: string, stop: string, now = Date.now()): boolean {
      const key = `${routeId}::${stop}`;
      const previous = lastSentAt.get(key);

      if (previous !== undefined && now - previous < NOTIFICATION_RULES.DEDUPE_WINDOW_MS) {
        return false;
      }

      lastSentAt.set(key, now);
      return true;
    },
  };
};
