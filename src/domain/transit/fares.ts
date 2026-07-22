/**
 * Fare table.
 *
 * Fares are declared once per unordered stop pair and mirrored into a
 * symmetric lookup at module load. The previous nested-object matrix declared
 * 79 of its 105 pairs twice while omitting "Sector 30" and "Balco Medical
 * Center" from thirteen rows entirely - those journeys only priced correctly
 * because the lookup silently fell back to the reverse direction. Declaring
 * each pair once makes that class of gap impossible.
 */

import { STOPS, isStopName, type StopName } from "./stops";

type FarePair = readonly [StopName, StopName, number];

/**
 * Every unordered stop pair, exactly once. Grouped by price for readability.
 *
 * Values are the fares in rupees that the application has always charged;
 * this list was derived mechanically from the previous matrix so no journey
 * changes price.
 */
const FARE_PAIRS: readonly FarePair[] = [
  // ---- ₹5 ----
  ["HNLU", "Balco Medical Center", 5],
  ["HNLU", "Sector 30", 5],
  ["HNLU", "Sector 29", 5],
  ["HNLU", "Sector 27", 5],
  ["HNLU", "South Block", 5],
  ["HNLU", "Ekatm Path", 5],
  ["Balco Medical Center", "Sector 30", 5],
  ["Balco Medical Center", "Sector 29", 5],
  ["Balco Medical Center", "Sector 27", 5],
  ["Balco Medical Center", "South Block", 5],
  ["Sector 30", "Sector 29", 5],
  ["Sector 30", "Sector 27", 5],
  ["Sector 30", "South Block", 5],
  ["Sector 29", "Sector 27", 5],
  ["Sector 29", "South Block", 5],
  ["Sector 29", "Indravati Bhavan", 5],
  ["Sector 29", "Mahanadi Bhavan", 5],
  ["Sector 29", "North Block", 5],
  ["Sector 29", "Ekatm Path", 5],
  ["Sector 29", "CBD", 5],
  ["Sector 27", "South Block", 5],
  ["Sector 27", "Indravati Bhavan", 5],
  ["Sector 27", "Mahanadi Bhavan", 5],
  ["Sector 27", "North Block", 5],
  ["Sector 27", "Ekatm Path", 5],
  ["Sector 27", "CBD", 5],
  ["South Block", "Indravati Bhavan", 5],
  ["South Block", "Mahanadi Bhavan", 5],
  ["South Block", "North Block", 5],
  ["South Block", "Ekatm Path", 5],
  ["South Block", "CBD", 5],
  ["South Block", "Sector 15", 5],
  ["Indravati Bhavan", "Mahanadi Bhavan", 5],
  ["Indravati Bhavan", "North Block", 5],
  ["Indravati Bhavan", "Ekatm Path", 5],
  ["Indravati Bhavan", "CBD", 5],
  ["Mahanadi Bhavan", "North Block", 5],
  ["Mahanadi Bhavan", "Ekatm Path", 5],
  ["Mahanadi Bhavan", "CBD", 5],
  ["Mahanadi Bhavan", "Sector 15", 5],
  ["North Block", "Ekatm Path", 5],
  ["North Block", "CBD", 5],
  ["North Block", "Sector 15", 5],
  ["Ekatm Path", "CBD", 5],
  ["Ekatm Path", "Sector 15", 5],
  ["CBD", "Sector 15", 5],
  ["Telibandha", "DKS Bhawan", 5],
  ["DKS Bhawan", "Raipur Railway Station", 5],

  // ---- ₹10 ----
  ["HNLU", "Indravati Bhavan", 10],
  ["HNLU", "Mahanadi Bhavan", 10],
  ["HNLU", "North Block", 10],
  ["HNLU", "CBD", 10],
  ["HNLU", "Sector 15", 10],
  ["Balco Medical Center", "Indravati Bhavan", 10],
  ["Balco Medical Center", "Mahanadi Bhavan", 10],
  ["Balco Medical Center", "North Block", 10],
  ["Balco Medical Center", "Ekatm Path", 10],
  ["Balco Medical Center", "CBD", 10],
  ["Sector 30", "Indravati Bhavan", 10],
  ["Sector 30", "Mahanadi Bhavan", 10],
  ["Sector 30", "North Block", 10],
  ["Sector 30", "Ekatm Path", 10],
  ["Sector 30", "CBD", 10],
  ["Sector 29", "Sector 15", 10],
  ["Sector 27", "Sector 15", 10],
  ["Indravati Bhavan", "Sector 15", 10],
  ["Telibandha", "Raipur Railway Station", 10],

  // ---- ₹15 ----
  ["Balco Medical Center", "Sector 15", 15],
  ["Sector 30", "Sector 15", 15],
  ["Sector 15", "Telibandha", 15],

  // ---- ₹20 ----
  ["Balco Medical Center", "Telibandha", 20],
  ["Sector 30", "Telibandha", 20],
  ["South Block", "Telibandha", 20],
  ["North Block", "Telibandha", 20],
  ["Ekatm Path", "Telibandha", 20],
  ["CBD", "Telibandha", 20],
  ["Sector 15", "DKS Bhawan", 20],

  // ---- ₹25 ----
  ["HNLU", "Telibandha", 25],
  ["Balco Medical Center", "DKS Bhawan", 25],
  ["Sector 30", "DKS Bhawan", 25],
  ["Sector 29", "Telibandha", 25],
  ["Sector 29", "DKS Bhawan", 25],
  ["Sector 27", "Telibandha", 25],
  ["Sector 27", "DKS Bhawan", 25],
  ["South Block", "DKS Bhawan", 25],
  ["South Block", "Raipur Railway Station", 25],
  ["Indravati Bhavan", "Telibandha", 25],
  ["Mahanadi Bhavan", "Telibandha", 25],
  ["North Block", "DKS Bhawan", 25],
  ["North Block", "Raipur Railway Station", 25],
  ["Ekatm Path", "DKS Bhawan", 25],
  ["Ekatm Path", "Raipur Railway Station", 25],
  ["CBD", "DKS Bhawan", 25],
  ["CBD", "Raipur Railway Station", 25],
  ["Sector 15", "Raipur Railway Station", 25],

  // ---- ₹30 ----
  ["HNLU", "DKS Bhawan", 30],
  ["Balco Medical Center", "Raipur Railway Station", 30],
  ["Sector 30", "Raipur Railway Station", 30],
  ["Sector 29", "Raipur Railway Station", 30],
  ["Sector 27", "Raipur Railway Station", 30],
  ["Indravati Bhavan", "DKS Bhawan", 30],
  ["Indravati Bhavan", "Raipur Railway Station", 30],
  ["Mahanadi Bhavan", "DKS Bhawan", 30],
  ["Mahanadi Bhavan", "Raipur Railway Station", 30],

  // ---- ₹35 ----
  ["HNLU", "Raipur Railway Station", 35],
];

