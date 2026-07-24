/**
 * Places passengers reach by BRT.
 *
 * Two grounded sources only: destinations the operator itself publishes on its
 * "Place to Explore" page, and institutions that are already stops in the
 * transit registry. Nothing here is invented - every `nearestStop` is a real
 * StopName, and the operator-listed places carry the stop the operator states.
 */

import { getRoutesServing } from "./transit/routes";
import type { StopName } from "./transit/stops";

export type PlaceCategory =
  | "Education"
  | "Hospitals"
  | "Government"
  | "Parks"
  | "Entertainment"
  | "Tourism";

export interface Place {
  name: string;
  category: PlaceCategory;
  nearestStop: StopName;
  /** True when the operator lists this destination itself, not just the stop. */
  official: boolean;
}

export const PLACE_CATEGORIES: readonly PlaceCategory[] = [
  "Education",
  "Hospitals",
  "Government",
  "Parks",
  "Entertainment",
  "Tourism",
];

export const PLACES: readonly Place[] = [
  { name: "Miraj Cinema", category: "Entertainment", nearestStop: "CBD", official: true },
  { name: "Sadbhawna Hospital", category: "Hospitals", nearestStop: "Sector 30", official: true },
  { name: "Balco Medical Center", category: "Hospitals", nearestStop: "Balco Medical Center", official: true },
  { name: "HNLU", category: "Education", nearestStop: "HNLU", official: false },
  { name: "IIM", category: "Education", nearestStop: "IIM", official: false },
  { name: "IIIT", category: "Education", nearestStop: "IIIT", official: false },
  { name: "Rawatpura Sarkar University", category: "Education", nearestStop: "Rawatpura Sarkar University", official: false },
  { name: "Satya Sai Hospital", category: "Hospitals", nearestStop: "Satya Sai Hospital", official: false },
  { name: "Indravati Bhavan", category: "Government", nearestStop: "Indravati Bhavan", official: false },
  { name: "Mahanadi Bhavan", category: "Government", nearestStop: "Mahanadi Bhavan", official: false },
  { name: "DKS Bhawan", category: "Government", nearestStop: "DKS Bhawan", official: false },
  { name: "Jungle Safari", category: "Parks", nearestStop: "Jungle Safari", official: false },
  { name: "Tribal Museum", category: "Tourism", nearestStop: "Tribal Museum", official: false },
];

export const searchPlaces = (
  query: string,
  category: PlaceCategory | null
): Place[] => {
  const term = query.trim().toLowerCase();

  return PLACES.filter((place) => {
    if (category && place.category !== category) return false;
    if (!term) return true;

    return place.name.toLowerCase().includes(term);
  });
};

export const routeIdForPlace = (place: Place): string | null =>
  getRoutesServing(place.nearestStop)[0]?.id ?? null;
