/**
 * Decides when a passenger should be told their bus is close.
 *
 * Input is already schema-validated and filtered for freshness by
 * `locationService`, so this module is concerned only with distance and with
 * when interrupting the passenger is warranted.
 */

import { ARRIVAL_RULES, NOTIFICATION_RULES } from "@/constants/config";
import { etaBetween } from "@/domain/geo";
import type { Coordinate } from "@/domain/transit/stops";
import { selectFreshBuses, type LiveBus } from "./locationService";

/** Minutes until the closest usable bus reaches a stop; null when none. */
export const selectNearestEta = (
  buses: LiveBus[],
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
