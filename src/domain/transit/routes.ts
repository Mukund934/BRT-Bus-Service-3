/**
 * Route registry.
 *
 * A route is a first-class object owning its identity, the stops it serves and
 * its human-readable description. Pages render routes; they never redeclare
 * them.
 */

import { STOPS, type StopName } from "./stops";

export const ROUTE_IDS = ["101", "102"] as const;

export type RouteId = (typeof ROUTE_IDS)[number];

export interface Route {
  id: RouteId;
  /** Display name, e.g. "Route 101". */
  name: string;
  /** Where the route starts and ends, for captions and cards. */
  headline: string;
  /** Stops this route calls at, in travel order. */
  servedStops: readonly StopName[];
}

const ROUTE_101_STOPS: readonly StopName[] = STOPS;

/**
 * Route 102 is the express variant: it runs the same corridor but omits the
 * two Bhavan stops. This is the single declaration of that fact - the weekend
 * timetable used to encode it as empty strings in positional columns.
 */
const ROUTE_102_SKIPPED: readonly StopName[] = ["Indravati Bhavan", "Mahanadi Bhavan"];

const ROUTE_102_STOPS: readonly StopName[] = STOPS.filter(
  (stop) => !ROUTE_102_SKIPPED.includes(stop)
);

export const ROUTES: Record<RouteId, Route> = {
  "101": {
    id: "101",
    name: "Route 101",
    headline: "HNLU to Raipur Railway Station",
    servedStops: ROUTE_101_STOPS,
  },
  "102": {
    id: "102",
    name: "Route 102",
    headline: "HNLU to Raipur Railway Station (Express)",
    servedStops: ROUTE_102_STOPS,
  },
};

export const getRoute = (id: RouteId): Route => ROUTES[id];

const ROUTE_ID_SET: ReadonlySet<string> = new Set(ROUTE_IDS);

export const isRouteId = (value: unknown): value is RouteId =>
  typeof value === "string" && ROUTE_ID_SET.has(value);
