import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import UserDashboard from "@/components/dashboards/UserDashboard";
import { updateNotificationPreference } from "@/services/userService";
import { renderWithProviders, screen, waitFor } from "../helpers/render";
import { makeUser, signInAs } from "../helpers/firebase";
import { setMockNotifications, setMockRole } from "../helpers/userService";

vi.mock("@/services/userService", async () => {
  const helper = await import("../helpers/userService");
  return helper.userServiceMock();
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const savePreference = vi.mocked(updateNotificationPreference);

const asPassenger = () => {
  setMockRole("user");
  signInAs(makeUser({ uid: "rider-7", displayName: "Neha Rao" }), "user");
};

const alertsToggle = () => screen.getByRole("button", { name: /arrival alerts/i });

beforeEach(() => {
  setMockNotifications(true);
});

describe("choosing whether to be told a bus is close", () => {
  it("starts switched on for a passenger who has never chosen", async () => {
    renderWithProviders(<UserDashboard />, { route: "/dashboard" });
    asPassenger();

    await waitFor(() => expect(alertsToggle()).toHaveAttribute("aria-pressed", "true"));
  });

  it("shows the choice a passenger has already made", async () => {
    setMockNotifications(false);

    renderWithProviders(<UserDashboard />, { route: "/dashboard" });
    asPassenger();

    await waitFor(() => expect(alertsToggle()).toHaveAttribute("aria-pressed", "false"));
  });

  it("records the passenger switching alerts off", async () => {
    const { user } = renderWithProviders(<UserDashboard />, { route: "/dashboard" });
    asPassenger();

    await waitFor(() => expect(alertsToggle()).toHaveAttribute("aria-pressed", "true"));
    await user.click(alertsToggle());

    expect(savePreference).toHaveBeenCalledWith("rider-7", false);
  });

  it("reflects the new setting without a reload", async () => {
    const { user } = renderWithProviders(<UserDashboard />, { route: "/dashboard" });
    asPassenger();

    await waitFor(() => expect(alertsToggle()).toHaveAttribute("aria-pressed", "true"));
    await user.click(alertsToggle());

    await waitFor(() =>
      expect(alertsToggle()).toHaveAttribute("aria-pressed", "false")
    );
  });

  it("switches alerts back on again", async () => {
    setMockNotifications(false);

    const { user } = renderWithProviders(<UserDashboard />, { route: "/dashboard" });
    asPassenger();

    await waitFor(() => expect(alertsToggle()).toHaveAttribute("aria-pressed", "false"));
    await user.click(alertsToggle());

    expect(savePreference).toHaveBeenCalledWith("rider-7", true);
  });
});

describe("when the browser must be asked", () => {
  const requestPermission = () =>
    (window.Notification as unknown as { requestPermission: ReturnType<typeof vi.fn> })
      .requestPermission;

  it("is not asked merely for opening the dashboard", async () => {
    renderWithProviders(<UserDashboard />, { route: "/dashboard" });
    asPassenger();

    await waitFor(() => expect(alertsToggle()).toHaveAttribute("aria-pressed", "true"));

    expect(requestPermission()).not.toHaveBeenCalled();
  });

  it("is asked when the passenger switches alerts on", async () => {
    setMockNotifications(false);

    const { user } = renderWithProviders(<UserDashboard />, { route: "/dashboard" });
    asPassenger();

    await waitFor(() => expect(alertsToggle()).toHaveAttribute("aria-pressed", "false"));
    await user.click(alertsToggle());

    await waitFor(() => expect(requestPermission()).toHaveBeenCalled());
  });

  it("is not asked when the passenger switches alerts off", async () => {
    const { user } = renderWithProviders(<UserDashboard />, { route: "/dashboard" });
    asPassenger();

    await waitFor(() => expect(alertsToggle()).toHaveAttribute("aria-pressed", "true"));
    await user.click(alertsToggle());

    expect(requestPermission()).not.toHaveBeenCalled();
  });
});

describe("when the setting cannot be saved", () => {
  it("tells the passenger rather than failing silently", async () => {
    savePreference.mockRejectedValueOnce(new Error("offline"));

    const { user } = renderWithProviders(<UserDashboard />, { route: "/dashboard" });
    asPassenger();

    await waitFor(() => expect(alertsToggle()).toHaveAttribute("aria-pressed", "true"));
    await user.click(alertsToggle());

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it("leaves the setting showing what is actually stored", async () => {
    savePreference.mockRejectedValueOnce(new Error("offline"));

    const { user } = renderWithProviders(<UserDashboard />, { route: "/dashboard" });
    asPassenger();

    await waitFor(() => expect(alertsToggle()).toHaveAttribute("aria-pressed", "true"));
    await user.click(alertsToggle());

    await waitFor(() => expect(toast.error).toHaveBeenCalled());

    expect(alertsToggle()).toHaveAttribute("aria-pressed", "true");
  });
});
