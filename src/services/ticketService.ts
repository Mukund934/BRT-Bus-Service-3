/**
 * Ticket persistence and booking orchestration.
 *
 * This is the seam between the pure ticket domain and the browser. The
 * context provider calls into here; it does not talk to storage or apply
 * booking rules itself.
 */

import { STORAGE_KEYS } from "@/constants/config";
import { findConflictingTicket } from "@/domain/ticket/conflicts";
import { createTicket } from "@/domain/ticket/factory";
import { isLiveStatus } from "@/domain/ticket/status";
import { getArrivalAt, getDepartureAt } from "@/domain/ticket/timing";
import type { Ticket, TicketDraft } from "@/domain/ticket/types";
import { isRouteId } from "@/domain/transit/routes";
import { isStopName } from "@/domain/transit/stops";
import { readJson, readRaw, removeKey, writeJson } from "./storageService";

const ticketsKey = (userId: string): string =>
  `${STORAGE_KEYS.TICKETS_PREFIX}.${userId}`;

/**
 * Structural check for a stored ticket.
 *
 * Guards against schema drift between releases and hand-edited storage. Stops
 * and routes are checked against the registries, so a ticket naming a stop
 * that no longer exists is discarded rather than rendered.
 */
const isTicket = (value: unknown): value is Ticket => {
  if (typeof value !== "object" || value === null) return false;

  const t = value as Record<string, unknown>;

  return (
    typeof t.ticketId === "string" &&
    typeof t.userId === "string" &&
    typeof t.fare === "number" &&
    typeof t.departureTime === "string" &&
    typeof t.arrivalTime === "string" &&
    typeof t.travelDate === "string" &&
    typeof t.expiresAt === "string" &&
    typeof t.status === "string" &&
    typeof t.qrData === "string" &&
    isRouteId(t.route) &&
    isStopName(t.fromStop) &&
    isStopName(t.toStop)
  );
};

/**
 * Every ticket held by a user, newest first.
 *
 * Unreadable entries are dropped individually rather than failing the whole
 * read: one corrupt record must not make a passenger's other tickets vanish.
 */
export const loadTickets = (userId: string): Ticket[] => {
  if (!userId) return [];

  const stored = readJson<unknown[]>(ticketsKey(userId), [], Array.isArray);

  const tickets = stored.filter(isTicket);

  if (tickets.length !== stored.length) {
    console.warn(
      `Discarded ${stored.length - tickets.length} unreadable ticket(s) from storage.`
    );
  }

  return tickets;
};

/** Persists a user's full ticket list. Returns false when storage refused. */
export const saveTickets = (userId: string, tickets: Ticket[]): boolean => {
  if (!userId) return false;

  return writeJson(ticketsKey(userId), tickets);
};

export type BookingFailure =
  | "ALREADY_DEPARTED"
  | "OVERLAPPING_TICKET"
  | "STORAGE_FAILED";

export type BookingResult =
  | { ok: true; ticket: Ticket; tickets: Ticket[] }
  | { ok: false; reason: BookingFailure };

/** Why a booking was refused, in words a passenger can act on. */
export const BOOKING_FAILURE_MESSAGES: Record<BookingFailure, string> = {
  ALREADY_DEPARTED:
    "This service has already departed. Please choose a later bus.",
  OVERLAPPING_TICKET:
    "You already hold a ticket for a journey that overlaps this one.",
  STORAGE_FAILED:
    "Your ticket could not be saved. Your device storage may be full.",
};

/**
 * Applies the booking rules and persists the ticket.
 *
 * Returns a tagged result rather than null so the payment screen can explain
 * precisely which rule refused the booking.
 */
export const bookTicket = (
  userId: string,
  existing: Ticket[],
  draft: TicketDraft,
  now = new Date()
): BookingResult => {
  const ticket = createTicket(draft, now);

  if (getDepartureAt(ticket) < now) {
    return { ok: false, reason: "ALREADY_DEPARTED" };
  }

  const conflict = findConflictingTicket(
    existing,
    getDepartureAt(ticket),
    getArrivalAt(ticket)
  );

  if (conflict) return { ok: false, reason: "OVERLAPPING_TICKET" };

  const tickets = [ticket, ...existing];

  if (!saveTickets(userId, tickets)) {
    return { ok: false, reason: "STORAGE_FAILED" };
  }

  return { ok: true, ticket, tickets };
};

/**
 * Marks a live ticket cancelled.
 *
 * Returns the updated list, or null when the ticket is missing, already
 * finished, or storage refused the write.
 */
export const cancelTicket = (
  userId: string,
  existing: Ticket[],
  ticketId: string,
  now = new Date()
): Ticket[] | null => {
  const target = existing.find((ticket) => ticket.ticketId === ticketId);

  if (!target || !isLiveStatus(target.status)) return null;

  const tickets = existing.map((ticket) =>
    ticket.ticketId === ticketId
      ? { ...ticket, status: "CANCELLED" as const, updatedAt: now.toISOString() }
      : ticket
  );

  return saveTickets(userId, tickets) ? tickets : null;
};

/**
 * Moves a pre-Sprint-2 single-ticket record into the per-user collection.
 *
 * Runs once per login. The legacy key is cleared on every outcome except a
 * failed write, where it is deliberately left in place so the migration can
 * be retried on the next login rather than losing the passenger's ticket.
 */
export const migrateLegacyTicket = (userId: string, userEmail: string): void => {
  const raw = readRaw(STORAGE_KEYS.LEGACY_TICKET);
  if (!raw) return;

  try {
    const legacy = JSON.parse(raw) as Record<string, unknown>;

    // Belongs to a different account: discard rather than hand it over.
    if (legacy?.user && legacy.user !== userEmail) {
      removeKey(STORAGE_KEYS.LEGACY_TICKET);
      return;
    }

    const existing = loadTickets(userId);
    const legacyId = typeof legacy.ticketId === "string" ? legacy.ticketId : null;
    const alreadyStored =
      legacyId !== null && existing.some((t) => t.ticketId === legacyId);

    const route = isRouteId(legacy.route) ? legacy.route : "101";
    const fromStop = isStopName(legacy.from) ? legacy.from : null;
    const toStop = isStopName(legacy.to) ? legacy.to : null;

    if (legacyId && !alreadyStored && fromStop && toStop) {
      const migrated = createTicket({
        userId,
        userEmail,
        route,
        fromStop,
        toStop,
        fare: typeof legacy.fare === "number" ? legacy.fare : 0,
        departureTime: typeof legacy.departure === "string" ? legacy.departure : "",
        arrivalTime: typeof legacy.arrival === "string" ? legacy.arrival : "",
        bookingTime:
          typeof legacy.bookingTime === "string"
            ? legacy.bookingTime
            : new Date().toISOString(),
      });

      const saved = saveTickets(userId, [
        {
          ...migrated,
          ticketId: legacyId,
          paymentId:
            typeof legacy.paymentId === "string"
              ? legacy.paymentId
              : migrated.paymentId,
        },
        ...existing,
      ]);

      // Keep the legacy record so the next login can try again.
      if (!saved) return;
    }

    removeKey(STORAGE_KEYS.LEGACY_TICKET);
  } catch (error) {
    console.error("Failed to migrate legacy ticket:", error);
    removeKey(STORAGE_KEYS.LEGACY_TICKET);
  }
};
