import { describe, expect, it, vi } from "vitest";
import AnnouncementManager from "@/components/dashboards/AnnouncementManager";
import { renderWithProviders, screen, waitFor } from "../helpers/render";
import { makeUser, readDoc, seedDoc, signInAs } from "../helpers/firebase";
import { setMockRole } from "../helpers/userService";

vi.mock("@/services/userService", async () => {
  const helper = await import("../helpers/userService");
  return helper.userServiceMock();
});

const asAdmin = () => {
  setMockRole("admin");
  signInAs(makeUser({ uid: "admin-1", displayName: "Ops" }), "admin");
};

const asPassenger = () => {
  setMockRole("user");
  signInAs(makeUser({ uid: "user-1" }), "user");
};

const seedAnnouncement = (id: string, over: Record<string, unknown> = {}) =>
  seedDoc("announcements", id, {
    title: "Sector 27 stop closed",
    body: "Board at Sector 29 until further notice.",
    severity: "WARNING",
    active: true,
    ...over,
  });

const publishForm = async () => {
  await screen.findByRole("heading", { name: "Passenger Announcements" });

  return {
    title: screen.getByLabelText("Title"),
    body: screen.getByLabelText("Message"),
    severity: screen.getByLabelText("Severity"),
    submit: screen.getByRole("button", { name: /publish announcement/i }),
  };
};

describe("who may author a notice", () => {
  it("shows nothing at all to a passenger", async () => {
    renderWithProviders(<AnnouncementManager />);
    asPassenger();

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Passenger Announcements" })
      ).not.toBeInTheDocument()
    );
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
  });

  it("opens for an administrator", async () => {
    renderWithProviders(<AnnouncementManager />);
    asAdmin();

    expect(
      await screen.findByRole("heading", { name: "Passenger Announcements" })
    ).toBeInTheDocument();
  });
});

describe("publishing a notice", () => {
  it("stores what the administrator wrote", async () => {
    const { user } = renderWithProviders(<AnnouncementManager />);
    asAdmin();

    const form = await publishForm();

    await user.type(form.title, "Sector 27 stop closed");
    await user.type(form.body, "Board at Sector 29 until further notice.");
    await user.selectOptions(form.severity, "WARNING");
    await user.click(form.submit);

    await waitFor(() =>
      expect(readDoc("announcements", "generated-1")).toMatchObject({
        title: "Sector 27 stop closed",
        severity: "WARNING",
        active: true,
      })
    );
  });

  it("lists it straight away without a reload", async () => {
    const { user } = renderWithProviders(<AnnouncementManager />);
    asAdmin();

    const form = await publishForm();

    await user.type(form.title, "New timetable published");
    await user.type(form.body, "Weekend times have changed.");
    await user.click(form.submit);

    await waitFor(() =>
      expect(screen.getAllByText(/New timetable published/).length).toBeGreaterThan(0)
    );
  });

  it("refuses to publish an empty notice", async () => {
    const { user } = renderWithProviders(<AnnouncementManager />);
    asAdmin();

    const form = await publishForm();

    await user.click(form.submit);

    expect(await screen.findByText(/A title is required/i)).toBeInTheDocument();
  });

  it("writes nothing when it refuses", async () => {
    const { user } = renderWithProviders(<AnnouncementManager />);
    asAdmin();

    const form = await publishForm();

    await user.click(form.submit);
    await screen.findByText(/A title is required/i);

    expect(readDoc("announcements", "generated-1")).toBeUndefined();
  });
});

describe("managing what is already published", () => {
  it("lists a retired notice as retired", async () => {
    seedAnnouncement("a1", { active: false });

    renderWithProviders(<AnnouncementManager />);
    asAdmin();

    expect(await screen.findByText("Retired")).toBeInTheDocument();
  });

  it("takes a notice off the site", async () => {
    seedAnnouncement("a1");

    const { user } = renderWithProviders(<AnnouncementManager />);
    asAdmin();

    await user.click(await screen.findByRole("button", { name: /^Retire/ }));

    await waitFor(() =>
      expect(readDoc("announcements", "a1")).toMatchObject({ active: false })
    );
  });

  it("removes a notice permanently", async () => {
    seedAnnouncement("a1");

    const { user } = renderWithProviders(<AnnouncementManager />);
    asAdmin();

    await user.click(await screen.findByRole("button", { name: /^Delete/ }));

    await waitFor(() => expect(readDoc("announcements", "a1")).toBeUndefined());
  });

  it("says so when nothing has been published", async () => {
    renderWithProviders(<AnnouncementManager />);
    asAdmin();

    expect(
      await screen.findByText(/Nothing has been published yet/)
    ).toBeInTheDocument();
  });
});
