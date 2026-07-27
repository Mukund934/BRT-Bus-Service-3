/**
 * Fare table integrity.
 *
 * The pre-Sprint-4 fare matrix declared 79 of its 105 pairs twice and omitted
 * two stops from thirteen rows entirely; those journeys only priced correctly
 * because the lookup silently fell back to the reverse direction. These tests
 * lock in the properties that make that class of bug impossible, so adding a
 * stop without pricing it fails here rather than charging a passenger ₹0.
 */

import { describe, expect, it } from "vitest";
import { calculateFare, getFareBandsFrom } from "@/domain/transit/fares";
import { STOPS } from "@/domain/transit/stops";

const UNPRICED: readonly string[] = [
  "Sector 17 Gate",
  "Sector 18 Gate",
  "Sector 12",
  "Sector 23",
  "Tribal Museum",
];

const PRICED = STOPS.filter((stop) => !UNPRICED.includes(stop));

describe("fare table completeness", () => {
  it("charges a non-zero fare between any two distinct stops", () => {
    const free: string[] = [];

    for (const from of PRICED) {
      for (const to of PRICED) {
        if (from === to) continue;
        const fare = calculateFare(from, to);
        if (fare === null || fare <= 0) free.push(`${from} -> ${to}`);
      }
    }

    expect(free).toEqual([]);
  });

  it("charges the same in both directions", () => {
    const asymmetric: string[] = [];

    for (const from of PRICED) {
      for (const to of PRICED) {
        const there = calculateFare(from, to);
        const back = calculateFare(to, from);
        if (there !== back) asymmetric.push(`${from}/${to}: ${there} vs ${back}`);
      }
    }

    expect(asymmetric).toEqual([]);
  });
});

describe("calculateFare input handling", () => {
  it("is free to travel nowhere", () => {
    expect(calculateFare("HNLU", "HNLU")).toBe(0);
  });

  it("returns no fare for unknown or empty stops rather than throwing", () => {
    // The booking UI calls this while the passenger is still choosing.
    expect(calculateFare("", "CBD")).toBeNull();
    expect(calculateFare("HNLU", "Nowhere Junction")).toBeNull();
  });

  it("returns no fare for a pair the official chart does not price", () => {
    expect(calculateFare("HNLU", "Tribal Museum")).toBeNull();
  });

  it("prices the two stops the old matrix omitted", () => {
    // Regression guard: these only worked via a reverse-direction fallback.
    expect(calculateFare("HNLU", "Sector 30")).toBe(5);
    expect(calculateFare("HNLU", "Balco Medical Center")).toBe(5);
  });

  it("charges more for the full corridor than for one stop", () => {
    expect(calculateFare("HNLU", "Raipur Railway Station")).toBeGreaterThan(
      calculateFare("HNLU", "Balco Medical Center")!
    );
  });
});

describe("fare bands shown on the public fares page", () => {
  const bands = getFareBandsFrom("HNLU");

  it("covers every other stop exactly once", () => {
    const listed = bands.flatMap((band) => band.destinations);

    expect(listed).toHaveLength(PRICED.length - 1);
    expect(new Set(listed).size).toBe(PRICED.length - 1);
    expect(listed).not.toContain("HNLU");
  });

  it("orders bands cheapest first", () => {
    const fares = bands.map((band) => band.fare);

    expect(fares).toEqual([...fares].sort((a, b) => a - b));
  });

  it("agrees with what the booking flow charges", () => {
    for (const band of bands) {
      for (const destination of band.destinations) {
        expect(calculateFare("HNLU", destination)).toBe(band.fare);
      }
    }
  });
});
