/**
 * Geographic helpers for live bus tracking.
 *
 * Extracted from ArrivalMonitor so distance and ETA maths are testable
 * without mounting a component or connecting to the Realtime Database.
 */

import { ARRIVAL_RULES } from "@/constants/config";
import type { Coordinate } from "./transit/stops";

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/** Great-circle distance between two points, in kilometres. */
export const haversineKm = (from: Coordinate, to: Coordinate): number => {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(dLng / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/** Whole minutes to cover a distance at the assumed average bus speed. */
export const estimateEtaMinutes = (distanceKm: number): number =>
  Math.round((distanceKm / ARRIVAL_RULES.AVERAGE_SPEED_KMPH) * 60);

/** Minutes until a bus at `from` reaches `to`. */
export const etaBetween = (from: Coordinate, to: Coordinate): number =>
  estimateEtaMinutes(haversineKm(from, to));
