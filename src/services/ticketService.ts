/**
 * Ticket persistence and booking orchestration.
 *
 * The seam between the pure ticket domain and the browser. Everything read
 * back from storage is treated as untrusted: it is schema-validated, then
 * ownership-checked, before any of it reaches the UI.
 */

import { STORAGE_KEYS } from "@/constants/config";
import { findConflictingTicket } from "@/domain/ticket/conflicts";
import { createTicket } from "@/domain/ticket/factory";
import { isLiveStatus } from "@/domain/ticket/status";
import { getArrivalAt, getDepartureAt } from "@/domain/ticket/timing";
import type { Ticket, TicketDraft } from "@/domain/ticket/types";
import { ticketSchema, unknownArraySchema } from "@/domain/validation/schemas";
import {
  clearWhere,
  readValidated,
  removeKey,
  storageKey,
  write,
} from "./storageService";

const ticketsKey = (userId: string): string => storageKey("tickets", userId);

/**
 * Upgrades payloads written before storage was versioned.
 *
 * Version 0 is the pre-envelope format: a bare `Ticket[]` written straight to
 * the key. Anything unrecognised becomes an empty list rather than being
 * passed through unvalidated.
 */
const migrateTickets = (raw: unknown, version: number): unknown => {
  if (version === 0 && Array.isArray(raw)) return raw;

  return Array.isArray(raw) ? raw : [];
};

/**
 * Every ticket held by a user, newest first.
 *
 * Each entry is validated on its own, so a single tampered or corrupt record
 * costs the passenger that one ticket rather than their whole history. Two
 * checks apply per entry: the schema rejects a wrong shape (a hand-edited
 * fare, an unknown stop, a broken date), and the ownership check rejects any
 * record claiming a different `userId`, so a tampered store cannot inject
 * another account's journey into this session.
 *
 * When anything is dropped the cleaned list is written back, so the store
 * heals instead of re-reporting the same damage on every read.
 */
export const loadTickets = (userId: string): Ticket[] => {
  if (!userId) return [];

  const { value } = readValidated<unknown[]>(
    ticketsKey(userId),
    unknownArraySchema,
    [],
    migrateTickets
  );

  const tickets: Ticket[] = [];
  let dropped = 0;

  for (const entry of value) {
    const parsed = ticketSchema.safeParse(entry);

    if (!parsed.success || parsed.data.userId !== userId) {
      dropped += 1;
      continue;
    }

    tickets.push(parsed.data);
  }

  if (dropped > 0) {
    console.warn(`Discarded ${dropped} unreadable or foreign stored ticket(s).`);
    saveTickets(userId, tickets);
  }

  return tickets;
};

/** Persists a user's full ticket list. Returns false when storage refused. */
export const saveTickets = (userId: string, tickets: Ticket[]): boolean =>
  userId ? write(ticketsKey(userId), tickets) === "ok" : false;

/**
 * Removes cached tickets for every account except the one signing in.
 *
 * Ticket data is session-scoped by intent: on a shared browser the previous
 * passenger's journeys, QR payloads and validation tokens must not remain at
 * rest once someone else signs in.
 */
export const purgeOtherUsersTickets = (currentUserId: string): number => {
  const keep = ticketsKey(currentUserId);

  return clearWhere((key) => key.startsWith(storageKey("tickets")) && key !== keep);
};

export type BookingFailure =
  | "NOT_AUTHENTICATED"
  | "ALREADY_DEPARTED"
  | "OVERLAPPING_TICKET"
  | "INVALID_JOURNEY"
  | "STORAGE_FAILED";

export type BookingResult =
  | { ok: true; ticket: Ticket; tickets: Ticket[] }
  | { ok: false; reason: BookingFailure };

/** Why a booking was refused, in words a passenger can act on. */
export const BOOKING_FAILURE_MESSAGES: Record<BookingFailure, string> = {
  NOT_AUTHENTICATED: "Please sign in to book a ticket.",
  ALREADY_DEPARTED: "This service has already departed. Please choose a later bus.",
  OVERLAPPING_TICKET:
    "You already hold a ticket for a journey that overlaps this one.",
  INVALID_JOURNEY: "That journey is not valid. Please reselect your stops.",
  STORAGE_FAILED: "Your ticket could not be saved. Your device storage may be full.",
};

/**
 * Applies the booking rules and persists the ticket.
 *
 * The freshly built ticket is validated against the same schema used on read,
 * so a journey assembled from bad UI state is rejected at the boundary rather
 * than becoming a permanently malformed record.
 */
export const bookTicket = (
  userId: string,
  existing: Ticket[],
  draft: TicketDraft,
  now = new Date()
): BookingResult => {
  if (!userId || draft.userId !== userId) {
    return { ok: false, reason: "NOT_AUTHENTICATED" };
  }

  const ticket = createTicket(draft, now);

  if (!ticketSchema.safeParse(ticket).success) {
    return { ok: false, reason: "INVALID_JOURNEY" };
  }

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
 * Returns the updated list, or null when the ticket is missing, not owned by
 * the caller, already finished, or storage refused the write.
 */
export const cancelTicket = (
  userId: string,
  existing: Ticket[],
  ticketId: string,
  now = new Date()
): Ticket[] | null => {
  const target = existing.find((ticket) => ticket.ticketId === ticketId);

  if (!target || target.userId !== userId) return null;
  if (!isLiveStatus(target.status)) return null;

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
  let raw: string | null;

  try {
    raw = localStorage.getItem(STORAGE_KEYS.LEGACY_TICKET);
  } catch {
    return;
  }

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

    if (legacyId && !alreadyStored) {
      const candidate = createTicket({
        userId,
        userEmail,
        route: "101",
        fromStop: "HNLU",
        toStop: "CBD",
        fare: typeof legacy.fare === "number" ? legacy.fare : 0,
        departureTime: typeof legacy.departure === "string" ? legacy.departure : "",
        arrivalTime: typeof legacy.arrival === "string" ? legacy.arrival : "",
        bookingTime:
          typeof legacy.bookingTime === "string"
            ? legacy.bookingTime
            : new Date().toISOString(),
      });

      const migrated = {
        ...candidate,
        ticketId: legacyId,
        paymentId:
          typeof legacy.paymentId === "string" ? legacy.paymentId : candidate.paymentId,
        route: legacy.route,
        fromStop: legacy.from,
        toStop: legacy.to,
      };

      // The legacy record's stops and route are free-form strings from an
      // older schema; only migrate it if it validates against the current one.
      const parsed = ticketSchema.safeParse(migrated);

      if (parsed.success && !saveTickets(userId, [parsed.data, ...existing])) {
        // Keep the legacy record so the next login can try again.
        return;
      }
    }

    removeKey(STORAGE_KEYS.LEGACY_TICKET);
  } catch (error) {
    console.error("Failed to migrate legacy ticket:", error);
    removeKey(STORAGE_KEYS.LEGACY_TICKET);
  }
};
