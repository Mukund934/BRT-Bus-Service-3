/**
 * Live bus positions.
 *
 * The Realtime Database SDK (~165 kB) is imported on demand. Only the map,
 * the driver screen and the arrival monitor need it, so a visitor reading the
 * timetable never downloads it.
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

import type { DataSnapshot } from "firebase/database";
import { getRtdb } from "@/firebase";
import { REMOTE_PATHS } from "@/constants/config";
import { AuthorizationError } from "@/domain/auth/errors";
import { PERMISSIONS, can } from "@/domain/auth/permissions";
import { fromDriverRecord } from "@/domain/fleet/adapters";
import { classifyAll, isPassengerVisible, type ClassifiedVehicle } from "@/domain/fleet/state";
import { acceptTelemetry, createTelemetryGate } from "@/domain/fleet/validation";
import type { VehicleTelemetry } from "@/domain/fleet/telemetry";
import { isRouteId, type RouteId } from "@/domain/transit/routes";
import {
  busPositionSchema,
  inboundBusPositionSchema,
  type ValidatedBusPosition,
} from "@/domain/validation/schemas";
import type { Actor } from "@/types/user";

/** A bus position as consumed by the UI. */
export interface LiveBus extends ValidatedBusPosition {
  busId: string;
}

/**
 * Narrowing options for a subscription.
 *
 * Widened now and filtered client-side, which is honest about what it does
 * today while fixing the signature at every call site. When the volume
 * justifies it the transport moves to a `/busLocationsByRoute/$routeId` path
 * shard and nothing above this line changes.
 *
 * Deliberately NOT `orderByChild('routeId')`: unindexed it downloads
 * everything anyway, and indexed it is documented as several times slower
 * than a key lookup while producing a per-query listen instead of one shared
 * broadcast.
 */
export interface SubscribeOptions {
  routeId?: RouteId;
}

/** Loads the Realtime Database SDK and handle together. */
const database = async () => {
  const [sdk, rtdb] = await Promise.all([import("firebase/database"), getRtdb()]);
  return { ...sdk, rtdb };
};

/** Whether live tracking can be used at all in this environment. */
export const isLiveTrackingAvailable = async (): Promise<boolean> =>
  (await getRtdb()) !== null;

/*
  The database's clock, as an offset from this device's.

  Positions are stamped by the server now, which removes the PUBLISHING
  device's clock from the trust model. It does not remove the READING one: a
  passenger whose phone is ten minutes fast would see every bus as stale, and
  one running slow would see stale buses as live. The database reports the
  difference at `/.info/serverTimeOffset`, and applying it makes both ends
  agree without either trusting a device.

  Module-level because the offset belongs to the connection rather than to any
  one screen, and every screen judging freshness against a different clock is
  the problem being solved.
*/
let serverTimeOffsetMs = 0;

/**
 * Now, according to the database rather than this device.
 *
 * Falls back to the local clock until the offset is known, which is correct:
 * an unknown offset is not evidence of a wrong clock.
 */
export const serverNow = (): number => Date.now() + serverTimeOffsetMs;

/** Test seam. Never called by the application. */
export const resetServerTimeOffset = (): void => {
  serverTimeOffsetMs = 0;
};

/** Every bus the feed knows about, with its freshness resolved. */
export const classifyBuses = (
  buses: LiveBus[],
  now = Date.now()
): ClassifiedVehicle[] => classifyAll(toTelemetry(buses, now), now);

/**
 * Buses a passenger-facing surface should draw.
 *
 * This used to be a filter that DELETED anything older than two minutes,
 * which threw away the only evidence that a bus had stopped reporting - so
 * nothing downstream could tell "not running" from "not reporting", and those
 * are different facts to somebody standing at a stop.
 *
 * It is now a classification the caller narrows. The record survives either
 * way, carrying the state and the age, so a screen can say how old a position
 * is instead of silently dropping it.
 *
 * A record with NO timestamp is no longer treated as fresh forever. That was
 * an immortal phantom bus on a public map, and a test was protecting it.
 */
export const selectFreshBuses = (
  buses: LiveBus[],
  now = Date.now()
): ClassifiedVehicle[] => classifyBuses(buses, now).filter(isPassengerVisible);

/** Maps the shipped driver-phone records onto the normalized contract. */
export const toTelemetry = (
  buses: readonly LiveBus[],
  receivedAt = Date.now()
): VehicleTelemetry[] =>
  buses.map((bus) =>
    fromDriverRecord(
      bus.busId,
      { busId: bus.busId, lat: bus.lat, lng: bus.lng, updatedAt: bus.updatedAt, routeId: bus.routeId },
      receivedAt
    )
  );

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

  /*
    The LAST four base-36 digits, not the first.

    Taking the leading digits collided constantly: Firebase uids share long
    prefixes and differ near the end, and the trailing characters only move
    the low-order bits of the hash - exactly the digits a leading slice
    discards. "driver-1" and "driver-2" both produced BUS-9W6W, which would
    show two vehicles as one on the public map and duplicate a React key.
  */
  const digits = Math.abs(hash).toString(36).toUpperCase().padStart(4, "0");

  return `BUS-${digits.slice(-4)}`;
};

export interface Coords {
  latitude: number;
  longitude: number;
}

/**
 * Publishes the signed-in driver's position.
 *
 * Writes only to the caller's own node; the matching rule pins the path to
 * `auth.uid`, so a driver cannot post a position as another vehicle.
 *
 * The position is also armed for removal on disconnect. Stopping deliberately
 * clears the node, but a crashed tab or a dead connection never gets that far,
 * and the node lives in a world-readable database - so the server is asked to
 * clear it too. The registration is renewed on every publish because the
 * database discards it once it has fired or the socket has been replaced.
 */
