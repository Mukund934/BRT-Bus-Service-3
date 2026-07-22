/**
 * Resolves a ticket's display times onto real instants.
 *
 * Every rule about when a journey starts, ends and expires lives here, so the
 * status engine, conflict detection and the booking UI cannot disagree.
 */

import { TICKET_RULES } from "@/constants/config";
import { addMinutes, parseTimeToDate } from "../time";
import type { Ticket } from "./types";

/** The instant this ticket's bus departs. */
export const getDepartureAt = (ticket: Ticket): Date =>
  parseTimeToDate(ticket.departureTime, ticket.travelDate);

/**
 * The instant this ticket's bus arrives.
 *
 * An arrival earlier than its departure is ambiguous. A large backwards gap
 * is a genuine midnight crossing (11:30 PM to 12:20 AM) and rolls to the next
 * day; a small one is a timetable data-entry slip (4:14 PM to 4:12 PM) and is
 * clamped to the departure rather than inventing a 24-hour journey.
 */
export const getArrivalAt = (ticket: Ticket): Date => {
  const departure = getDepartureAt(ticket);
  const arrival = parseTimeToDate(ticket.arrivalTime, ticket.travelDate);

  if (arrival < departure) {
    const gapMs = departure.getTime() - arrival.getTime();

    if (gapMs <= TICKET_RULES.MIDNIGHT_ROLLOVER_HOURS * 3_600_000) {
      return new Date(departure);
    }

    arrival.setDate(arrival.getDate() + 1);
  }

  return arrival;
};

/** The instant this ticket stops being valid: arrival plus the grace period. */
export const getExpiryAt = (ticket: Ticket): Date =>
  addMinutes(getArrivalAt(ticket), TICKET_RULES.GRACE_MINUTES);
