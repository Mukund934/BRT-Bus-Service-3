import { describe, expect, it } from "vitest";
import {
  INTERCHANGES,
  NETWORK_ROUTES,
  NETWORK_ROUTE_IDS,
  getNetworkRoute,
  getRoute,
  isInterchange,
  isNetworkRouteId,
  locateOnRoute,
} from "@/domain/transit/routes";
import { STOPS, STOP_COORDS, isStopName } from "@/domain/transit/stops";

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

describe("placing a bus along the route it is running", () => {
  const atStop = (stop: keyof typeof STOP_COORDS) => STOP_COORDS[stop]!;

  it("names the stop the bus is closest to", () => {
    const place = locateOnRoute("101", atStop("CBD"));

    expect(place?.nearestStop).toBe("CBD");
  });

  it("names the stop it reaches next, in travel order", () => {
    const stops = getRoute("101").servedStops;
    const place = locateOnRoute("101", atStop("HNLU"));

    expect(place?.nextStop).toBe(stops[1]);
  });

  it("names where the route ends", () => {
    const place = locateOnRoute("101", atStop("HNLU"));

    expect(place?.destination).toBe("Raipur Railway Station");
  });

  it("reports no next stop once the bus has reached the end", () => {
    const place = locateOnRoute("101", atStop("Raipur Railway Station"));

    expect(place?.nextStop).toBeNull();
    expect(place?.stopsCovered).toBe(place?.totalStops);
  });

  it("counts progress from the start of the line", () => {
    const place = locateOnRoute("101", atStop("HNLU"));

    expect(place?.stopsCovered).toBe(1);
    expect(place?.totalStops).toBe(getRoute("101").servedStops.length);
  });

  it("skips the stops the express route does not call at", () => {
    const place = locateOnRoute("102", atStop("South Block"));

    expect(place?.nextStop).toBe("North Block");
    expect(getRoute("102").servedStops).not.toContain("Indravati Bhavan");
  });

  it("still places a bus that is nowhere near the corridor", () => {
    const place = locateOnRoute("101", { lat: 0, lng: 0 });

    expect(place).not.toBeNull();
    expect(getRoute("101").servedStops).toContain(place!.nearestStop);
  });
});
