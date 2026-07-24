import { describe, expect, it } from "vitest";
import {
  INTERCHANGES,
  NETWORK_ROUTES,
  NETWORK_ROUTE_IDS,
  getNetworkRoute,
  isInterchange,
  isNetworkRouteId,
} from "@/domain/transit/routes";
import { STOPS, isStopName } from "@/domain/transit/stops";

const networkRoutes = NETWORK_ROUTE_IDS.map(getNetworkRoute);

describe("stop registry", () => {
  it("declares every stop exactly once", () => {
    expect(new Set(STOPS).size).toBe(STOPS.length);
  });

  it("narrows every declared stop", () => {
    for (const stop of STOPS) {
      expect(isStopName(stop)).toBe(true);
    }
  });
});

describe("official network routes", () => {
  it("registers every declared route id", () => {
    for (const id of NETWORK_ROUTE_IDS) {
      expect(NETWORK_ROUTES[id].id).toBe(id);
      expect(isNetworkRouteId(id)).toBe(true);
    }

    expect(Object.keys(NETWORK_ROUTES)).toHaveLength(NETWORK_ROUTE_IDS.length);
  });

  it("references only stops that exist in the registry", () => {
    const unknown: string[] = [];

    for (const route of networkRoutes) {
      for (const stop of route.servedStops) {
        if (!isStopName(stop)) unknown.push(`${route.id}: ${stop}`);
      }
    }

    expect(unknown).toEqual([]);
  });

  it("calls at each of its stops exactly once", () => {
    for (const route of networkRoutes) {
      expect(new Set(route.servedStops).size).toBe(route.servedStops.length);
    }
  });

  it("runs between at least two stops", () => {
    for (const route of networkRoutes) {
      expect(route.servedStops.length).toBeGreaterThan(1);
    }
  });

  it("leaves no stop unreachable", () => {
    const served = new Set(networkRoutes.flatMap((route) => route.servedStops));
    const unreachable = STOPS.filter((stop) => !served.has(stop));

    expect(unreachable).toEqual([]);
  });
});

describe("interchange points", () => {
  it("names a stop that exists", () => {
    for (const interchange of INTERCHANGES) {
      expect(isStopName(interchange.stop)).toBe(true);
      expect(isInterchange(interchange.stop)).toBe(true);
    }
  });

  it("lists each stop once", () => {
    const stops = INTERCHANGES.map((interchange) => interchange.stop);

    expect(new Set(stops).size).toBe(stops.length);
  });

  it("connects at least two routes", () => {
    for (const interchange of INTERCHANGES) {
      expect(interchange.routes.length).toBeGreaterThan(1);
      expect(new Set(interchange.routes).size).toBe(interchange.routes.length);
    }
  });

  it("only lists routes that actually call there", () => {
    const wrong: string[] = [];

    for (const interchange of INTERCHANGES) {
      for (const id of interchange.routes) {
        if (!getNetworkRoute(id).servedStops.includes(interchange.stop)) {
          wrong.push(`${id} does not call at ${interchange.stop}`);
        }
      }
    }

    expect(wrong).toEqual([]);
  });
});
