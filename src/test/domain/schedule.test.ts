/**
 * Timetable integrity.
 *
 * The schedule is authored as a grid and zipped against each route's served
 * stops at load. A mismatch between the two would misalign every departure
 * time on a row - the kind of fault that produces a plausible-looking
 * timetable full of wrong times, so it is checked structurally rather than
 * by spot-reading a few cells.
 */

import { describe, expect, it } from "vitest";
import { getRoute, ROUTE_IDS } from "@/domain/transit/routes";
import {
  getCallTime,
  getDestinationsFrom,
  getTripStops,
  getTrips,
} from "@/domain/transit/schedule";
import { STOPS } from "@/domain/transit/stops";

const allTrips = [...getTrips("weekday"), ...getTrips("weekend")];

describe("schedule loads", () => {
  it("builds every authored trip", () => {
    // The builder drops a row whose times do not line up with its route and
    // reports it; a shortfall here means the grid and registry disagree.
    expect(getTrips("weekday")).toHaveLength(33);
    expect(getTrips("weekend")).toHaveLength(21);
  });

  it("gives every trip a unique id", () => {
    // Trip ids are React keys in the timetable; a duplicate would make rows
    // reconcile onto each other.
    const ids = allTrips.map((trip) => trip.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("trips match their route", () => {
  it("calls at exactly the stops its route serves, in order", () => {
    for (const trip of allTrips) {
      expect(getTripStops(trip)).toEqual([...getRoute(trip.routeId).servedStops]);
    }
  });

  it("only uses known route ids", () => {
    for (const trip of allTrips) {
      expect(ROUTE_IDS).toContain(trip.routeId);
    }
  });

  it("never carries an empty call time", () => {
    // The old grid used empty strings for stops a route skips. A skipped
    // stop must now be absent, not blank.
    for (const trip of allTrips) {
      for (const call of trip.calls) {
        expect(call.time).not.toBe("");
      }
    }
  });
});

describe("the express route skips the two Bhavan stops", () => {
  const express = getTrips("weekend").filter((trip) => trip.routeId === "102");

  it("runs on weekends", () => {
    expect(express.length).toBeGreaterThan(0);
  });

  it("has no call at either skipped stop", () => {
    for (const trip of express) {
      expect(getCallTime(trip, "Indravati Bhavan")).toBeNull();
      expect(getCallTime(trip, "Mahanadi Bhavan")).toBeNull();
    }
  });

  it("still calls at every other stop", () => {
    const skipped = new Set(["Indravati Bhavan", "Mahanadi Bhavan"]);

    for (const stop of STOPS) {
      if (skipped.has(stop)) continue;
      expect(getCallTime(express[0]!, stop)).not.toBeNull();
    }
  });
});

describe("forward-travel rule", () => {
  const trip = getTrips("weekday")[0]!;

  it("offers only stops the bus reaches after the boarding point", () => {
    const stops = getTripStops(trip);
    const origin = stops[3]!;

    expect(getDestinationsFrom(trip, origin)).toEqual(stops.slice(4));
  });

  it("offers nothing from the final stop", () => {
    const last = getTripStops(trip).at(-1)!;

    expect(getDestinationsFrom(trip, last)).toEqual([]);
  });

  it("offers nothing from a stop this trip does not serve", () => {
    const express = getTrips("weekend").find((t) => t.routeId === "102")!;

    expect(getDestinationsFrom(express, "Indravati Bhavan")).toEqual([]);
  });
});
