/**
 * Browser storage is untrusted input.
 *
 * Anything read back may have been hand-edited, half-written, or produced by
 * an older release. These tests cover the failure modes rather than the happy
 * path, because the happy path is exercised by every other suite.
 */

import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  clearWhere,
  purgeLegacyKeys,
  readValidated,
  removeKey,
  storageKey,
  write,
} from "@/services/storageService";

const schema = z.object({ name: z.string(), count: z.number() });
const fallback = { name: "fallback", count: 0 };

const KEY = storageKey("thing");

describe("keys are namespaced", () => {
  it("prefixes everything the app owns", () => {
    expect(storageKey("tickets", "user-1")).toBe("brt.tickets.user-1");
  });
});

describe("reading", () => {
  it("returns the stored value when it matches the schema", () => {
    write(KEY, { name: "ok", count: 2 });

    const result = readValidated(KEY, schema, fallback);

    expect(result.outcome).toBe("ok");
    expect(result.value).toEqual({ name: "ok", count: 2 });
  });

  it("reports a missing key rather than inventing data", () => {
    const result = readValidated(KEY, schema, fallback);

    expect(result.outcome).toBe("missing");
    expect(result.value).toBe(fallback);
  });

  it("discards unparseable JSON and removes the key", () => {
    localStorage.setItem(KEY, "{{{");

    const result = readValidated(KEY, schema, fallback);

    expect(result.outcome).toBe("corrupt");
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("discards a value of the wrong shape rather than trusting it", () => {
    // A tampered entry must not reach the UI as if it were valid.
    localStorage.setItem(KEY, JSON.stringify({ v: 2, data: { name: 5 } }));

    const result = readValidated(KEY, schema, fallback);

    expect(result.outcome).toBe("invalid");
    expect(result.value).toBe(fallback);
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});

describe("versioning", () => {
  it("runs the migration for a payload written before the envelope existed", () => {
    localStorage.setItem(KEY, JSON.stringify({ name: "old", n: 3 }));

    const result = readValidated(
      KEY,
      schema,
      fallback,
      (raw, version) => {
        expect(version).toBe(0);
        const old = raw as { name: string; n: number };
        return { name: old.name, count: old.n };
      }
    );

    expect(result.value).toEqual({ name: "old", count: 3 });
  });

  it("rewrites the upgraded value so the migration is not repeated", () => {
    localStorage.setItem(KEY, JSON.stringify({ name: "old", n: 3 }));

    readValidated(KEY, schema, fallback, (raw) => {
      const old = raw as { name: string; n: number };
      return { name: old.name, count: old.n };
    });

    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({
      v: 2,
      data: { name: "old", count: 3 },
    });
  });

  it("still rejects a migrated value that does not match the schema", () => {
    localStorage.setItem(KEY, JSON.stringify({ junk: true }));

    const result = readValidated(KEY, schema, fallback, () => ({ nope: 1 }));

    expect(result.outcome).toBe("invalid");
  });
});

describe("writing", () => {
  it("reports success", () => {
    expect(write(KEY, { name: "x", count: 1 })).toBe("ok");
  });

  it("retries once after a quota failure, then reports it", () => {
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("full", "QuotaExceededError");
      });

    expect(write(KEY, { name: "x", count: 1 })).toBe("quota");

    // One initial attempt plus exactly one retry - never an infinite loop.
    expect(setItem).toHaveBeenCalledTimes(2);

    setItem.mockRestore();
  });

  it("reports a non-quota failure without retrying", () => {
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("denied");
      });

    expect(write(KEY, {})).toBe("failed");
    expect(setItem).toHaveBeenCalledTimes(1);

    setItem.mockRestore();
  });
});

describe("cleanup", () => {
  it("removes only the keys matching the predicate", () => {
    write(storageKey("a"), 1);
    write(storageKey("b"), 2);

    expect(clearWhere((key) => key.endsWith(".a"))).toBe(1);
    expect(localStorage.getItem(storageKey("a"))).toBeNull();
    expect(localStorage.getItem(storageKey("b"))).not.toBeNull();
  });

  it("never touches keys outside this app's namespace", () => {
    localStorage.setItem("someone-elses-key", "keep me");
    write(storageKey("a"), 1);

    clearWhere(() => true);

    expect(localStorage.getItem("someone-elses-key")).toBe("keep me");
  });

  it("removes cached authorization state left by older builds", () => {
    // A role cached in editable storage must never survive an upgrade.
    localStorage.setItem("role", "admin");
    localStorage.setItem("userRole", "admin");

    expect(purgeLegacyKeys()).toBe(2);
    expect(localStorage.getItem("role")).toBeNull();
  });

  it("leaves the legacy ticket alone for its own migration to handle", () => {
    /*
      Regression, high severity: purging this key here destroyed the record
      that `migrateLegacyTicket` needed, silently losing a passenger's
      pre-upgrade ticket instead of migrating it.
    */
    localStorage.setItem("latestTicket", JSON.stringify({ ticketId: "T-1" }));

    purgeLegacyKeys();

    expect(localStorage.getItem("latestTicket")).not.toBeNull();
  });

  it("tolerates removing a key that is not there", () => {
    expect(() => removeKey("nothing-here")).not.toThrow();
  });
});
