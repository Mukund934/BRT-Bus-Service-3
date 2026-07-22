/**
 * The ticket context wires the domain to React.
 *
 * These tests drive it through the real provider stack and the mocked auth
 * listener, so they cover the seams that unit tests cannot: what happens on
 * sign-in, on sign-out, when a different account signs in on the same device,
 * and as time passes.
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TicketProvider, useTickets } from "@/contexts/TicketContext";
import { POLLING } from "@/constants/config";
import {
  makeDraft,
  makeFutureDraft,
  makeTicket,
  makeUpcomingTicket,
  seedStoredTickets,
} from "../helpers/factories";
import { makeUser, signInAs, signOutMock } from "../helpers/firebase";

// These tests are about tickets, not user records.
vi.mock("@/services/userService", async () => {
  const helper = await import("../helpers/userService");
  return helper.userServiceMock();
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <AuthProvider>
      <TicketProvider>{children}</TicketProvider>
    </AuthProvider>
  </MemoryRouter>
);

const renderTickets = () => renderHook(() => useTickets(), { wrapper });

describe("without a signed-in passenger", () => {
  it("holds no tickets", async () => {
    const { result } = renderTickets();

    await waitFor(() => expect(result.current.tickets).toEqual([]));
    expect(result.current.activeTicket).toBeNull();
  });

  it("refuses to book", async () => {
    const { result } = renderTickets();

    const outcome = result.current.bookTicket(makeDraft());

    expect(outcome).toEqual({ ok: false, reason: "NOT_AUTHENTICATED" });
  });
});

describe("signing in", () => {
  it("loads the tickets already stored for that account", async () => {
    const stored = makeTicket({ userId: "user-1" });
    seedStoredTickets("user-1", [stored]);

    const { result } = renderTickets();
    act(() => signInAs(makeUser({ uid: "user-1" })));

    await waitFor(() => expect(result.current.tickets).toHaveLength(1));
    expect(result.current.tickets[0]!.ticketId).toBe(stored.ticketId);
  });

  it("does not surface tickets belonging to another account", async () => {
    seedStoredTickets("user-1", [makeTicket({ userId: "someone-else" })]);

    const { result } = renderTickets();
    act(() => signInAs(makeUser({ uid: "user-1" })));

    await waitFor(() => expect(result.current.tickets).toEqual([]));
  });

  it("clears a previous passenger's cached tickets from a shared device", async () => {
    seedStoredTickets("user-2", [makeTicket({ userId: "user-2" })]);

    const { result } = renderTickets();
    act(() => signInAs(makeUser({ uid: "user-1" })));

    await waitFor(() => expect(result.current.tickets).toEqual([]));
    expect(localStorage.getItem("brt.tickets.user-2")).toBeNull();
  });
});

describe("signing out", () => {
  it("empties the in-memory state", async () => {
    seedStoredTickets("user-1", [makeTicket({ userId: "user-1" })]);

    const { result } = renderTickets();
    act(() => signInAs(makeUser({ uid: "user-1" })));
    await waitFor(() => expect(result.current.tickets).toHaveLength(1));

    act(() => signOutMock());

    await waitFor(() => expect(result.current.tickets).toEqual([]));
  });
});

describe("booking through the context", () => {
  it("adds the ticket and makes it the active one", async () => {
    const { result } = renderTickets();
    act(() => signInAs(makeUser({ uid: "user-1" })));
    await waitFor(() => expect(result.current.tickets).toEqual([]));

    let outcome: ReturnType<typeof result.current.bookTicket> | undefined;

    act(() => {
      outcome = result.current.bookTicket(makeFutureDraft({ userId: "user-1" }));
    });

    expect(outcome?.ok).toBe(true);
    await waitFor(() => expect(result.current.tickets).toHaveLength(1));
    expect(result.current.activeTicket).not.toBeNull();
  });

  it("persists the booking so it survives a reload", async () => {
    const { result } = renderTickets();
    act(() => signInAs(makeUser({ uid: "user-1" })));
    await waitFor(() => expect(result.current.tickets).toEqual([]));

    act(() => {
      result.current.bookTicket(makeFutureDraft({ userId: "user-1" }));
    });

    await waitFor(() =>
      expect(localStorage.getItem("brt.tickets.user-1")).not.toBeNull()
    );
  });
});

describe("cancelling through the context", () => {
  it("moves the ticket into history", async () => {
    const stored = makeUpcomingTicket({ userId: "user-1" });
    seedStoredTickets("user-1", [stored]);

    const { result } = renderTickets();
    act(() => signInAs(makeUser({ uid: "user-1" })));
    await waitFor(() => expect(result.current.tickets).toHaveLength(1));

    act(() => result.current.cancelTicket(stored.ticketId));

    await waitFor(() =>
      expect(result.current.tickets[0]!.status).toBe("CANCELLED")
    );
    expect(result.current.activeTicket).toBeNull();
    expect(result.current.ticketHistory).toHaveLength(1);
  });
});

describe("as time passes", () => {
  it("re-derives ticket status on its polling interval", async () => {
    /*
      A ticket booked for a departure that has since passed must move to
      COMPLETED without a reload. The status engine is pure, so what is
      being tested here is that the provider actually re-runs it.
    */
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const stored = makeTicket({ userId: "user-1" }, new Date(), {
      status: "ACTIVE",
      departureTime: "12:00 AM",
      arrivalTime: "12:01 AM",
    });
    seedStoredTickets("user-1", [stored]);

    const { result } = renderTickets();
    act(() => signInAs(makeUser({ uid: "user-1" })));

    await waitFor(() => expect(result.current.tickets).toHaveLength(1));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLLING.TICKET_STATUS_MS + 100);
    });

    expect(result.current.tickets[0]!.status).toBe("COMPLETED");

    vi.useRealTimers();
  });
});
