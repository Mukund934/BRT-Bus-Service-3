/**
 * The fleet overview.
 *
 * This is the one screen that joins an account to a vehicle, so the checks
 * that matter are that the join is right, that a driver who has stopped
 * reporting stops counting as on shift, and that a passenger never sees any
 * of it.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FleetStatus from "@/components/dashboards/FleetStatus";
import { ARRIVAL_RULES, POLLING, REMOTE_PATHS } from "@/constants/config";
import { STOP_COORDS } from "@/domain/transit/stops";
import { toBusId } from "@/services/locationService";
import { act, renderWithProviders, screen, waitFor, within } from "../helpers/render";
import {
  enableRtdb,
  makeUser,
  seedRtdb,
  signInAs,
} from "../helpers/firebase";
import { setMockRole } from "../helpers/userService";
import type { UserRecord } from "@/types/user";

vi.mock("@/services/userService", async () => {
  const helper = await import("../helpers/userService");
  return helper.userServiceMock();
});

const roster: UserRecord[] = [];

const driver = (uid: string, name: string): UserRecord => ({
  uid,
  name,
  email: `${uid}@brt.in`,
  role: "driver",
});

const renderFleet = (loading = false) =>
  renderWithProviders(<FleetStatus users={[...roster]} loading={loading} />);

const asAdmin = () => {
  setMockRole("admin");
  signInAs(makeUser({ uid: "admin-1" }), "admin");
};

const asPassenger = () => {
  setMockRole("user");
  signInAs(makeUser({ uid: "user-1" }), "user");
};

const seedDriver = (uid: string, name: string) => {
  roster.push(driver(uid, name));
};

const broadcast = (uid: string, over: Record<string, unknown> = {}) =>
  seedRtdb(`${REMOTE_PATHS.BUS_LOCATIONS}/${uid}`, {
    lat: STOP_COORDS["CBD"]!.lat,
    lng: STOP_COORDS["CBD"]!.lng,
    updatedAt: Date.now(),
    busId: toBusId(uid),
    routeId: "101",
    ...over,
  });

beforeEach(() => {
  roster.length = 0;
  enableRtdb();
});

afterEach(() => {
  vi.useRealTimers();
});

const rowFor = (name: string) => screen.getByText(name).closest("tr")!;

describe("who may see the fleet", () => {
  it("shows nothing to a passenger", async () => {
    renderFleet();
    asPassenger();

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Fleet Status" })
      ).not.toBeInTheDocument()
    );
  });

  it("opens for an administrator", async () => {
    renderFleet();
    asAdmin();

    expect(
      await screen.findByRole("heading", { name: "Fleet Status" })
    ).toBeInTheDocument();
  });
});

describe("matching a driver to their vehicle", () => {
  it("marks a broadcasting driver as on shift", async () => {
    seedDriver("driver-1", "Asha Verma");
    broadcast("driver-1");

    renderFleet();
    asAdmin();

    await screen.findByText("Asha Verma");

    await waitFor(() =>
      expect(within(rowFor("Asha Verma")).getByText("On shift")).toBeInTheDocument()
    );
  });

  it("shows the bus label passengers see, not the account id", async () => {
    seedDriver("driver-1", "Asha Verma");
    broadcast("driver-1");

    renderFleet();
    asAdmin();

    await screen.findByText("Asha Verma");

    expect(within(rowFor("Asha Verma")).getByText(toBusId("driver-1"))).toBeInTheDocument();
    expect(screen.queryByText("driver-1")).not.toBeInTheDocument();
  });

  it("marks a driver who is not reporting as offline", async () => {
    seedDriver("driver-1", "Asha Verma");

    renderFleet();
    asAdmin();

    await screen.findByText("Asha Verma");

    expect(within(rowFor("Asha Verma")).getByText("Offline")).toBeInTheDocument();
  });

  it("does not credit one driver with another's bus", async () => {
    seedDriver("driver-1", "Asha Verma");
    seedDriver("driver-2", "Ravi Kumar");
    broadcast("driver-1");

    renderFleet();
    asAdmin();

    await screen.findByText("Ravi Kumar");

    await waitFor(() =>
      expect(within(rowFor("Asha Verma")).getByText("On shift")).toBeInTheDocument()
    );
    expect(within(rowFor("Ravi Kumar")).getByText("Offline")).toBeInTheDocument();
  });

  it("leaves passengers out of the driver list", async () => {
    seedDriver("driver-1", "Asha Verma");
    roster.push({
      uid: "user-9",
      name: "Neha Rao",
      email: "neha@example.com",
      role: "user",
    });

    renderFleet();
    asAdmin();

    await screen.findByText("Asha Verma");

    expect(screen.queryByText("Neha Rao")).not.toBeInTheDocument();
  });
});

describe("what the vehicle is doing", () => {
  it("names the route the driver declared", async () => {
    seedDriver("driver-1", "Asha Verma");
    broadcast("driver-1", { routeId: "102" });

    renderFleet();
    asAdmin();

    await screen.findByText("Asha Verma");

    await waitFor(() =>
      expect(within(rowFor("Asha Verma")).getByText("Route 102")).toBeInTheDocument()
    );
  });

  it("says nothing it cannot know when no route was declared", async () => {
    seedDriver("driver-1", "Asha Verma");
    broadcast("driver-1", { routeId: undefined });

    renderFleet();
    asAdmin();

    await screen.findByText("Asha Verma");

    expect(within(rowFor("Asha Verma")).getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });
});

describe("counting the fleet", () => {
  it("separates how many drivers exist from how many are running", async () => {
    seedDriver("driver-1", "Asha Verma");
    seedDriver("driver-2", "Ravi Kumar");
    broadcast("driver-1");

    renderFleet();
    asAdmin();

    await screen.findByText("Asha Verma");

    const drivers = screen.getByText("Driver accounts").closest("div")!;
    const onShift = screen.getByText("On shift", { selector: "p" }).closest("div")!;

    expect(within(drivers).getByText("2")).toBeInTheDocument();
    await waitFor(() => expect(within(onShift).getByText("1")).toBeInTheDocument());
  });

  it("narrows the list to whoever is running", async () => {
    seedDriver("driver-1", "Asha Verma");
    seedDriver("driver-2", "Ravi Kumar");
    broadcast("driver-1");

    const { user } = renderFleet();
    asAdmin();

    await screen.findByText("Ravi Kumar");

    await waitFor(() =>
      expect(within(rowFor("Asha Verma")).getByText("On shift")).toBeInTheDocument()
    );

    await user.click(screen.getByRole("button", { name: "On shift" }));

    expect(screen.getByText("Asha Verma")).toBeInTheDocument();
    expect(screen.queryByText("Ravi Kumar")).not.toBeInTheDocument();
  });
});

describe("a driver who stops reporting", () => {
  it("drops off shift on the next check, without a further report", async () => {
    const start = Date.now();

    seedDriver("driver-1", "Asha Verma");
    broadcast("driver-1", { updatedAt: start });

    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(start);

    renderFleet();
    asAdmin();

    await screen.findByText("Asha Verma");
    await waitFor(() =>
      expect(within(rowFor("Asha Verma")).getByText("On shift")).toBeInTheDocument()
    );

    act(() => {
      vi.setSystemTime(start + ARRIVAL_RULES.STALE_LOCATION_MS + 1);
      vi.advanceTimersByTime(POLLING.BUS_FRESHNESS_MS);
    });

    expect(within(rowFor("Asha Verma")).getByText("Offline")).toBeInTheDocument();
  });
});

describe("when live tracking cannot be reached", () => {
  it("still lists the drivers and says why nobody is on shift", async () => {
    const { resetRtdbMock } = await import("../helpers/firebase");

    resetRtdbMock();
    seedDriver("driver-1", "Asha Verma");

    renderFleet();
    asAdmin();

    expect(await screen.findByText("Asha Verma")).toBeInTheDocument();
    expect(await screen.findByText(/Live tracking is unreachable/i)).toBeInTheDocument();
  });
});
