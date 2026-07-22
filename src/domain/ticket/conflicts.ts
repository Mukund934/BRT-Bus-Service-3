/**
 * Duplicate-booking prevention.
 *
 * A passenger cannot be on two buses at once, so a new journey is refused
 * when its time window overlaps a ticket they already hold.
 */

import { isLiveStatus } from "./status";
import { getArrivalAt, getDepartureAt } from "./timing";
import type { Ticket } from "./types";

/**
 * The first live ticket whose journey overlaps the given window, if any.
 *
 * Touching endpoints do not count as an overlap: a 10:00-11:00 ticket does
 * not block an 11:00-12:00 one.
 */
export const findConflictingTicket = (
  tickets: Ticket[],
  departureAt: Date,
  arrivalAt: Date
): Ticket | null => {
  const start = departureAt.getTime();
  const end = arrivalAt.getTime();

  return (
    tickets.find((ticket) => {
      if (!isLiveStatus(ticket.status)) return false;

      const existingStart = getDepartureAt(ticket).getTime();
      const existingEnd = getArrivalAt(ticket).getTime();

      return start < existingEnd && end > existingStart;
    }) ?? null
  );
};
