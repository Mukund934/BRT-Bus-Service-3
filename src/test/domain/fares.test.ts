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

describe("fare table completeness", () => {
  it("charges a non-zero fare between any two distinct stops", () => {
    const free: string[] = [];

    for (const from of STOPS) {
      for (const to of STOPS) {
        if (from === to) continue;
        if (calculateFare(from, to) <= 0) free.push(`${from} -> ${to}`);
      }
    }

    expect(free).toEqual([]);
  });

  it("charges the same in both directions", () => {
    const asymmetric: string[] = [];

    for (const from of STOPS) {
      for (const to of STOPS) {
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

  it("prices unknown or empty stops at zero rather than throwing", () => {
    // The booking UI calls this while the passenger is still choosing.
    expect(calculateFare("", "CBD")).toBe(0);
    expect(calculateFare("HNLU", "Nowhere Junction")).toBe(0);
  });

  it("prices the two stops the old matrix omitted", () => {
    // Regression guard: these only worked via a reverse-direction fallback.
    expect(calculateFare("HNLU", "Sector 30")).toBe(5);
    expect(calculateFare("HNLU", "Balco Medical Center")).toBe(5);
  });

  it("charges more for the full corridor than for one stop", () => {
    expect(calculateFare("HNLU", "Raipur Railway Station")).toBeGreaterThan(
      calculateFare("HNLU", "Balco Medical Center")
    );
  });
});

describe("fare bands shown on the public fares page", () => {
  const bands = getFareBandsFrom("HNLU");

  it("covers every other stop exactly once", () => {
    const listed = bands.flatMap((band) => band.destinations);

    expect(listed).toHaveLength(STOPS.length - 1);
    expect(new Set(listed).size).toBe(STOPS.length - 1);
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
