/**
 * Defensive browser-storage access.
 *
 * localStorage is attacker-writable: anything read from it is untrusted input
 * that may have been hand-edited, corrupted by a half-finished write, or
 * written by an older version of this app. Every read therefore goes through
 * a schema, and every failure degrades to a safe default rather than throwing
 * into a render.
 *
 * Values are wrapped in a versioned envelope so the shape can evolve without
 * orphaning what is already on disk.
 */

import type { z } from "zod";

/** Everything this app writes is namespaced, so cleanup can be exhaustive. */
export const STORAGE_NAMESPACE = "brt";

/** Current envelope version. Bump when a stored shape changes incompatibly. */
export const STORAGE_VERSION = 2;

interface Envelope<T> {
  v: number;
  data: T;
}

/** Builds a namespaced key: `brt.tickets.<uid>`. */
export const storageKey = (...parts: string[]): string =>
  [STORAGE_NAMESPACE, ...parts].join(".");

/**
 * Whether storage is usable at all.
 *
 * Safari private mode and hardened browser profiles expose `localStorage` but
 * throw on write, so availability is probed rather than assumed.
 */
export const isStorageAvailable = ((): boolean => {
  try {
    const probe = `${STORAGE_NAMESPACE}.__probe__`;
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return true;
  } catch {
    console.warn("Browser storage is unavailable; tickets will not persist.");
    return false;
  }
})();

const isEnvelope = (value: unknown): value is Envelope<unknown> =>
  typeof value === "object" &&
  value !== null &&
  "v" in value &&
  "data" in value &&
  typeof (value as Envelope<unknown>).v === "number";

export type ReadOutcome = "ok" | "missing" | "corrupt" | "invalid" | "unavailable";

export interface ReadResult<T> {
  value: T;
  outcome: ReadOutcome;
}

/**
 * Reads, unwraps and validates a stored value.
 *
 * `migrate` is given the raw payload of an older envelope (or a pre-envelope
 * bare value) and may return something the schema accepts. Anything that
 * still fails validation is discarded - keeping a value that does not match
 * the current shape is how corrupt state propagates into the UI.
 */
export const readValidated = <T>(
  key: string,
  schema: z.ZodType<T>,
  fallback: T,
  migrate?: (raw: unknown, version: number) => unknown
): ReadResult<T> => {
  if (!isStorageAvailable) return { value: fallback, outcome: "unavailable" };

  let raw: string | null;

  try {
    raw = localStorage.getItem(key);
  } catch (error) {
    console.error(`Storage read failed for "${key}":`, error);
    return { value: fallback, outcome: "unavailable" };
  }

  if (raw === null) return { value: fallback, outcome: "missing" };

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn(`Discarding corrupt storage entry "${key}" (invalid JSON).`);
    removeKey(key);
    return { value: fallback, outcome: "corrupt" };
  }

  const version = isEnvelope(parsed) ? parsed.v : 0;
  const payload = isEnvelope(parsed) ? parsed.data : parsed;

  const candidate =
    version === STORAGE_VERSION ? payload : (migrate?.(payload, version) ?? payload);

  const result = schema.safeParse(candidate);

  if (!result.success) {
    console.warn(
      `Discarding storage entry "${key}" that does not match the expected shape.`,
      result.error.issues.slice(0, 3)
    );
    removeKey(key);
    return { value: fallback, outcome: "invalid" };
  }

  // Rewrite in the current envelope so the upgrade happens once.
  if (version !== STORAGE_VERSION) write(key, result.data);

  return { value: result.data, outcome: "ok" };
};

export type WriteOutcome = "ok" | "quota" | "unavailable" | "failed";

/**
 * Writes a value inside the current envelope.
 *
 * On a quota failure the caller's own stale namespace entries are released
 * and the write is retried once, which is usually enough: the overflow is
 * almost always accumulated history rather than the record being saved.
 */
export const write = (key: string, value: unknown, retry = true): WriteOutcome => {
  if (!isStorageAvailable) return "unavailable";

  const envelope: Envelope<unknown> = { v: STORAGE_VERSION, data: value };

  try {
    localStorage.setItem(key, JSON.stringify(envelope));
    return "ok";
  } catch (error) {
    const isQuota =
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" ||
        error.name === "NS_ERROR_DOM_QUOTA_REACHED");

    if (isQuota && retry) {
      console.warn("Storage quota reached; releasing stale entries and retrying.");
      purgeLegacyKeys();
      return write(key, value, false);
    }

    console.error(`Storage write failed for "${key}":`, error);
    return isQuota ? "quota" : "failed";
  }
};

export const removeKey = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Storage remove failed for "${key}":`, error);
  }
};

/** Every key this app owns, safely enumerated. */
const ownedKeys = (): string[] => {
  if (!isStorageAvailable) return [];

  try {
    return Object.keys(localStorage).filter((key) =>
      key.startsWith(`${STORAGE_NAMESPACE}.`)
    );
  } catch (error) {
    console.error("Storage enumeration failed:", error);
    return [];
  }
};

/**
 * Removes every namespaced key matching `predicate`.
 *
 * Returns how many were removed so callers can log meaningful diagnostics.
 */
export const clearWhere = (predicate: (key: string) => boolean): number => {
  const targets = ownedKeys().filter(predicate);

  targets.forEach(removeKey);

  return targets.length;
};

/**
 * Un-namespaced keys that must never survive, because each one would be a
 * cached authorization decision sitting in attacker-editable storage.
 *
 * DELIBERATELY EXCLUDES `latestTicket`. That key is the pre-Sprint-2 ticket
 * record and is owned by `ticketService.migrateLegacyTicket`, which reads it
 * on first sign-in and only clears it once the ticket has been safely moved
 * into the per-user collection. Purging it here would delete the passenger's
 * ticket before the migration could ever see it. Do not add it.
 */
const LEGACY_AUTH_KEYS = ["role", "userRole"];

/**
 * Deletes obsolete authorization state left by earlier releases.
 *
 * Nothing reads these keys today; they are removed so that a value written by
 * some earlier build cannot linger where a user could edit it.
 */
export const purgeLegacyKeys = (): number => {
  let removed = 0;

  for (const key of LEGACY_AUTH_KEYS) {
    try {
      if (localStorage.getItem(key) !== null) {
        removeKey(key);
        removed += 1;
      }
    } catch {
      // Storage unavailable; nothing to purge.
    }
  }

  return removed;
};
