import { afterEach, describe, expect, it, vi } from "vitest";
import MapPage from "@/pages/MapPage";
import { ARRIVAL_RULES, POLLING } from "@/constants/config";
import { STOP_COORDS } from "@/domain/transit/stops";
import { locateOnRoute } from "@/domain/transit/routes";
import { subscribeToBuses, type LiveBus } from "@/services/locationService";
import { act, renderWithProviders, screen, within } from "../helpers/render";

vi.mock("@/services/userService", async () => {
  const helper = await import("../helpers/userService");
  return helper.userServiceMock();
});

vi.mock("@/services/locationService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/locationService")>()),
  subscribeToBuses: vi.fn(() => vi.fn()),
}));

const subscribe = vi.mocked(subscribeToBuses);

afterEach(() => {
  vi.useRealTimers();
});

const report = (buses: LiveBus[]) => {
  act(() => subscribe.mock.calls[0]![0](buses));
};

const fail = () => {
  act(() => subscribe.mock.calls[0]![1]!(new Error("unavailable")));
};

describe("waiting for the fleet to report", () => {
  it("says it is still loading", () => {
    renderWithProviders(<MapPage />, { route: "/map" });

    expect(screen.getByText("Loading buses...")).toBeInTheDocument();
  });

  it("says when nothing is running", () => {
    renderWithProviders(<MapPage />, { route: "/map" });

    report([]);

    expect(screen.getByText("No buses active")).toBeInTheDocument();
  });

  it("explains when live tracking cannot be reached", () => {
    renderWithProviders(<MapPage />, { route: "/map" });

    fail();

    expect(
      screen.getByText("Live tracking is unavailable right now. Please try again later.")
    ).toBeInTheDocument();
    expect(screen.queryByText("No buses active")).not.toBeInTheDocument();
  });
});

describe("showing the buses that are running", () => {
  const fleet = (): LiveBus[] => [
    { busId: "BUS-0001", lat: 21, lng: 81, updatedAt: Date.now() },
    { busId: "BUS-0002", lat: 21.5, lng: 81.5 },
  ];

  it("lists each one without naming its driver", () => {
    renderWithProviders(<MapPage />, { route: "/map" });

    report(fleet());

    expect(screen.getByText("BUS-0001")).toBeInTheDocument();
    expect(screen.getByText("BUS-0002")).toBeInTheDocument();
    expect(screen.queryByText(/driver-/i)).not.toBeInTheDocument();
  });

  it("leaves a dash where a bus has never reported a time", () => {
    renderWithProviders(<MapPage />, { route: "/map" });

    report(fleet());

    const withoutTime = screen.getByText("BUS-0002").closest("tr")!;

    expect(within(withoutTime).getAllByText("—").length).toBeGreaterThan(0);
  });

  it("counts the active buses", () => {
    renderWithProviders(<MapPage />, { route: "/map" });

    report(fleet());

    expect(screen.getByText(/Active Buses: 2/)).toBeInTheDocument();
  });

  it("centres the map on the middle of the fleet", () => {
    renderWithProviders(<MapPage />, { route: "/map" });

    report(fleet());

    expect(screen.getByTitle("Live bus locations")).toHaveAttribute(
      "src",
      expect.stringContaining("marker=21.25,81.25")
    );
  });
});

describe("a bus that has stopped reporting", () => {
  const stale = (): LiveBus => ({
    busId: "BUS-STALE",
    lat: 30,
    lng: 90,
    updatedAt: Date.now() - ARRIVAL_RULES.STALE_LOCATION_MS - 1,
  });

  const running = (): LiveBus => ({
    busId: "BUS-0001",
    lat: 21,
    lng: 81,
    updatedAt: Date.now(),
  });

  it("is left out of the count", () => {
    renderWithProviders(<MapPage />, { route: "/map" });

    report([running(), stale()]);

    expect(screen.getByText(/Active Buses: 1/)).toBeInTheDocument();
  });

  it("is left out of the table", () => {
    renderWithProviders(<MapPage />, { route: "/map" });

    report([running(), stale()]);

    expect(screen.getByText("BUS-0001")).toBeInTheDocument();
    expect(screen.queryByText("BUS-STALE")).not.toBeInTheDocument();
  });

  it("does not drag the map away from the buses that are running", () => {
    renderWithProviders(<MapPage />, { route: "/map" });

    report([running(), stale()]);

    expect(screen.getByTitle("Live bus locations")).toHaveAttribute(
      "src",
      expect.stringContaining("marker=21,81")
    );
  });

  it("leaves the map empty when every bus has gone quiet", () => {
    renderWithProviders(<MapPage />, { route: "/map" });

    report([stale()]);

    expect(screen.getByText("No buses active")).toBeInTheDocument();
    expect(screen.getByText(/Active Buses: 0/)).toBeInTheDocument();
  });

  it("is retired while the map stays open, without a further report", () => {
    const start = Date.now();

    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(start);

    renderWithProviders(<MapPage />, { route: "/map" });

    report([{ busId: "BUS-0001", lat: 21, lng: 81, updatedAt: start }]);

    expect(screen.getByText(/Active Buses: 1/)).toBeInTheDocument();

    act(() => {
      vi.setSystemTime(start + ARRIVAL_RULES.STALE_LOCATION_MS + 1);
      vi.advanceTimersByTime(POLLING.BUS_FRESHNESS_MS);
    });

    expect(screen.getByText("No buses active")).toBeInTheDocument();
  });
});

describe("leaving the map", () => {
  it("stops listening for positions", () => {
    const { unmount } = renderWithProviders(<MapPage />, { route: "/map" });

    const unsubscribe = subscribe.mock.results[0]!.value as () => void;

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});

describe("telling a passenger where a bus is going", () => {
  const onRoute = (): LiveBus[] => [
    {
      busId: "BUS-ROUTE",
      lat: STOP_COORDS["CBD"]!.lat,
      lng: STOP_COORDS["CBD"]!.lng,
      updatedAt: Date.now(),
      routeId: "101",
    },
  ];

  it("names the route it is running", () => {
    renderWithProviders(<MapPage />, { route: "/map" });

    report(onRoute());

    expect(screen.getByText("Route 101")).toBeInTheDocument();
  });

  it("names the stop it reaches next", () => {
    renderWithProviders(<MapPage />, { route: "/map" });

    report(onRoute());

    const expected = locateOnRoute("101", STOP_COORDS["CBD"]!)!.nextStop!;

    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("names where the journey ends", () => {
    renderWithProviders(<MapPage />, { route: "/map" });

    report(onRoute());

    expect(screen.getByText("Raipur Railway Station")).toBeInTheDocument();
  });

  it("says nothing it cannot know for a bus with no route", () => {
    renderWithProviders(<MapPage />, { route: "/map" });

    report([
      { busId: "BUS-BARE", lat: 21, lng: 81, updatedAt: Date.now() },
    ]);

    const row = screen.getByText("BUS-BARE").closest("tr")!;

    expect(within(row).queryByText("Route 101")).not.toBeInTheDocument();
    expect(within(row).getAllByText("—").length).toBeGreaterThanOrEqual(3);
  });
});
