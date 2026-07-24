import { describe, expect, it } from "vitest";
import {
  PLACE_CATEGORIES,
  PLACES,
  routeIdForPlace,
  searchPlaces,
} from "@/domain/places";
import { isNetworkRouteId } from "@/domain/transit/routes";
import { isStopName } from "@/domain/transit/stops";

describe("place data integrity", () => {
  it("names every place exactly once", () => {
    const names = PLACES.map((place) => place.name);

    expect(new Set(names).size).toBe(names.length);
  });

  it("points every place at a real stop", () => {
    const unknown = PLACES.filter((place) => !isStopName(place.nearestStop));

    expect(unknown).toEqual([]);
  });

  it("gives every place a known category", () => {
    const stray = PLACES.filter(
      (place) => !PLACE_CATEGORIES.includes(place.category)
    );

    expect(stray).toEqual([]);
  });

  it("leaves no category listed without a place", () => {
    const empty = PLACE_CATEGORIES.filter(
      (category) => !PLACES.some((place) => place.category === category)
    );

    expect(empty).toEqual([]);
  });

  it("reaches every place by a route the explorer can open", () => {
    for (const place of PLACES) {
      const routeId = routeIdForPlace(place);

      expect(routeId).not.toBeNull();
      expect(isNetworkRouteId(routeId)).toBe(true);
    }
  });
});

describe("searchPlaces", () => {
  it("returns everything when nothing is asked for", () => {
    expect(searchPlaces("", null)).toHaveLength(PLACES.length);
  });

  it("matches on part of a name, case-insensitively", () => {
    const results = searchPlaces("hospital", null);

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((place) => /hospital/i.test(place.name))).toBe(true);
  });

  it("narrows to a single category", () => {
    const results = searchPlaces("", "Education");

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((place) => place.category === "Education")).toBe(true);
  });

  it("applies the name and category filters together", () => {
    const results = searchPlaces("bhavan", "Government");

    expect(results.every((place) => place.category === "Government")).toBe(true);
    expect(results.every((place) => /bhavan/i.test(place.name))).toBe(true);
  });

  it("returns nothing when the filters exclude every place", () => {
    expect(searchPlaces("zzzz", null)).toEqual([]);
  });
});
