/**
 * Live bus positions.
 *
 * PRIVACY: the `busLocations` node is world-readable, because the live map is
 * a public page. Everything published here is therefore visible to anyone on
 * the internet, so the payload is reduced to the minimum the map needs:
 * coordinates, a freshness timestamp, and an opaque bus label.
 *
 * Driver names and email addresses were previously written to this node and
 * rendered in a public table. They are gone, and `database.rules.json`
 * rejects any field outside the allowlist so they cannot come back by
 * accident.
 */

import { off, onValue, ref, remove, set, type DataSnapshot } from "firebase/database";
import { rtdb } from "@/firebase";
import { REMOTE_PATHS } from "@/constants/config";
import { AuthorizationError } from "@/domain/auth/errors";
import { PERMISSIONS, can } from "@/domain/auth/permissions";
import { busPositionSchema, type ValidatedBusPosition } from "@/domain/validation/schemas";
import type { Actor } from "@/types/user";

/** A bus position as consumed by the UI. */
export interface LiveBus extends ValidatedBusPosition {
  busId: string;
}

/**
 * A short, stable, non-identifying label for a driver's vehicle.
 *
 * Derived from the account id so the same driver keeps the same label within
 * a session, without publishing the uid itself.
 */
export const toBusId = (uid: string): string => {
  let hash = 0;

  for (let i = 0; i < uid.length; i++) {
    hash = (hash * 31 + uid.charCodeAt(i)) | 0;
  }

  return `BUS-${Math.abs(hash).toString(36).toUpperCase().slice(0, 4).padStart(4, "0")}`;
};

const locationRef = (uid: string) =>
  rtdb ? ref(rtdb, `${REMOTE_PATHS.BUS_LOCATIONS}/${uid}`) : null;

export interface Coords {
  latitude: number;
  longitude: number;
}

/**
 * Publishes the signed-in driver's position.
 *
 * Writes only to the caller's own node; the matching rule pins the path to
 * `auth.uid`, so a driver cannot post a position as another vehicle.
 */
export const publishLocation = async (
  actor: Actor | null,
  coords: Coords
): Promise<void> => {
  if (!can(actor, PERMISSIONS.PUBLISH_LOCATION)) {
    throw new AuthorizationError(PERMISSIONS.PUBLISH_LOCATION);
  }

  const node = locationRef(actor!.uid);
  if (!node) return;

  const payload = {
    lat: coords.latitude,
    lng: coords.longitude,
    updatedAt: Date.now(),
    busId: toBusId(actor!.uid),
  };

  // Validated before the write so an impossible coordinate is caught here
  // rather than being rejected by the database rule.
  const parsed = busPositionSchema.safeParse(payload);

  if (!parsed.success) {
    console.error("Refusing to publish an invalid position.", parsed.error.issues);
    return;
  }

  await set(node, payload);
};

/** Removes the driver's position when they stop sharing. */
export const stopPublishing = async (actor: Actor | null): Promise<void> => {
  if (!actor) return;

  const node = locationRef(actor.uid);
  if (!node) return;

  await remove(node);
};

/**
 * Subscribes to live bus positions.
 *
 * Every entry is schema-checked. A malformed or hostile record - a string
 * where a latitude should be, an injected extra field - is dropped rather
 * than rendered, so the public node cannot drive the UI into a bad state.
 *
 * Returns an unsubscribe function; a no-op when live tracking is unavailable.
 */
export const subscribeToBuses = (
  onBuses: (buses: LiveBus[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  if (!rtdb) {
    onBuses([]);
    return () => {};
  }

  const node = ref(rtdb, REMOTE_PATHS.BUS_LOCATIONS);

  const handleValue = (snapshot: DataSnapshot) => {
    if (!snapshot.exists()) {
      onBuses([]);
      return;
    }

    const raw: unknown = snapshot.val();

    if (typeof raw !== "object" || raw === null) {
      onBuses([]);
      return;
    }

    const buses: LiveBus[] = [];

    for (const [uid, value] of Object.entries(raw)) {
      const parsed = busPositionSchema.safeParse(value);

      if (!parsed.success) continue;

      buses.push({ ...parsed.data, busId: parsed.data.busId ?? toBusId(uid) });
    }

    onBuses(buses);
  };

  onValue(node, handleValue, (error) => {
    console.error("Live bus subscription failed:", error);
    onError?.(error);
    onBuses([]);
  });

  return () => off(node, "value", handleValue);
};
