/**
 * The virtual ticket.
 *
 * This is what a passenger shows the driver, so the tests cover what it
 * communicates - journey, status, validity - and the actions attached to it,
 * including the accessibility affordances that make an icon-only control
 * usable.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VirtualTicket from "@/components/VirtualTicket";
import { renderWithProviders, screen, waitFor } from "../helpers/render";
import { makeTicket, makeUpcomingTicket } from "../helpers/factories";

vi.mock("@/services/userService", async () => {
  const helper = await import("../helpers/userService");
  return helper.userServiceMock();
});

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 6, 19, 8, 0, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("what the ticket shows", () => {
  it("names the journey and the route", () => {
    const ticket = makeTicket({ fromStop: "HNLU", toStop: "CBD", route: "101" });

    renderWithProviders(<VirtualTicket ticket={ticket} />);

    expect(
      screen.getByRole("heading", { name: /route 101.*HNLU to CBD/i })
    ).toBeInTheDocument();
  });

  it("states the status in words, not only by colour", () => {
    // Colour alone would leave the status invisible to a screen reader and
    // to anyone who cannot distinguish the badge shades.
    const ticket = makeTicket({}, new Date(2026, 6, 19, 7, 0), {
      status: "COMPLETED",
    });

    renderWithProviders(<VirtualTicket ticket={ticket} />);

    expect(screen.getByText(/ticket status/i)).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("shows the fare paid and both scheduled times", () => {
    const ticket = makeTicket({ fare: 25 });

    renderWithProviders(<VirtualTicket ticket={ticket} />);

    expect(screen.getByText("₹25/-")).toBeInTheDocument();
    expect(screen.getByText("10:00 AM")).toBeInTheDocument();
    expect(screen.getByText("11:00 AM")).toBeInTheDocument();
  });

  it("gives the QR code a text alternative rather than leaving it unlabelled", () => {
    const ticket = makeUpcomingTicket();

    renderWithProviders(<VirtualTicket ticket={ticket} />);

    expect(
      screen.getByRole("img", { name: new RegExp(ticket.ticketId) })
    ).toBeInTheDocument();
  });
});

describe("validity countdown", () => {
  it("counts down while the ticket is live", () => {
    renderWithProviders(<VirtualTicket ticket={makeUpcomingTicket()} />);

    expect(screen.getByRole("timer")).toHaveAccessibleName(/valid for/i);
  });

  it("is absent once the journey is over", () => {
    const ticket = makeTicket({}, new Date(2026, 6, 19, 7, 0), {
      status: "COMPLETED",
    });

    renderWithProviders(<VirtualTicket ticket={ticket} />);

    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
  });
});

describe("cancelling", () => {
  it("offers cancellation for a live ticket and reports which journey", async () => {
    const ticket = makeUpcomingTicket({ fromStop: "HNLU", toStop: "CBD" });
    const onCancel = vi.fn();

    const { user } = renderWithProviders(
      <VirtualTicket ticket={ticket} onCancel={onCancel} />
    );

    const button = screen.getByRole("button", { name: /cancel ticket.*HNLU to CBD/i });
    await user.click(button);

    expect(onCancel).toHaveBeenCalledWith(ticket.ticketId);
  });

  it("does not offer cancellation once the journey is finished", () => {
    const ticket = makeTicket({}, new Date(2026, 6, 19, 7, 0), {
      status: "COMPLETED",
    });

    renderWithProviders(<VirtualTicket ticket={ticket} onCancel={vi.fn()} />);

    expect(
      screen.queryByRole("button", { name: /cancel ticket/i })
    ).not.toBeInTheDocument();
  });

  it("does not offer cancellation when no handler is supplied", () => {
    renderWithProviders(<VirtualTicket ticket={makeUpcomingTicket()} />);

    expect(
      screen.queryByRole("button", { name: /cancel ticket/i })
    ).not.toBeInTheDocument();
  });
});

describe("copying the booking reference", () => {
  it("puts the reference on the clipboard and says so out loud", async () => {
    const ticket = makeUpcomingTicket();
    const { user } = renderWithProviders(<VirtualTicket ticket={ticket} />);

    await user.click(screen.getByRole("button", { name: /copy booking reference/i }));

    // Asserted through user-event's clipboard rather than by spying, so this
    // checks the reference genuinely landed there.
    expect(await navigator.clipboard.readText()).toBe(ticket.ticketId);

    // The visual feedback is a tick icon; a screen reader needs words.
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/copied/i)
    );
  });

  it("says so when the browser refuses clipboard access", async () => {
    const { user } = renderWithProviders(
      <VirtualTicket ticket={makeUpcomingTicket()} />
    );

    // Replaced after render: user-event installs its own clipboard stub
    // during setup, which would otherwise resolve successfully.
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });

    await user.click(screen.getByRole("button", { name: /copy booking reference/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/could not copy/i)
    );
  });
});
