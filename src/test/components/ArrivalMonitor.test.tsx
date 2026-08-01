import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ArrivalMonitor from "@/components/ArrivalMonitor";
import { useAuth } from "@/contexts/AuthContext";
import { useTickets } from "@/contexts/TicketContext";
import { STOP_COORDS } from "@/domain/transit/stops";
import { subscribeToBuses, type LiveBus } from "@/services/locationService";
import { act, renderWithProviders, screen } from "../helpers/render";
import { makeUpcomingTicket, seedStoredTickets, TEST_NOW } from "../helpers/factories";
import { makeUser, signInAs } from "../helpers/firebase";
import { setMockNotifications } from "../helpers/userService";

vi.mock("@/services/userService", async () => {
  const helper = await import("../helpers/userService");
  return helper.userServiceMock();
});

vi.mock("@/services/locationService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/locationService")>()),
  subscribeToBuses: vi.fn(() => vi.fn()),
}));

const subscribe = vi.mocked(subscribeToBuses);

const BOARDING = STOP_COORDS["HNLU"]!;

const busAt = (lat: number, lng: number, over: Partial<LiveBus> = {}): LiveBus => ({
  lat,
  lng,
  updatedAt: Date.now(),
  busId: "BUS-0001",
  ...over,
});

const holdingTicket = (over = {}) => {
  seedStoredTickets("user-1", [makeUpcomingTicket({ userId: "user-1", ...over })]);
};

const SessionState = () => {
  const { loading } = useAuth();
  const { activeTicket } = useTickets();

  if (loading) return <p>resolving</p>;

  return <p>ready {activeTicket ? "holding" : "empty"}</p>;
};

const watched = (
  <>
    <ArrivalMonitor />
    <SessionState />
  </>
);

const settle = async (state: "holding" | "empty") => {
  await screen.findByText(`ready ${state}`);
  await act(async () => {});
};

const arrive = async () => {
  await settle("holding");

  return subscribe.mock.calls[0]![0];
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(TEST_NOW);
});

afterEach(() => {
  setMockNotifications(true);
});

describe("deciding whether to watch for a bus", () => {
  it("stays idle for a signed-out visitor", async () => {
    renderWithProviders(watched);

    await settle("empty");

    expect(subscribe).not.toHaveBeenCalled();
  });

  it("stays idle for a passenger holding no ticket", async () => {
    renderWithProviders(watched);
    signInAs(makeUser({ uid: "user-1" }));

    await settle("empty");

    expect(subscribe).not.toHaveBeenCalled();
  });

  it("stays idle when the passenger has switched alerts off", async () => {
    setMockNotifications(false);
    holdingTicket();

    renderWithProviders(watched);
    signInAs(makeUser({ uid: "user-1" }));

    await settle("holding");

    expect(subscribe).not.toHaveBeenCalled();
  });

  it("stays idle when the boarding stop has no published coordinates", async () => {
    holdingTicket({ fromStop: "IIM" });

    renderWithProviders(watched);
    signInAs(makeUser({ uid: "user-1" }));

    await settle("holding");

    expect(subscribe).not.toHaveBeenCalled();
  });

  it("watches once a passenger holds a live ticket", async () => {
    holdingTicket();

    renderWithProviders(watched);
    signInAs(makeUser({ uid: "user-1" }));

    await settle("holding");

    expect(subscribe).toHaveBeenCalledTimes(1);
  });

  it("stops watching when it leaves the page", async () => {
    holdingTicket();

    const { unmount } = renderWithProviders(watched);
    signInAs(makeUser({ uid: "user-1" }));

    await arrive();

    const unsubscribe = subscribe.mock.results[0]!.value as () => void;

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});

describe("alerting the passenger", () => {
  it("speaks up when a bus is close to the boarding stop", async () => {
    holdingTicket();

    renderWithProviders(watched);
    signInAs(makeUser({ uid: "user-1" }));

    const onBuses = await arrive();

    act(() => onBuses([busAt(BOARDING.lat, BOARDING.lng)]));

    expect(await screen.findByText("Bus 101")).toBeInTheDocument();
  });

  it("says nothing while the nearest bus is still far away", async () => {
    holdingTicket();

    renderWithProviders(watched);
    signInAs(makeUser({ uid: "user-1" }));

    const onBuses = await arrive();

    act(() => onBuses([busAt(BOARDING.lat + 0.5, BOARDING.lng)]));

    expect(screen.queryByText("Bus 101")).not.toBeInTheDocument();
  });

  it("ignores a position that has gone stale", async () => {
    holdingTicket();

    renderWithProviders(watched);
    signInAs(makeUser({ uid: "user-1" }));

    const onBuses = await arrive();

    act(() =>
      onBuses([
        busAt(BOARDING.lat, BOARDING.lng, { updatedAt: Date.now() - 200_000 }),
      ])
    );

    expect(screen.queryByText("Bus 101")).not.toBeInTheDocument();
  });

  it("does not repeat itself while the bus lingers", async () => {
    holdingTicket();

    renderWithProviders(watched);
    signInAs(makeUser({ uid: "user-1" }));

    const onBuses = await arrive();

    act(() => onBuses([busAt(BOARDING.lat, BOARDING.lng)]));
    await screen.findByText("Bus 101");

    act(() => onBuses([busAt(BOARDING.lat, BOARDING.lng)]));

    expect(screen.getAllByText("Bus 101")).toHaveLength(1);
  });
});
