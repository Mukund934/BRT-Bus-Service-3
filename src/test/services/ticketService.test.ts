/**
 * Ticket persistence and booking rules.
 *
 * These are the application's money paths: what may be booked, what is
 * refused, what survives a reload, and what happens when storage returns
 * something the app did not write. Several assertions here are regressions
 * for defects found during earlier sprints and are labelled as such.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BOOKING_FAILURE_MESSAGES,
  bookTicket,
  cancelTicket,
  loadTickets,
  migrateLegacyTicket,
  purgeOtherUsersTickets,
  saveTickets,
} from "@/services/ticketService";
import {
  at,
  makeDraft,
  makeTicket,
  seedLegacyStoredTickets,
  seedStoredTickets,
} from "../helpers/factories";

const USER = "user-1";

describe("booking rules", () => {
  it("accepts a journey that departs in the future", () => {
    const result = bookTicket(USER, [], makeDraft(), at(9, 0));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.ticket.fromStop).toBe("HNLU");
      expect(result.tickets).toHaveLength(1);
    }
  });

  it("refuses a bus that has already departed", () => {
    const result = bookTicket(USER, [], makeDraft(), at(10, 30));

    expect(result).toEqual({ ok: false, reason: "ALREADY_DEPARTED" });
  });

  it("refuses a journey overlapping a ticket the passenger already holds", () => {
    const existing = makeTicket({}, at(8, 0));

    const result = bookTicket(
      USER,
      [existing],
      makeDraft({ departureTime: "10:30 AM", arrivalTime: "11:30 AM" }),
      at(9, 0)
    );

    expect(result).toEqual({ ok: false, reason: "OVERLAPPING_TICKET" });
  });

  it("allows a second journey that does not overlap", () => {
    const existing = makeTicket({}, at(8, 0));

    const result = bookTicket(
      USER,
      [existing],
      makeDraft({ departureTime: "12:00 PM", arrivalTime: "1:00 PM" }),
      at(9, 0)
    );

    expect(result.ok).toBe(true);
  });

  it("ignores a completed ticket when checking for overlaps", () => {
    const finished = makeTicket({}, at(8, 0), { status: "COMPLETED" });

    const result = bookTicket(USER, [finished], makeDraft(), at(9, 0));

    expect(result.ok).toBe(true);
  });

  it("refuses to book on behalf of another account", () => {
    const result = bookTicket(
      USER,
      [],
      makeDraft({ userId: "someone-else" }),
      at(9, 0)
    );

    expect(result).toEqual({ ok: false, reason: "NOT_AUTHENTICATED" });
  });

  it("explains every refusal in words a passenger can act on", () => {
    for (const message of Object.values(BOOKING_FAILURE_MESSAGES)) {
      expect(message.length).toBeGreaterThan(10);
      // No error codes or internals leaking into the UI.
      expect(message).not.toMatch(/[A-Z]{2,}_[A-Z]{2,}/);
    }
  });
});

describe("cancelling", () => {
  it("marks a live ticket cancelled", () => {
    const ticket = makeTicket({}, at(8, 0));
    saveTickets(USER, [ticket]);

    const next = cancelTicket(USER, [ticket], ticket.ticketId, at(9, 0));

    expect(next?.[0]?.status).toBe("CANCELLED");
  });

  it("refuses to cancel a ticket owned by someone else", () => {
    const foreign = makeTicket({ userId: "someone-else" }, at(8, 0));

    expect(cancelTicket(USER, [foreign], foreign.ticketId, at(9, 0))).toBeNull();
  });

  it("refuses to cancel a journey that has already finished", () => {
    const done = makeTicket({}, at(8, 0), { status: "COMPLETED" });

    expect(cancelTicket(USER, [done], done.ticketId, at(9, 0))).toBeNull();
  });

  it("returns null for a ticket that does not exist", () => {
    expect(cancelTicket(USER, [], "TICKET-NOPE", at(9, 0))).toBeNull();
  });
});

describe("reading stored tickets", () => {
  it("round-trips what it wrote", () => {
    const ticket = makeTicket();
    saveTickets(USER, [ticket]);

    expect(loadTickets(USER).map((t) => t.ticketId)).toEqual([ticket.ticketId]);
  });

  it("reads tickets written before storage was versioned", () => {
    // Regression: the versioned envelope must not orphan existing tickets.
    const ticket = makeTicket();
    seedLegacyStoredTickets(USER, [ticket]);

    expect(loadTickets(USER)).toHaveLength(1);
  });

  it("upgrades a legacy payload in place so the migration happens once", () => {
    seedLegacyStoredTickets(USER, [makeTicket()]);

    loadTickets(USER);

    const raw = JSON.parse(localStorage.getItem(`brt.tickets.${USER}`)!);
    expect(raw.v).toBe(2);
  });

  it("drops only the damaged entry, keeping the rest", () => {
    /*
      Regression, twice over. Both the hand-rolled validator and its zod
      replacement originally failed the whole array on one bad element, which
      would have deleted a passenger's entire history over a single corrupt
      record.
    */
    const good = makeTicket();
    seedStoredTickets(USER, [
      good,
      { ticketId: "junk" } as never,
      { ...good, fare: -5 },
    ]);

    const loaded = loadTickets(USER);

    expect(loaded).toHaveLength(1);
    expect(loaded[0]!.ticketId).toBe(good.ticketId);
  });

  it("rejects a ticket claiming to belong to another account", () => {
    seedStoredTickets(USER, [makeTicket({ userId: "someone-else" })]);

    expect(loadTickets(USER)).toEqual([]);
  });

  it("survives outright corrupt JSON", () => {
    localStorage.setItem(`brt.tickets.${USER}`, "{not json");

    expect(loadTickets(USER)).toEqual([]);
  });

  it("returns nothing for a signed-out user", () => {
    expect(loadTickets("")).toEqual([]);
  });
});