/** Mirrors the pair list into a dense, symmetric lookup. */
const buildFareTable = (
  pairs: readonly FarePair[]
): Record<StopName, Record<StopName, number>> => {
  const table = {} as Record<StopName, Record<StopName, number>>;

  for (const stop of STOPS) {
    table[stop] = {} as Record<StopName, number>;
    table[stop][stop] = 0;
  }

  for (const [from, to, fare] of pairs) {
    table[from][to] = fare;
    table[to][from] = fare;
  }

  return table;
};

export const FARE_TABLE = buildFareTable(FARE_PAIRS);

/**
 * Fare between two stops in rupees.
 *
 * Tolerant of partial input because booking UIs call it while the passenger
 * is still choosing: unknown or empty stops price at 0 rather than throwing.
 */
export const calculateFare = (from: string, to: string): number => {
  if (!isStopName(from) || !isStopName(to)) return 0;
  if (from === to) return 0;

  return FARE_TABLE[from][to] ?? 0;
};

export interface FareBand {
  fare: number;
  destinations: StopName[];
}

/**
 * Fares from a single origin, grouped by price and ordered cheapest first.
 *
 * Powers the public fares page, which previously hardcoded its own prices and
 * had drifted out of step with the fare table.
 */
export const getFareBandsFrom = (origin: StopName): FareBand[] => {
  const byFare = new Map<number, StopName[]>();

  for (const stop of STOPS) {
    if (stop === origin) continue;

    const fare = FARE_TABLE[origin][stop];
    if (fare === undefined) continue;

    const bucket = byFare.get(fare);
    if (bucket) bucket.push(stop);
    else byFare.set(fare, [stop]);
  }

  return [...byFare.entries()]
    .sort(([a], [b]) => a - b)
    .map(([fare, destinations]) => ({ fare, destinations }));
};
