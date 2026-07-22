import { Ticket, createTicket } from "@/types/ticket";

const STORAGE_PREFIX = "brt.tickets";
const LEGACY_KEY = "latestTicket";

const storageKey = (userId: string) => `${STORAGE_PREFIX}.${userId}`;

export const loadTickets = (userId: string): Ticket[] => {
  if (!userId) return [];

  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Error reading tickets:", err);
    return [];
  }
};

export const saveTickets = (userId: string, tickets: Ticket[]) => {
  if (!userId) return false;

  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(tickets));
    return true;
  } catch (err) {
    console.error("Error saving tickets:", err);
    return false;
  }
};

export const addTicket = (userId: string, ticket: Ticket) => {
  const tickets = [ticket, ...loadTickets(userId)];
  return saveTickets(userId, tickets) ? tickets : null;
};

export const replaceTicket = (userId: string, ticket: Ticket) => {
  const tickets = loadTickets(userId).map((t) =>
    t.ticketId === ticket.ticketId ? ticket : t
  );
  return saveTickets(userId, tickets) ? tickets : null;
};

export const migrateLegacyTicket = (userId: string, userEmail: string) => {
  const raw = localStorage.getItem(LEGACY_KEY);
  if (!raw) return;

  try {
    const legacy = JSON.parse(raw);

    if (legacy?.user && legacy.user !== userEmail) {
      localStorage.removeItem(LEGACY_KEY);
      return;
    }

    const existing = loadTickets(userId);
    const alreadyStored = existing.some((t) => t.ticketId === legacy?.ticketId);

    if (legacy?.ticketId && !alreadyStored) {
      const bookingTime = legacy.bookingTime || new Date().toISOString();

      const migrated = createTicket({
        userId,
        userEmail,
        route: legacy.route || "101",
        fromStop: legacy.from || "",
        toStop: legacy.to || "",
        fare: legacy.fare || 0,
        departureTime: legacy.departure || "",
        arrivalTime: legacy.arrival || "",
        bookingTime,
      });

      const saved = saveTickets(userId, [
        { ...migrated, ticketId: legacy.ticketId, paymentId: legacy.paymentId || migrated.paymentId },
        ...existing,
      ]);

      if (!saved) return;
    }

    localStorage.removeItem(LEGACY_KEY);
  } catch (err) {
    console.error("Error migrating ticket:", err);
    localStorage.removeItem(LEGACY_KEY);
  }
};