describe("account switching on a shared device", () => {
  beforeEach(() => {
    saveTickets("user-1", [makeTicket({ userId: "user-1" })]);
    saveTickets("user-2", [makeTicket({ userId: "user-2" })]);
    saveTickets("user-10", [makeTicket({ userId: "user-10" })]);
  });

  it("clears every other account's cached tickets", () => {
    expect(purgeOtherUsersTickets("user-1")).toBe(2);
    expect(localStorage.getItem("brt.tickets.user-2")).toBeNull();
  });

  it("keeps the signed-in account's own tickets", () => {
    purgeOtherUsersTickets("user-1");

    expect(loadTickets("user-1")).toHaveLength(1);
  });

  it("does not confuse an account whose id merely shares a prefix", () => {
    // "user-1" is a prefix of "user-10"; a naive startsWith would nuke both.
    purgeOtherUsersTickets("user-10");

    expect(loadTickets("user-10")).toHaveLength(1);
  });
});

describe("migrating a pre-Sprint-2 ticket", () => {
  const legacyRecord = {
    ticketId: "TICKET-LEGACY1",
    paymentId: "PAY-LEGACY1",
    route: "101",
    from: "HNLU",
    to: "CBD",
    fare: 10,
    departure: "6:25 AM",
    arrival: "7:48 AM",
    user: "rider@example.com",
    bookingTime: at(5, 0).toISOString(),
  };

  it("moves it into the per-user collection and clears the old key", () => {
    localStorage.setItem("latestTicket", JSON.stringify(legacyRecord));

    migrateLegacyTicket(USER, "rider@example.com");

    const tickets = loadTickets(USER);
    expect(tickets).toHaveLength(1);
    expect(tickets[0]!.ticketId).toBe("TICKET-LEGACY1");
    expect(localStorage.getItem("latestTicket")).toBeNull();
  });

  it("discards a record belonging to a different account", () => {
    localStorage.setItem("latestTicket", JSON.stringify(legacyRecord));

    migrateLegacyTicket(USER, "someone-else@example.com");

    expect(loadTickets(USER)).toEqual([]);
    expect(localStorage.getItem("latestTicket")).toBeNull();
  });

  it("discards a record naming a stop that no longer exists", () => {
    localStorage.setItem(
      "latestTicket",
      JSON.stringify({ ...legacyRecord, to: "Abolished Halt" })
    );

    migrateLegacyTicket(USER, "rider@example.com");

    expect(loadTickets(USER)).toEqual([]);
  });

  it("does nothing when there is no legacy record", () => {
    migrateLegacyTicket(USER, "rider@example.com");

    expect(loadTickets(USER)).toEqual([]);
  });
});

describe("when the device refuses to store anything", () => {
  it("reports the failure instead of pretending the booking worked", () => {
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("full", "QuotaExceededError");
      });

    const result = bookTicket(USER, [], makeDraft(), at(9, 0));

    expect(result).toEqual({ ok: false, reason: "STORAGE_FAILED" });

    setItem.mockRestore();
  });
});
