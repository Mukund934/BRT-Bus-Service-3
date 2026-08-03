/**
 * Operator announcements.
 *
 * This collection is the one place where a person's words reach passengers as
 * fact, so the checks that matter are about who may write and what survives
 * being read back. A document nobody authorised, or one that does not match
 * the shape the site renders, must never reach a passenger.
 */

import { describe, expect, it, vi } from "vitest";
import {
  deleteAnnouncement,
  fetchActiveAnnouncements,
  fetchAllAnnouncements,
  publishAnnouncement,
  setAnnouncementActive,
} from "@/services/announcementService";
import { AuthorizationError } from "@/domain/auth/errors";
import type { Actor } from "@/types/user";
import { readDoc, seedDoc, timestamp } from "../helpers/firebase";

const admin: Actor = { uid: "admin-1", role: "admin" };
const passenger: Actor = { uid: "user-1", role: "user" };
const driver: Actor = { uid: "driver-1", role: "driver" };

const seedAnnouncement = (
  id: string,
  over: Record<string, unknown> = {}
): void =>
  seedDoc("announcements", id, {
    title: "Sector 27 stop closed",
    body: "Board at Sector 29 until further notice.",
    severity: "WARNING",
    active: true,
    ...over,
  });

describe("who may publish a notice", () => {
  it("refuses a passenger", async () => {
    const result = await publishAnnouncement(passenger, {
      title: "Free rides today",
      body: "Not from the operator.",
      severity: "INFO",
    });

    expect(result).toEqual({
      ok: false,
      message: expect.stringMatching(/permission/i),
    });
  });

  it("refuses a driver", async () => {
    const result = await publishAnnouncement(driver, {
      title: "Route cancelled",
      body: "Not from the operator.",
      severity: "CRITICAL",
    });

    expect(result.ok).toBe(false);
  });

  it("refuses a signed-out caller", async () => {
    expect((await publishAnnouncement(null, {
      title: "Anything",
      body: "Anything",
      severity: "INFO",
    })).ok).toBe(false);
  });

  it("writes nothing when it refuses", async () => {
    await publishAnnouncement(passenger, {
      title: "Free rides today",
      body: "Not from the operator.",
      severity: "INFO",
    });

    expect(await fetchActiveAnnouncements()).toEqual([]);
  });

  it("lets an administrator publish", async () => {
    const result = await publishAnnouncement(admin, {
      title: "Sector 27 stop closed",
      body: "Board at Sector 29 until further notice.",
      severity: "WARNING",
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.announcement.title).toBe("Sector 27 stop closed");
      expect(result.announcement.active).toBe(true);
    }
  });
});

describe("what a notice must contain", () => {
  it("refuses an empty title", async () => {
    const result = await publishAnnouncement(admin, {
      title: "   ",
      body: "Something happened.",
      severity: "INFO",
    });

    expect(result).toEqual({ ok: false, message: "A title is required" });
  });

  it("refuses an empty message", async () => {
    const result = await publishAnnouncement(admin, {
      title: "Something",
      body: "",
      severity: "INFO",
    });

    expect(result).toEqual({ ok: false, message: "A message is required" });
  });

  it("refuses a message long enough to bury the page", async () => {
    const result = await publishAnnouncement(admin, {
      title: "Something",
      body: "x".repeat(1001),
      severity: "INFO",
    });

    expect(result.ok).toBe(false);
  });

  it("refuses a severity the site cannot render", async () => {
    const result = await publishAnnouncement(admin, {
      title: "Something",
      body: "Something happened.",
      severity: "URGENT" as never,
    });

    expect(result.ok).toBe(false);
  });
});

describe("what a passenger is shown", () => {
  it("shows a published notice", async () => {
    seedAnnouncement("a1");

    const active = await fetchActiveAnnouncements();

    expect(active.map((entry) => entry.title)).toEqual(["Sector 27 stop closed"]);
  });

  it("hides a retired notice", async () => {
    seedAnnouncement("a1", { active: false });

    expect(await fetchActiveAnnouncements()).toEqual([]);
  });

  it("drops a document that does not match what the site renders", async () => {
    seedAnnouncement("good");
    seedDoc("announcements", "broken", { title: "No body or severity" });

    const active = await fetchActiveAnnouncements();

    expect(active.map((entry) => entry.id)).toEqual(["good"]);
  });

  it("puts the newest notice first", async () => {
    seedAnnouncement("older", {
      title: "Older",
      createdAt: timestamp(new Date(2026, 0, 1)),
    });
    seedAnnouncement("newer", {
      title: "Newer",
      createdAt: timestamp(new Date(2026, 5, 1)),
    });

    const active = await fetchActiveAnnouncements();

    expect(active.map((entry) => entry.title)).toEqual(["Newer", "Older"]);
  });

  it("shows nothing rather than failing when the read is refused", async () => {
    const { getDocs } = await import("firebase/firestore");
    const failed = vi.spyOn(console, "error").mockImplementation(() => undefined);

    vi.mocked(getDocs).mockRejectedValueOnce(new Error("offline"));

    expect(await fetchActiveAnnouncements()).toEqual([]);

    failed.mockRestore();
  });

  it("does not require anyone to sign in", async () => {
    seedAnnouncement("a1");

    await expect(fetchActiveAnnouncements()).resolves.toHaveLength(1);
  });
});

describe("managing what has been published", () => {
  it("refuses to list everything for a passenger", async () => {
    await expect(fetchAllAnnouncements(passenger)).rejects.toBeInstanceOf(
      AuthorizationError
    );
  });

  it("shows an administrator the retired ones too", async () => {
    seedAnnouncement("live");
    seedAnnouncement("retired", { title: "Retired", active: false });

    expect(await fetchAllAnnouncements(admin)).toHaveLength(2);
  });

  it("takes a notice off the site", async () => {
    seedAnnouncement("a1");

    expect(await setAnnouncementActive(admin, "a1", false)).toEqual({ ok: true });
    expect(await fetchActiveAnnouncements()).toEqual([]);
  });

  it("puts a retired notice back", async () => {
    seedAnnouncement("a1", { active: false });

    await setAnnouncementActive(admin, "a1", true);

    expect(await fetchActiveAnnouncements()).toHaveLength(1);
  });

  it("refuses a passenger trying to retire a notice", async () => {
    seedAnnouncement("a1");

    const result = await setAnnouncementActive(passenger, "a1", false);

    expect(result.ok).toBe(false);
    expect(readDoc("announcements", "a1")).toMatchObject({ active: true });
  });

  it("removes a notice permanently", async () => {
    seedAnnouncement("a1");

    expect(await deleteAnnouncement(admin, "a1")).toEqual({ ok: true });
    expect(readDoc("announcements", "a1")).toBeUndefined();
  });

  it("refuses a passenger trying to delete one", async () => {
    seedAnnouncement("a1");

    expect((await deleteAnnouncement(passenger, "a1")).ok).toBe(false);
    expect(readDoc("announcements", "a1")).toBeDefined();
  });
});
