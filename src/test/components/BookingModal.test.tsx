/**
 * The booking dialog.
 *
 * Everything is driven the way a passenger drives it - selecting from
 * comboboxes by their visible label, reading the fare off the screen - rather
 * than by poking at component state. That keeps the tests honest about what
 * the UI actually offers.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BookingModal from "@/components/BookingModal";
import type { JourneySelection } from "@/domain/ticket/types";
import { getCallTime, getTripStops } from "@/domain/transit/schedule";
import { renderWithProviders, screen, waitFor, within } from "../helpers/render";
import { expressTrip, firstWeekdayTrip } from "../helpers/factories";

vi.mock("@/services/userService", async () => {
  const helper = await import("../helpers/userService");
  return helper.userServiceMock();
});

/*
  The clock is frozen just before the first weekday departure (6:25 AM).

  Without this the suite passes or fails depending on the time of day it
  runs: every trip in the timetable is "already departed" after the last
  service, which silently disables the booking button.

  `shouldAdvanceTime` lets fake timers tick along with real time, which is
  what keeps user-event's internal waits from deadlocking.
*/
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 6, 20, 5, 0, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

const renderModal = (
  overrides: Partial<React.ComponentProps<typeof BookingModal>> = {}
) => {
  const onClose = vi.fn();
  const onProceedPayment = vi.fn<(selection: JourneySelection) => void>();

  const utils = renderWithProviders(
    <BookingModal
      open
      trip={firstWeekdayTrip()}
      onClose={onClose}
      onProceedPayment={onProceedPayment}
      {...overrides}
    />
  );

  return { ...utils, onClose, onProceedPayment };
};

describe("presentation", () => {
  it("is exposed as a dialog with a name and description", async () => {
    renderModal();

    const dialog = await screen.findByRole("dialog");

    expect(dialog).toHaveAccessibleName(/book your ticket/i);
    expect(dialog).toHaveAccessibleDescription(/route 101/i);
  });

  it("labels both stop selectors", async () => {
    renderModal();

    expect(await screen.findByLabelText(/from stop/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/to stop/i)).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    renderModal({ open: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("which stops are offered", () => {
  it("offers every stop the trip calls at", async () => {
    renderModal();

    const from = (await screen.findByLabelText(/from stop/i)) as HTMLSelectElement;
    const offered = [...from.options].map((option) => option.value);

    expect(offered).toEqual(getTripStops(firstWeekdayTrip()));
  });

  it("omits stops the express route skips", async () => {
    renderModal({ trip: expressTrip() });

    const from = (await screen.findByLabelText(/from stop/i)) as HTMLSelectElement;
    const offered = [...from.options].map((option) => option.value);

    expect(offered).not.toContain("Indravati Bhavan");
    expect(offered).not.toContain("Mahanadi Bhavan");
    expect(offered).toContain("CBD");
  });

  it("only lets a passenger travel forwards along the route", async () => {
    const { user } = renderModal();
    const stops = getTripStops(firstWeekdayTrip());

    await user.selectOptions(await screen.findByLabelText(/from stop/i), stops[3]!);

    const to = screen.getByLabelText(/to stop/i) as HTMLSelectElement;
    const destinations = [...to.options]
      .map((option) => option.value)
      .filter(Boolean);

    expect(destinations).toEqual(stops.slice(4));
  });

  it("clears a chosen destination when the origin moves past it", async () => {
    const { user } = renderModal();
    const stops = getTripStops(firstWeekdayTrip());

    await user.selectOptions(screen.getByLabelText(/to stop/i), stops[2]!);
    await user.selectOptions(screen.getByLabelText(/from stop/i), stops[5]!);

    // Leaving the old value selected would let someone book a journey
    // backwards along the corridor.
    expect((screen.getByLabelText(/to stop/i) as HTMLSelectElement).value).toBe("");
  });
});

describe("the journey summary", () => {
  it("stays hidden until a destination is chosen", async () => {
    renderModal();

    await screen.findByLabelText(/from stop/i);

    expect(screen.queryByText(/^₹/)).not.toBeInTheDocument();
  });

  it("shows the fare and the scheduled times for the chosen stops", async () => {
    const trip = firstWeekdayTrip();
    const { user } = renderModal({ trip });

    await user.selectOptions(await screen.findByLabelText(/to stop/i), "CBD");

    // HNLU to CBD is ₹10 in the fare table.
    expect(await screen.findByText("₹10/-")).toBeInTheDocument();
    expect(screen.getByText(getCallTime(trip, "HNLU")!)).toBeInTheDocument();
    expect(screen.getByText(getCallTime(trip, "CBD")!)).toBeInTheDocument();
  });

  it("updates the fare when the destination changes", async () => {
    const { user } = renderModal();

    await user.selectOptions(await screen.findByLabelText(/to stop/i), "CBD");
    expect(await screen.findByText("₹10/-")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/to stop/i), "Raipur Railway Station");
    expect(await screen.findByText("₹35/-")).toBeInTheDocument();
  });
});

describe("proceeding to payment", () => {
  it("is blocked until a destination is chosen", async () => {
    renderModal();

    expect(await screen.findByRole("button", { name: /proceed to pay/i })).toBeDisabled();
  });

  it("hands on exactly what the passenger selected", async () => {
    const trip = firstWeekdayTrip();
    const { user, onProceedPayment } = renderModal({ trip });

    await user.selectOptions(await screen.findByLabelText(/to stop/i), "CBD");
    await user.click(screen.getByRole("button", { name: /proceed to pay/i }));

    expect(onProceedPayment).toHaveBeenCalledTimes(1);
    expect(onProceedPayment.mock.calls[0]![0]).toMatchObject({
      route: trip.routeId,
      fromStop: "HNLU",
      toStop: "CBD",
      fare: 10,
      departureTime: getCallTime(trip, "HNLU"),
      arrivalTime: getCallTime(trip, "CBD"),
    });
  });

  it("refuses a bus that has already departed", async () => {
    // Move past the last service of the day.
    vi.setSystemTime(new Date(2026, 6, 20, 23, 0, 0));

    const { user } = renderModal();

    const dialog = await screen.findByRole("dialog");
    await user.selectOptions(await screen.findByLabelText(/to stop/i), "CBD");

    // Scoped to the dialog: the app also keeps a global assertive live
    // region, which is itself a role="alert".
    await waitFor(() =>
      expect(within(dialog).getByRole("alert")).toHaveTextContent(/already departed/i)
    );

    expect(screen.getByRole("button", { name: /proceed to pay/i })).toBeDisabled();
  });
});

describe("dismissing", () => {
  it("closes on Escape", async () => {
    const { user, onClose } = renderModal();

    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("closes from the cancel button", async () => {
    const { user, onClose } = renderModal();

    await user.click(await screen.findByRole("button", { name: /^cancel$/i }));

    expect(onClose).toHaveBeenCalled();
  });

  it("keeps focus inside the dialog", async () => {
    renderModal();

    const dialog = await screen.findByRole("dialog");

    // Radix moves focus into the dialog on open; if it did not, a keyboard
    // user would be tabbing around the page behind the overlay.
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  });
});
