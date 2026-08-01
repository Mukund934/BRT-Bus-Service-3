import { beforeEach, describe, expect, it, vi } from "vitest";
import Driver from "@/pages/Driver";
import {
  isLiveTrackingAvailable,
  publishLocation,
  stopPublishing,
  toBusId,
} from "@/services/locationService";
import { renderWithProviders, screen, waitFor } from "../helpers/render";
import { ROUTE_IDS, getRoute } from "@/domain/transit/routes";
import { makeUser, signInAs } from "../helpers/firebase";
import { setMockRole } from "../helpers/userService";

vi.mock("@/services/userService", async () => {
  const helper = await import("../helpers/userService");
  return helper.userServiceMock();
});

vi.mock("@/services/locationService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/locationService")>()),
  isLiveTrackingAvailable: vi.fn(async () => true),
  publishLocation: vi.fn(async () => undefined),
  stopPublishing: vi.fn(async () => undefined),
}));

const available = vi.mocked(isLiveTrackingAvailable);
const publish = vi.mocked(publishLocation);
const stop = vi.mocked(stopPublishing);

const AT_HNLU = { coords: { latitude: 21.2514, longitude: 81.6296 } };

const locate = vi.fn();

beforeEach(() => {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: { getCurrentPosition: locate },
  });

  available.mockResolvedValue(true);
  locate.mockImplementation((onSuccess: PositionCallback) =>
    onSuccess(AT_HNLU as GeolocationPosition)
  );
});

const asDriver = () => {
  setMockRole("driver");
  signInAs(makeUser({ uid: "driver-9" }), "driver");
};

const startSharing = async (user: ReturnType<typeof renderWithProviders>["user"]) => {
  const button = await screen.findByRole("button", { name: "Start Sharing" });

  await waitFor(() => expect(button).toBeEnabled());
  await user.click(button);
};

describe("who may broadcast", () => {
  it("names the vehicle without publishing the account it belongs to", async () => {
    renderWithProviders(<Driver />, { route: "/driver" });
    asDriver();

    expect(await screen.findByText(toBusId("driver-9"))).toBeInTheDocument();
    expect(screen.queryByText("driver-9")).not.toBeInTheDocument();
  });

  it("refuses a passenger who reached the page anyway", async () => {
    setMockRole("user");
    renderWithProviders(<Driver />, { route: "/driver" });
    signInAs(makeUser({ uid: "user-1" }));

    await screen.findByText("Not Sharing");

    expect(screen.getByRole("button", { name: "Start Sharing" })).toBeDisabled();
  });
});

describe("starting a shift", () => {
  it("publishes the driver's position", async () => {
    const { user } = renderWithProviders(<Driver />, { route: "/driver" });
    asDriver();

    await startSharing(user);

    await waitFor(() => expect(publish).toHaveBeenCalled());

    expect(publish.mock.calls[0]![1]).toEqual({
      latitude: 21.2514,
      longitude: 81.6296,
    });
    expect(await screen.findByText(/Sharing Live Location/)).toBeInTheDocument();
  });

  it("says so when live tracking cannot be reached", async () => {
    available.mockResolvedValue(false);

    const { user } = renderWithProviders(<Driver />, { route: "/driver" });
    asDriver();

    await startSharing(user);

    expect(
      await screen.findByText("Live tracking is unavailable right now.")
    ).toBeInTheDocument();
    expect(publish).not.toHaveBeenCalled();
  });

  it("explains a refused location permission and stands down", async () => {
    locate.mockImplementation(
      (_onSuccess: PositionCallback, onError: PositionErrorCallback) =>
        onError({ code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError)
    );

    const { user } = renderWithProviders(<Driver />, { route: "/driver" });
    asDriver();

    await startSharing(user);

    expect(
      await screen.findByText(
        "Location permission is required to broadcast your position."
      )
    ).toBeInTheDocument();
    expect(await screen.findByText("Not Sharing")).toBeInTheDocument();
  });
});

describe("ending a shift", () => {
  it("clears the published position when the driver stops", async () => {
    const { user } = renderWithProviders(<Driver />, { route: "/driver" });
    asDriver();

    await startSharing(user);
    await screen.findByText(/Sharing Live Location/);

    await user.click(screen.getByRole("button", { name: "Stop Sharing" }));

    await waitFor(() => expect(stop).toHaveBeenCalled());

    expect(await screen.findByText("Not Sharing")).toBeInTheDocument();
  });

  it("clears the published position when the page is left", async () => {
    const { unmount } = renderWithProviders(<Driver />, { route: "/driver" });
    asDriver();

    await screen.findByText("Not Sharing");

    stop.mockClear();
    unmount();

    expect(stop).toHaveBeenCalled();
  });
});

describe("declaring which route is being run", () => {
  const routeField = () => screen.getByLabelText(/route you are running/i);

  it("offers every operational route", async () => {
    renderWithProviders(<Driver />, { route: "/driver" });
    asDriver();

    await waitFor(() => expect(routeField()).toBeInTheDocument());

    for (const id of ROUTE_IDS) {
      expect(
        screen.getByRole("option", { name: new RegExp(getRoute(id).name) })
      ).toBeInTheDocument();
    }
  });

  it("publishes the route the driver chose", async () => {
    const { user } = renderWithProviders(<Driver />, { route: "/driver" });
    asDriver();

    await waitFor(() => expect(routeField()).toBeInTheDocument());
    await user.selectOptions(routeField(), "102");

    await startSharing(user);

    await waitFor(() => expect(publish).toHaveBeenCalled());

    expect(publish.mock.calls[0]![2]).toBe("102");
  });

  it("locks the choice while a shift is under way", async () => {
    const { user } = renderWithProviders(<Driver />, { route: "/driver" });
    asDriver();

    await waitFor(() => expect(routeField()).toBeInTheDocument());
    await startSharing(user);

    await screen.findByText(/Sharing Live Location/);

    expect(routeField()).toBeDisabled();
  });

  it("names the route it is broadcasting on", async () => {
    const { user } = renderWithProviders(<Driver />, { route: "/driver" });
    asDriver();

    await waitFor(() => expect(routeField()).toBeInTheDocument());
    await user.selectOptions(routeField(), "102");
    await startSharing(user);

    expect(
      await screen.findByText(/Sharing Live Location on Route 102/)
    ).toBeInTheDocument();
  });
});
