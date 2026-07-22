/**
 * The canonical stop registry.
 *
 * Every stop name in the application resolves back to this list. `StopName` is
 * a literal union derived from it, so a misspelled stop ("Bhawan" instead of
 * "Bhavan") is a compile error rather than a silent lookup miss.
 */

export interface Coordinate {
  lat: number;
  lng: number;
}

/**
 * Stops in travel order, HNLU to Raipur Railway Station.
 *
 * Order is meaningful: it drives timetable column order and the
 * "you can only travel forward along the route" rule in booking.
 */
export const STOPS = [
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
] as const;

export type StopName = (typeof STOPS)[number];

export const STOP_COORDS: Record<StopName, Coordinate> = {
  "HNLU": { lat: 21.2514, lng: 81.6296 },
  "Balco Medical Center": { lat: 21.248, lng: 81.635 },
  "Sector 30": { lat: 21.246, lng: 81.64 },
  "Sector 29": { lat: 21.242, lng: 81.645 },
  "Sector 27": { lat: 21.24, lng: 81.648 },
  "South Block": { lat: 21.238, lng: 81.651 },
  "Indravati Bhavan": { lat: 21.236, lng: 81.654 },
  "Mahanadi Bhavan": { lat: 21.234, lng: 81.656 },
  "North Block": { lat: 21.232, lng: 81.658 },
  "Ekatm Path": { lat: 21.23, lng: 81.66 },
  "CBD": { lat: 21.228, lng: 81.662 },
  "Sector 15": { lat: 21.226, lng: 81.665 },
  "Telibandha": { lat: 21.223, lng: 81.668 },
  "DKS Bhawan": { lat: 21.22, lng: 81.671 },
  "Raipur Railway Station": { lat: 21.21, lng: 81.63 },
};

const STOP_SET: ReadonlySet<string> = new Set(STOPS);

/** Narrows an arbitrary string to a known stop. */
export const isStopName = (value: unknown): value is StopName =>
  typeof value === "string" && STOP_SET.has(value);

/**
 * Map centre used before any live bus position is known.
 *
 * Derived from the first stop rather than re-typed, so the map and the stop
 * registry can never drift apart.
 */
export const DEFAULT_MAP_CENTER: Coordinate = STOP_COORDS["HNLU"];
