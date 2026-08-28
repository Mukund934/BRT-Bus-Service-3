import { describe, expect, it, vi } from "vitest";
import ServiceAlerts from "@/components/ServiceAlerts";
import { renderWithProviders, screen, waitFor, within } from "../helpers/render";
import { seedDoc } from "../helpers/firebase";

vi.mock("@/services/userService", async () => {
  const helper = await import("../helpers/userService");
  return helper.userServiceMock();
});

const alertsRegion = () =>
  screen.queryByRole("region", { name: /service announcements/i });

const seedAnnouncement = (id: string, over: Record<string, unknown> = {}) =>
  seedDoc("announcements", id, {
    title: "Sector 27 stop closed",
    body: "Board at Sector 29 until further notice.",
    severity: "WARNING",
    active: true,
    ...over,
  });

describe("what a visitor is told", () => {
  it("shows a published notice", async () => {
    seedAnnouncement("a1");

    renderWithProviders(<ServiceAlerts />);

    expect(await screen.findByText("Sector 27 stop closed")).toBeInTheDocument();
    expect(
      screen.getByText("Board at Sector 29 until further notice.")
    ).toBeInTheDocument();
  });

  it("takes up no room when there is nothing to say", async () => {
    renderWithProviders(<ServiceAlerts />);

    await waitFor(() => expect(alertsRegion()).not.toBeInTheDocument());
  });

  it("says nothing about a retired notice", async () => {
    seedAnnouncement("a1", { active: false });

    renderWithProviders(<ServiceAlerts />);

    await waitFor(() => expect(alertsRegion()).not.toBeInTheDocument());
    expect(screen.queryByText("Sector 27 stop closed")).not.toBeInTheDocument();
  });

  /*
    The announcement has to be spoken by a region that was ALREADY in the
    document. These cards do not exist until the fetch resolves, so a role on
    them is a live region arriving with its message already inside it, which
    most screen readers do not announce at all. The app's shared assertive
    region is mounted from the first paint, so it is the one that works.
  */
  it("interrupts a screen reader only for a major disruption", async () => {
    seedAnnouncement("a1", { severity: "CRITICAL", title: "Services suspended" });

    renderWithProviders(<ServiceAlerts />);

    await screen.findByText("Services suspended");

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Services suspended")
    );
  });

  it("speaks it from a region that predates the notice", async () => {
    seedAnnouncement("a1", { severity: "CRITICAL", title: "Services suspended" });

    renderWithProviders(<ServiceAlerts />);

    await screen.findByText("Services suspended");

    // The card carries no live-region role of its own to compete with it.
    expect(within(alertsRegion()!).queryByRole("alert")).not.toBeInTheDocument();
    expect(within(alertsRegion()!).queryByRole("status")).not.toBeInTheDocument();
  });

  it("reports an ordinary notice without interrupting", async () => {
    seedAnnouncement("a1", { severity: "INFO", title: "New timetable published" });

    renderWithProviders(<ServiceAlerts />);

    await screen.findByText("New timetable published");

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "New timetable published"
      )
    );

    expect(screen.getByRole("alert")).toHaveTextContent("");
  });

  it("names the severity for a reader who cannot see the colour", async () => {
    seedAnnouncement("a1", { severity: "CRITICAL" });

    renderWithProviders(<ServiceAlerts />);

    expect(await screen.findByText(/Major disruption/)).toBeInTheDocument();
  });

  it("shows every current notice, not just the first", async () => {
    seedAnnouncement("a1", { title: "First notice" });
    seedAnnouncement("a2", { title: "Second notice" });

    renderWithProviders(<ServiceAlerts />);

    expect(await screen.findByText("First notice")).toBeInTheDocument();
    expect(screen.getByText("Second notice")).toBeInTheDocument();
  });
});
