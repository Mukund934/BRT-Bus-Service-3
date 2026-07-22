/**
 * Derived views over a passenger's tickets.
 *
 * These drive what the dashboard shows, so a wrong answer here is visible to
 * the user even though no data is corrupted.
 */

import { describe, expect, it } from "vitest";
import {
  selectActiveTicket,
  selectPassengerStats,
  selectTicketHistory,
} from "@/domain/ticket/selectors";
import { at, makeTicket } from "../helpers/factories";

describe("choosing the active ticket", () => {
  it("returns nothing when the passenger holds none", () => {
    expect(selectActiveTicket([])).toBeNull();
  });

  it("ignores completed and cancelled tickets", () => {
    const done = makeTicket({}, at(7, 0), { status: "COMPLETED" });
    const gone = makeTicket({}, at(7, 0), { status: "CANCELLED" });

    expect(selectActiveTicket([done, gone])).toBeNull();
  });

  it("picks the journey departing soonest, not the newest booking", () => {
    const later = makeTicket(
      { departureTime: "5:00 PM", arrivalTime: "6:00 PM" },
      at(7, 0)
    );
    const sooner = makeTicket(
      { departureTime: "10:00 AM", arrivalTime: "11:00 AM" },
      at(7, 0)
    );

    // Storage keeps newest first, so `later` is deliberately listed first.
    expect(selectActiveTicket([later, sooner])?.ticketId).toBe(sooner.ticketId);
  });
});

describe("ticket history", () => {
  it("contains only journeys that can no longer be travelled", () => {
    const live = makeTicket({}, at(7, 0));
    const done = makeTicket({}, at(7, 0), { status: "COMPLETED" });
    const gone = makeTicket({}, at(7, 0), { status: "CANCELLED" });

    const history = selectTicketHistory([live, done, gone]);

    expect(history.map((t) => t.status).sort()).toEqual(["CANCELLED", "COMPLETED"]);
  });
});

describe("passenger statistics", () => {
  it("is all zeroes for a new passenger", () => {
    expect(selectPassengerStats([])).toEqual({
      tripsCompleted: 0,
      totalSpent: 0,
      favouriteRoute: null,
    });
  });

  it("counts and bills only completed journeys", () => {
    const stats = selectPassengerStats([
      makeTicket({ fare: 10 }, at(7, 0), { status: "COMPLETED" }),
      makeTicket({ fare: 25 }, at(7, 0), { status: "COMPLETED" }),
      makeTicket({ fare: 99 }, at(7, 0), { status: "CANCELLED" }),
      makeTicket({ fare: 99 }, at(7, 0)),
    ]);

    expect(stats.tripsCompleted).toBe(2);
    expect(stats.totalSpent).toBe(35);
  });

  it("reports the most-travelled route, not the most recent one", () => {
    /*
      The dashboard labels this "Favourite Route" but used to show whichever
      route the passenger had used last, which was only ever right for
      someone who had used a single route.
    */
    const stats = selectPassengerStats([
      makeTicket({ route: "102" }, at(7, 0), { status: "COMPLETED" }),
      makeTicket({ route: "101" }, at(7, 0), { status: "COMPLETED" }),
      makeTicket({ route: "101" }, at(7, 0), { status: "COMPLETED" }),
    ]);

    expect(stats.favouriteRoute).toBe("101");
  });

  it("has no favourite before the first completed journey", () => {
    const stats = selectPassengerStats([makeTicket({}, at(7, 0))]);

    expect(stats.favouriteRoute).toBeNull();
  });
});
