/**
 * Route registry.
 *
 * A route is a first-class object owning its identity, the stops it serves and
 * its human-readable description. Pages render routes; they never redeclare
 * them.
 */

import { haversineKm } from "../geo";
import { STOP_COORDS, type Coordinate, type StopName } from "./stops";

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

const ROUTE_101_STOPS: readonly StopName[] = [
  "HNLU",
  "Balco Medical Center",
  "Sector 30",
  "Sector 29",
  "Sector 27",
  "South Block",
  "Indravati Bhavan",
  "Mahanadi Bhavan",
  "North Block",
  "Ekatm Path",
  "CBD",
  "Sector 15",
  "Telibandha",
  "DKS Bhawan",
  "Raipur Railway Station",
];

/**
 * Route 102 is the express variant: it runs the same corridor but omits the
 * two Bhavan stops. This is the single declaration of that fact - the weekend
 * timetable used to encode it as empty strings in positional columns.
 */
const ROUTE_102_SKIPPED: readonly StopName[] = ["Indravati Bhavan", "Mahanadi Bhavan"];

const ROUTE_102_STOPS: readonly StopName[] = ROUTE_101_STOPS.filter(
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

/** Where a vehicle has reached along the route it is running. */
export interface RoutePosition {
  nearestStop: StopName;
  /** The stop after the nearest one; null at the end of the line. */
  nextStop: StopName | null;
  destination: StopName;
  /** How many of the route's stops are at or behind the vehicle. */
  stopsCovered: number;
  totalStops: number;
}

/**
 * Places a position against a route's stops.
 *
 * Both routes are declared in travel order and run the corridor in one
 * direction only, so the stop after the nearest one is genuinely the next one
 * a passenger will be picked up at. Nothing here is inferred from movement,
 * which means a stationary bus still reports honestly.
 */
export const locateOnRoute = (id: RouteId, at: Coordinate): RoutePosition | null => {
  const stops = ROUTES[id].servedStops;

  let nearestIndex = -1;
  let shortest = Infinity;

  stops.forEach((stop, index) => {
    const coord = STOP_COORDS[stop];

    if (!coord) return;

    const distance = haversineKm(at, coord);

    if (distance < shortest) {
      shortest = distance;
      nearestIndex = index;
    }
  });

  if (nearestIndex === -1) return null;

  return {
    nearestStop: stops[nearestIndex]!,
    nextStop: stops[nearestIndex + 1] ?? null,
    destination: stops[stops.length - 1]!,
    stopsCovered: nearestIndex + 1,
    totalStops: stops.length,
  };
};

const ROUTE_ID_SET: ReadonlySet<string> = new Set(ROUTE_IDS);

export const isRouteId = (value: unknown): value is RouteId =>
  typeof value === "string" && ROUTE_ID_SET.has(value);

export const NETWORK_ROUTE_IDS = [
  "trunk",
  "trunk-iim",
  "feeder-1",
  "feeder-2",
  "feeder-ext-1",
  "feeder-ext-2",
  "feeder-ext-3",
] as const;

export type NetworkRouteId = (typeof NETWORK_ROUTE_IDS)[number];

export interface NetworkRoute {
  id: NetworkRouteId;
  name: string;
  headline: string;
  servedStops: readonly StopName[];
}

export const NETWORK_ROUTES: Record<NetworkRouteId, NetworkRoute> = {
  "trunk": {
    id: "trunk",
    name: "Trunk Route",
    headline: "Raipur Railway Station to HNLU",
    servedStops: [
      "Raipur Railway Station",
      "DKS Bhawan",
      "Telibandha",
      "Agriculture College",
      "Sector 15",
      "CBD",
      "Ekatm Path",
      "North Block",
      "Mahanadi Bhavan",
      "Indravati Bhavan",
      "South Block",
      "Sector 27",
      "Sector 29",
      "Balco Medical Center",
      "HNLU",
    ],
  },
  "trunk-iim": {
    id: "trunk-iim",
    name: "Trunk Route (IIM branch)",
    headline: "Raipur Railway Station to IIM",
    servedStops: [
      "Raipur Railway Station",
      "DKS Bhawan",
      "Telibandha",
      "Agriculture College",
      "Sector 15",
      "CBD",
      "Ekatm Path",
      "North Block",
      "Mahanadi Bhavan",
      "Indravati Bhavan",
      "South Block",
      "Sector 27",
      "Sector 29",
      "Sector 30",
      "IIM",
    ],
  },
  "feeder-1": {
    id: "feeder-1",
    name: "Feeder Route 1",
    headline: "North Block to Nawagaon via NH53",
    servedStops: [
      "North Block",
      "Sector 17 Gate",
      "Sector 18 Gate",
      "Sector 17",
      "Sector 12",
      "Satya Sai Hospital",
      "Stadium",
      "Nawagaon",
    ],
  },
  "feeder-2": {
    id: "feeder-2",
    name: "Feeder Route 2",
    headline: "Sector 22 to Sector 30 via CBD Railway Station",
    servedStops: [
      "Sector 22",
      "CBD Railway Station",
      "Office Complex Block A B",
      "Sector 23",
      "Mantri Aawas",
      "CBD",
      "North Block",
      "South Block",
      "Sector 27",
      "Rakhi Village",
      "Sector 27-29 Mid",
      "Sector 30",
    ],
  },
  "feeder-ext-1": {
    id: "feeder-ext-1",
    name: "Feeder Route Ext. 1",
    headline: "HNLU to Thanaud via Jungle Safari",
    servedStops: [
      "HNLU",
      "Jungle Safari",
      "Rawatpura Sarkar University",
      "Thanaud",
    ],
  },
  "feeder-ext-2": {
    id: "feeder-ext-2",
    name: "Feeder Route Ext. 2",
    headline: "HNLU to NH 30 Chowk",
    servedStops: [
      "HNLU",
      "HNLU Gate",
      "NH 30 Chowk",
    ],
  },
  "feeder-ext-3": {
    id: "feeder-ext-3",
    name: "Feeder Route Ext. 3",
    headline: "HNLU to Muktangan",
    servedStops: [
      "HNLU",
      "IIIT",
      "Tribal Museum",
      "Muktangan",
    ],
  },
};

export const getNetworkRoute = (id: NetworkRouteId): NetworkRoute =>
  NETWORK_ROUTES[id];

const NETWORK_ROUTE_ID_SET: ReadonlySet<string> = new Set(NETWORK_ROUTE_IDS);

export const isNetworkRouteId = (value: unknown): value is NetworkRouteId =>
  typeof value === "string" && NETWORK_ROUTE_ID_SET.has(value);

export interface Interchange {
  stop: StopName;
  routes: readonly NetworkRouteId[];
}

export const INTERCHANGES: readonly Interchange[] = [
  { stop: "North Block", routes: ["trunk", "feeder-1", "feeder-2"] },
  { stop: "CBD", routes: ["trunk", "feeder-2"] },
  { stop: "South Block", routes: ["trunk", "feeder-2"] },
  { stop: "Sector 27", routes: ["trunk", "feeder-2"] },
  { stop: "Sector 30", routes: ["trunk-iim", "feeder-2"] },
  {
    stop: "HNLU",
    routes: ["trunk", "feeder-ext-1", "feeder-ext-2", "feeder-ext-3"],
  },
];

const INTERCHANGE_SET: ReadonlySet<string> = new Set(
  INTERCHANGES.map((interchange) => interchange.stop)
);

export const isInterchange = (stop: StopName): boolean =>
  INTERCHANGE_SET.has(stop);

export const getNetworkRoutes = (): NetworkRoute[] =>
  NETWORK_ROUTE_IDS.map(getNetworkRoute);

export const getRoutesServing = (stop: StopName): NetworkRoute[] =>
  getNetworkRoutes().filter((route) => route.servedStops.includes(stop));

export const getConnectedRoutes = (
  stop: StopName,
  from: NetworkRouteId
): NetworkRoute[] =>
  getRoutesServing(stop).filter((route) => route.id !== from);
