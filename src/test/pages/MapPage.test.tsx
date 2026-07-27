import { describe, expect, it, vi } from "vitest";
import MapPage from "@/pages/MapPage";
import { subscribeToBuses, type LiveBus } from "@/services/locationService";
import { act, renderWithProviders, screen } from "../helpers/render";

vi.mock("@/services/userService", async () => {
  const helper = await import("../helpers/userService");
  return helper.userServiceMock();
});

vi.mock("@/services/locationService", () => ({
  subscribeToBuses: vi.fn(() => vi.fn()),
}));

const subscribe = vi.mocked(subscribeToBuses);

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
  const fleet: LiveBus[] = [
    { busId: "BUS-0001", lat: 21, lng: 81, updatedAt: 1_770_000_000_000 },
    { busId: "BUS-0002", lat: 21.5, lng: 81.5 },
  ];

  it("lists each one without naming its driver", () => {
    renderWithProviders(<MapPage />, { route: "/map" });

    report(fleet);

    expect(screen.getByText("BUS-0001")).toBeInTheDocument();
    expect(screen.getByText("21.00000")).toBeInTheDocument();
    expect(screen.getByText("81.50000")).toBeInTheDocument();
  });

  it("leaves a dash where a bus has never reported a time", () => {
    renderWithProviders(<MapPage />, { route: "/map" });

    report(fleet);

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("counts the active buses", () => {
    renderWithProviders(<MapPage />, { route: "/map" });

    report(fleet);

    expect(screen.getByText(/Active Buses: 2/)).toBeInTheDocument();
  });

  it("centres the map on the middle of the fleet", () => {
    renderWithProviders(<MapPage />, { route: "/map" });

    report(fleet);

    expect(screen.getByTitle("Live bus locations")).toHaveAttribute(
      "src",
      expect.stringContaining("marker=21.25,81.25")
    );
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