export const publishLocation = async (
  actor: Actor | null,
  coords: Coords,
  routeId?: RouteId
): Promise<void> => {
  if (!can(actor, PERMISSIONS.PUBLISH_LOCATION)) {
    throw new AuthorizationError(PERMISSIONS.PUBLISH_LOCATION);
  }

  const { onDisconnect, ref, serverTimestamp, set, rtdb } = await database();
  if (!rtdb) return;

  const payload = {
    lat: coords.latitude,
    lng: coords.longitude,
    /*
      The server's clock, not this device's.

      Everything downstream decides whether a bus is LIVE, STALE or OFFLINE by
      comparing this against now, so whoever sets it decides how fresh the bus
      appears. A phone with a clock running fast would show itself as
      permanently current - and would keep a marker on a public map at a place
      nobody is - without anything on the reading side being able to tell.

      The rules require the value to fall inside a narrow window around server
      time, which this satisfies by construction and a guessed number does not.
    */
    updatedAt: serverTimestamp(),
    busId: toBusId(actor!.uid),
    ...(routeId ? { routeId } : {}),
  };

  // Validated before the write so an impossible coordinate is caught here
  // rather than being rejected by the database rule.
  const parsed = busPositionSchema.safeParse(payload);

  if (!parsed.success) {
    console.error("Refusing to publish an invalid position.", parsed.error.issues);
    return;
  }

  const node = ref(rtdb, `${REMOTE_PATHS.BUS_LOCATIONS}/${actor!.uid}`);

  await set(node, payload);

  try {
    await onDisconnect(node).remove();
  } catch (error) {
    console.error("Could not arm automatic cleanup for this vehicle:", error);
  }
};

/** Removes the driver's position when they stop sharing. */
export const stopPublishing = async (actor: Actor | null): Promise<void> => {
  if (!actor) return;

  const { ref, remove, rtdb } = await database();
  if (!rtdb) return;

  await remove(ref(rtdb, `${REMOTE_PATHS.BUS_LOCATIONS}/${actor.uid}`));
};

/**
 * Subscribes to live bus positions.
 *
 * Deliberately keeps a synchronous signature returning an unsubscribe
 * function, even though loading the SDK is asynchronous: React effects need
 * to return their cleanup immediately. Unsubscribing before the SDK finishes
 * loading is handled by the `cancelled` flag, so a component that mounts and
 * unmounts quickly never leaves a listener attached.
 *
 * Every entry is schema-checked. A malformed or hostile record - a string
 * where a latitude should be, an injected extra field - is dropped rather
 * than rendered, so the public node cannot drive the UI into a bad state.
 */
export const subscribeToBuses = (
  onBuses: (buses: LiveBus[]) => void,
  onError?: (error: Error) => void,
  options: SubscribeOptions = {}
): (() => void) => {
  let cancelled = false;
  let detach: () => void = () => {};
  const gate = createTelemetryGate();

  void (async () => {
    const { ref, onValue, off, rtdb } = await database();

    if (cancelled) return;

    if (!rtdb) {
      onError?.(new Error("Live tracking is unavailable."));
      onBuses([]);
      return;
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
      let unreadable = 0;
      let unknownRoutes = 0;

      for (const [uid, value] of Object.entries(raw)) {
        const parsed = inboundBusPositionSchema.safeParse(value);

        if (!parsed.success) {
          unreadable += 1;
          continue;
        }

        /*
          An unrecognised route costs the bus its label, never its place on
          the map. A build that predates a new route must still show the
          buses running on it.
        */
        const routeId = isRouteId(parsed.data.routeId)
          ? parsed.data.routeId
          : undefined;

        if (parsed.data.routeId !== undefined && routeId === undefined) {
          unknownRoutes += 1;
        }

        if (options.routeId && routeId !== options.routeId) continue;

        buses.push({
          ...parsed.data,
          routeId,
          busId: parsed.data.busId ?? toBusId(uid),
        });
      }

      /*
        Counted rather than silently dropped. A bare `continue` here meant a
        malformed or newer record left no trace at all, so a passenger seeing
        fewer buses than exist had nothing to report and we had nothing to
        look at.
      */
      if (unreadable > 0 || unknownRoutes > 0) {
        console.warn(
          `Live buses: ${unreadable} position(s) could not be read, ` +
            `${unknownRoutes} on a route this build does not know.`
        );
      }

      /*
        Everything is gated before the caller sees it.

        The node is world-readable and, until the rules are deployed, writable
        by any signed-in account - so a timestamp from next week, a position at
        (0, 0) or a vehicle that teleports across the state are all things the
        UI could otherwise be driven with. The gate lives in this closure so it
        keeps its per-vehicle history for the life of the subscription, which
        is what makes the ordering and jump checks possible at all.
      */
      const now = serverNow();
      const believable = new Set(
        acceptTelemetry(gate, toTelemetry(buses, now), now).map(
          (telemetry) => telemetry.vehicleId
        )
      );

      onBuses(buses.filter((bus) => believable.has(bus.busId)));
    };

    onValue(node, handleValue, (error) => {
      console.error("Live bus subscription failed:", error);
      onError?.(error);
      onBuses([]);
    });

    /*
      Tracked alongside the fleet rather than on its own, so the offset is
      known for exactly as long as something is reading positions.
    */
    const offsetNode = ref(rtdb, ".info/serverTimeOffset");

    const handleOffset = (snapshot: { val: () => unknown }) => {
      const value = snapshot.val();

      if (typeof value === "number" && Number.isFinite(value)) {
        serverTimeOffsetMs = value;
      }
    };

    onValue(offsetNode, handleOffset);

    detach = () => {
      off(node, "value", handleValue);
      off(offsetNode, "value", handleOffset);
    };
  })();

  return () => {
    cancelled = true;
    detach();
  };
};
