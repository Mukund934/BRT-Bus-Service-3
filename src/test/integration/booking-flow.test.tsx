/**
 * The booking journey, end to end.
 *
 * Everything below runs through the real Timetable page, the real modals and
 * the real ticket context - only Firebase is replaced. Nothing is stubbed
 * between choosing a departure and the ticket appearing on the dashboard, so
 * these are the tests that would catch a break in the seam between two
 * otherwise-correct units.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Timetable from "@/pages/Timetable";
import Dashboard from "@/pages/Dashboard";
import { PAYMENT_CONFIG } from "@/constants/config";
import { loadTickets } from "@/services/ticketService";
import { renderWithProviders, screen, waitFor, within } from "../helpers/render";
import { makeUpcomingTicket, seedStoredTickets } from "../helpers/factories";
import { makeUser, signInAs } from "../helpers/firebase";

vi.mock("@/services/userService", async () => {
  const helper = await import("../helpers/userService");
  return helper.userServiceMock();
});

/*
  Pinned to just before the first weekday departure so every trip in the
  timetable is still bookable regardless of when the suite runs.
*/
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 6, 20, 5, 0, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

const signedIn = () => signInAs(makeUser({ uid: "user-1" }));

describe("a signed-out visitor", () => {
  it("is sent to sign in rather than into the booking dialog", async () => {
    const { user } = renderWithProviders(<Timetable />, { route: "/timetable" });

    const bookButtons = await screen.findAllByRole("button", { name: /^book route/i });
    await user.click(bookButtons[0]!);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("booking a ticket", () => {
  it("carries the chosen journey from the timetable through to a stored ticket", async () => {
    const { user } = renderWithProviders(<Timetable />, { route: "/timetable" });
    signedIn();

    // 1. Pick a departure from the timetable.
    const bookButtons = await screen.findAllByRole("button", {
      name: /^book route 101 departing 6:25 AM/i,
    });
    await user.click(bookButtons[0]!);

    // 2. Choose where to get off.
    const dialog = await screen.findByRole("dialog");
    await user.selectOptions(within(dialog).getByLabelText(/to stop/i), "CBD");

    expect(await within(dialog).findByText("₹10/-")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /proceed to pay/i }));

    // 3. Pay.
    const payment = await screen.findByRole("dialog", { name: /payment/i });

    // The summary interleaves stop names with an aria-hidden arrow and
    // screen-reader-only words, so it is asserted as content of the dialog
    // rather than as a single text node.
    expect(payment).toHaveTextContent("HNLU");
    expect(payment).toHaveTextContent("CBD");
    expect(payment).toHaveTextContent("₹10/-");

    await user.click(
      within(payment).getByRole("button", { name: /simulate payment/i })
    );

    // The gateway is deliberately slow so the processing state is visible.
    await vi.advanceTimersByTimeAsync(PAYMENT_CONFIG.SIMULATED_DELAY_MS + 100);

    expect(
      await screen.findByRole("heading", { name: /payment successful/i })
    ).toBeInTheDocument();

    // 4. The ticket exists, priced and routed as chosen.
    await waitFor(() => expect(loadTickets("user-1")).toHaveLength(1));

    const [ticket] = loadTickets("user-1");
    expect(ticket).toMatchObject({
      userId: "user-1",
      route: "101",
      fromStop: "HNLU",
      toStop: "CBD",
      fare: 10,
      departureTime: "6:25 AM",
      paymentStatus: "SUCCESS",
    });
  });

  it("issues a scannable QR payload tied to that ticket", async () => {
    const { user } = renderWithProviders(<Timetable />, { route: "/timetable" });
    signedIn();

    const bookButtons = await screen.findAllByRole("button", { name: /^book route/i });
    await user.click(bookButtons[0]!);

    const dialog = await screen.findByRole("dialog");
    await user.selectOptions(within(dialog).getByLabelText(/to stop/i), "CBD");
    await user.click(within(dialog).getByRole("button", { name: /proceed to pay/i }));

    const payment = await screen.findByRole("dialog", { name: /payment/i });
    await user.click(
      within(payment).getByRole("button", { name: /simulate payment/i })
    );
    await vi.advanceTimersByTimeAsync(PAYMENT_CONFIG.SIMULATED_DELAY_MS + 100);

    await waitFor(() => expect(loadTickets("user-1")).toHaveLength(1));

    const [ticket] = loadTickets("user-1");
    const payload = JSON.parse(ticket!.qrData);

    expect(payload.tid).toBe(ticket!.ticketId);
    expect(payload.tok).toBe(ticket!.validationToken);
    expect(payload.exp).toBe(ticket!.expiresAt);
  });
});

describe("duplicate booking prevention", () => {
  it("warns and blocks payment when the journey overlaps a ticket already held", async () => {
    // The passenger already holds a 6:25 AM to 6:55 AM journey.
    const existing = makeUpcomingTicket({
      userId: "user-1",
      departureTime: "6:25 AM",
      arrivalTime: "6:55 AM",
    });
    seedStoredTickets("user-1", [existing]);

    const { user } = renderWithProviders(<Timetable />, { route: "/timetable" });
    signedIn();

    await waitFor(() => expect(loadTickets("user-1")).toHaveLength(1));

    const bookButtons = await screen.findAllByRole("button", {
      name: /^book route 101 departing 6:25 AM/i,
    });
    await user.click(bookButtons[0]!);

    const dialog = await screen.findByRole("dialog");
    await user.selectOptions(within(dialog).getByLabelText(/to stop/i), "CBD");

    await waitFor(() =>
      expect(within(dialog).getByRole("alert")).toHaveTextContent(/overlaps/i)
    );

    expect(
      within(dialog).getByRole("button", { name: /proceed to pay/i })
    ).toBeDisabled();
  });
});

describe("the ticket on the dashboard", () => {
  it("shows a live ticket with its journey and a way to cancel it", async () => {
    seedStoredTickets("user-1", [
      makeUpcomingTicket({ userId: "user-1", fromStop: "HNLU", toStop: "CBD" }),
    ]);

    renderWithProviders(<Dashboard />, { route: "/dashboard" });
    signedIn();

    expect(
      await screen.findByRole("heading", { name: /route 101.*HNLU to CBD/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /cancel ticket/i })
    ).toBeInTheDocument();
  });

  it("invites a passenger with no tickets to book one", async () => {
    renderWithProviders(<Dashboard />, { route: "/dashboard" });
    signedIn();

    expect(await screen.findByText(/no active tickets/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /book a ticket/i })
    ).toBeInTheDocument();
  });

  it("moves a cancelled ticket out of the active slot and into history", async () => {
    seedStoredTickets("user-1", [makeUpcomingTicket({ userId: "user-1" })]);

    const { user } = renderWithProviders(<Dashboard />, { route: "/dashboard" });
    signedIn();

    await user.click(await screen.findByRole("button", { name: /cancel ticket/i }));

    expect(await screen.findByText(/no active tickets/i)).toBeInTheDocument();
    expect(loadTickets("user-1")[0]!.status).toBe("CANCELLED");
  });
});
