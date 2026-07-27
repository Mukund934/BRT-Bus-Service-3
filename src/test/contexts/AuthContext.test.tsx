import { describe, expect, it, vi } from "vitest";
import { useAuth } from "@/contexts/AuthContext";
import { renderWithProviders, screen } from "../helpers/render";
import { makeUser, queueAuthError, signInAs } from "../helpers/firebase";
import { setMockRole } from "../helpers/userService";

vi.mock("@/services/userService", async () => {
  const helper = await import("../helpers/userService");
  return helper.userServiceMock();
});

const SessionProbe = () => {
  const { user, role, logout, refreshUserRecord } = useAuth();

  return (
    <div>
      <p>{user ? `signed in as ${role ?? "no role"}` : "signed out"}</p>

      <button type="button" onClick={() => void logout()}>
        Sign out
      </button>

      <button type="button" onClick={() => void refreshUserRecord()}>
        Refresh
      </button>
    </div>
  );
};

describe("republishing a changed role", () => {
  it("takes effect without a reload", async () => {
    setMockRole("user");

    const { user } = renderWithProviders(<SessionProbe />);
    signInAs(makeUser());

    expect(await screen.findByText("signed in as user")).toBeInTheDocument();

    setMockRole("admin");
    await user.click(screen.getByRole("button", { name: /refresh/i }));

    expect(await screen.findByText("signed in as admin")).toBeInTheDocument();
  });

  it("is ignored when nobody is signed in", async () => {
    setMockRole("user");

    const { user } = renderWithProviders(<SessionProbe />);

    expect(await screen.findByText("signed out")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /refresh/i }));

    expect(screen.getByText("signed out")).toBeInTheDocument();
  });
});

describe("signing out", () => {
  it("ends the session", async () => {
    setMockRole("user");

    const { user } = renderWithProviders(<SessionProbe />);
    signInAs(makeUser());

    await screen.findByText("signed in as user");

    await user.click(screen.getByRole("button", { name: /sign out/i }));

    expect(await screen.findByText("signed out")).toBeInTheDocument();
  });

  it("clears the local session even when the network sign-out fails", async () => {
    setMockRole("user");

    const { user } = renderWithProviders(<SessionProbe />);
    signInAs(makeUser());

    await screen.findByText("signed in as user");

    queueAuthError("auth/network-request-failed");
    await user.click(screen.getByRole("button", { name: /sign out/i }));

    expect(await screen.findByText("signed out")).toBeInTheDocument();
  });
});
