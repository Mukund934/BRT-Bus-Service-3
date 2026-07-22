/**
 * Derived views over a passenger's tickets.
 *
 * These were previously recomputed inline inside the context provider and the
 * dashboard. Keeping them here means the definition of "active ticket" is
 * stated once and can be memoized by callers.
 */

import type { RouteId } from "../transit/routes";
import { isLiveStatus } from "./status";
import { getDepartureAt } from "./timing";
import type { Ticket } from "./types";

/**
 * The ticket the passenger is currently travelling on, or next will.
 *
 * When several are live, the one departing soonest wins.
 */
export const selectActiveTicket = (tickets: Ticket[]): Ticket | null => {
  let earliest: Ticket | null = null;
  let earliestAt = Number.POSITIVE_INFINITY;

  for (const ticket of tickets) {
    if (!isLiveStatus(ticket.status)) continue;

    const departsAt = getDepartureAt(ticket).getTime();
    if (departsAt < earliestAt) {
      earliest = ticket;
      earliestAt = departsAt;
    }
  }

  return earliest;
};

/** Tickets that are no longer travellable: completed or cancelled. */
export const selectTicketHistory = (tickets: Ticket[]): Ticket[] =>
  tickets.filter((ticket) => !isLiveStatus(ticket.status));

export interface PassengerStats {
  tripsCompleted: number;
  totalSpent: number;
  /** The route travelled most often, or null before any completed trip. */
  favouriteRoute: RouteId | null;
}

/**
 * Headline numbers for the passenger dashboard.
 *
 * `favouriteRoute` is the most-travelled route. The dashboard previously
 * showed the most *recent* completed trip's route under that label, which was
 * only correct when the passenger had used a single route.
 */
export const selectPassengerStats = (tickets: Ticket[]): PassengerStats => {
  const completed = tickets.filter((ticket) => ticket.status === "COMPLETED");

  const counts = new Map<RouteId, number>();
  let totalSpent = 0;

  for (const ticket of completed) {
    totalSpent += ticket.fare;
    counts.set(ticket.route, (counts.get(ticket.route) ?? 0) + 1);
  }

  let favouriteRoute: RouteId | null = null;
  let best = 0;

  for (const [route, count] of counts) {
    if (count > best) {
      favouriteRoute = route;
      best = count;
    }
  }

  return { tripsCompleted: completed.length, totalSpent, favouriteRoute };
};
