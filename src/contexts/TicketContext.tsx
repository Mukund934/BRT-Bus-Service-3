/**
 * The signed-in passenger's tickets.
 *
 * Holds state, actions and memoized derived views. All booking rules,
 * persistence and status maths live in the ticket domain and `ticketService`;
 * this provider wires them to React.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { POLLING } from "@/constants/config";
import {
  selectActiveTicket,
  selectPassengerStats,
  selectTicketHistory,
  type PassengerStats,
} from "@/domain/ticket/selectors";
import { syncTicketStatuses } from "@/domain/ticket/status";
import type { Ticket, TicketDraft } from "@/domain/ticket/types";
import {
  bookTicket as bookTicketInStorage,
  cancelTicket as cancelTicketInStorage,
  loadTickets,
  migrateLegacyTicket,
  purgeOtherUsersTickets,
  saveTickets,
  type BookingResult,
} from "@/services/ticketService";
import { useAuth } from "./AuthContext";

interface TicketContextValue {
  tickets: Ticket[];
  /** The journey in progress or next up, if any. */
  activeTicket: Ticket | null;
  /** Completed and cancelled journeys. */
  ticketHistory: Ticket[];
  stats: PassengerStats;
  bookTicket: (draft: TicketDraft) => BookingResult;
  cancelTicket: (ticketId: string) => void;
  refreshTickets: () => void;
}

const TicketContext = createContext<TicketContextValue | null>(null);

const NO_TICKETS: Ticket[] = [];

export const TicketProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>(NO_TICKETS);

  const userId = user?.uid ?? null;
  const userEmail = user?.email ?? "";

  /** Loads the signed-in user's tickets, migrating any legacy record first. */
  useEffect(() => {
    if (!userId) {
      setTickets(NO_TICKETS);
      return;
    }

    // Shared devices: no other account's tickets, QR payloads or validation
    // tokens may remain at rest once someone else signs in.
    const purged = purgeOtherUsersTickets(userId);

    if (purged > 0) {
      console.info(`Cleared cached tickets for ${purged} other account(s).`);
    }

    migrateLegacyTicket(userId, userEmail);

    const stored = loadTickets(userId);
    const synced = syncTicketStatuses(stored, new Date());

    if (synced !== stored) saveTickets(userId, synced);

    setTickets(synced);
  }, [userId, userEmail]);

  /**
   * Re-derives statuses on a timer so a ticket moves through BOARDING_SOON,
   * IN_TRANSIT and COMPLETED while the tab stays open.
   */
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      setTickets((previous) => {
        const next = syncTicketStatuses(previous, new Date());

        if (next !== previous) saveTickets(userId, next);

        return next;
      });
    }, POLLING.TICKET_STATUS_MS);

    return () => clearInterval(interval);
  }, [userId]);

  const refreshTickets = useCallback(() => {
    if (!userId) return;

    const stored = loadTickets(userId);
    const synced = syncTicketStatuses(stored, new Date());

    if (synced !== stored) saveTickets(userId, synced);

    setTickets(synced);
  }, [userId]);

  const bookTicket = useCallback(
    (draft: TicketDraft): BookingResult => {
      if (!userId) return { ok: false, reason: "NOT_AUTHENTICATED" };

      const result = bookTicketInStorage(userId, tickets, draft);

      if (result.ok) setTickets(result.tickets);

      return result;
    },
    [userId, tickets]
  );

  const cancelTicket = useCallback(
    (ticketId: string) => {
      if (!userId) return;

      const next = cancelTicketInStorage(userId, tickets, ticketId);

      if (next) setTickets(next);
    },
    [userId, tickets]
  );

  const activeTicket = useMemo(() => selectActiveTicket(tickets), [tickets]);
  const ticketHistory = useMemo(() => selectTicketHistory(tickets), [tickets]);
  const stats = useMemo(() => selectPassengerStats(tickets), [tickets]);

  const value = useMemo<TicketContextValue>(
    () => ({
      tickets,
      activeTicket,
      ticketHistory,
      stats,
      bookTicket,
      cancelTicket,
      refreshTickets,
    }),
    [
      tickets,
      activeTicket,
      ticketHistory,
      stats,
      bookTicket,
      cancelTicket,
      refreshTickets,
    ]
  );

  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
};

export const useTickets = (): TicketContextValue => {
  const context = useContext(TicketContext);

  if (!context) throw new Error("useTickets must be used within a TicketProvider");

  return context;
};
