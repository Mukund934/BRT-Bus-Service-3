/**
 * Route-level access control.
 *
 * These guards decide what renders, not what the database permits - the
 * Firestore rules are the real boundary. What is worth testing here is that
 * they never leak privileged UI: not to a signed-out visitor, not to a
 * signed-in user without the capability, and crucially not during the window
 * where the session is still resolving and the role is not yet known.
 */

import { describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";
import {
  RedirectIfAuthenticated,
  RequireAuth,
  RequirePermission,
} from "@/components/routing/RouteGuards";
import { PERMISSIONS } from "@/domain/auth/permissions";
import { renderWithProviders, screen, waitFor } from "../helpers/render";
import { makeUser, signInAs } from "../helpers/firebase";
import { setMockRole } from "../helpers/userService";

vi.mock("@/services/userService", async () => {
  const helper = await import("../helpers/userService");
  return helper.userServiceMock();
});

const SECRET = "driver control panel";

const withRoutes = (guarded: React.ReactNode) => (
  <Routes>
    <Route path="/login" element={<p>sign in page</p>} />
    <Route path="/dashboard" element={<p>dashboard page</p>} />
    <Route path="/protected" element={guarded} />
  </Routes>
);

describe("requiring a signed-in user", () => {
  it("sends a signed-out visitor to sign in", async () => {
    renderWithProviders(withRoutes(<RequireAuth><p>{SECRET}</p></RequireAuth>), {
      route: "/protected",
    });

    expect(await screen.findByText("sign in page")).toBeInTheDocument();
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument();
  });

  it("lets a signed-in user through", async () => {
    renderWithProviders(withRoutes(<RequireAuth><p>{SECRET}</p></RequireAuth>), {
      route: "/protected",
    });

    signInAs(makeUser());

    expect(await screen.findByText(SECRET)).toBeInTheDocument();
  });

  it("never renders the page for a visitor who is not signed in", async () => {
    /*
      The guard shows a loading state first, then redirects. What matters is
      that the protected content is absent throughout, so it is asserted
      before and after the session resolves rather than by catching the
      intermediate frame.
    */
    renderWithProviders(withRoutes(<RequireAuth><p>{SECRET}</p></RequireAuth>), {
      route: "/protected",
    });

    expect(screen.queryByText(SECRET)).not.toBeInTheDocument();

    await screen.findByText("sign in page");

    expect(screen.queryByText(SECRET)).not.toBeInTheDocument();
  });
});

describe("requiring a capability", () => {
  const guarded = (
    <RequirePermission permission={PERMISSIONS.PUBLISH_LOCATION}>
      <p>{SECRET}</p>
    </RequirePermission>
  );

  it("sends a signed-out visitor to sign in", async () => {
    renderWithProviders(withRoutes(guarded), { route: "/protected" });

    expect(await screen.findByText("sign in page")).toBeInTheDocument();
  });

  it("refuses a passenger without revealing what the page contains", async () => {
    setMockRole("user");
    renderWithProviders(withRoutes(guarded), { route: "/protected" });

    signInAs(makeUser());

    expect(
      await screen.findByRole("heading", { name: /access denied/i })
    ).toBeInTheDocument();
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument();
  });

  it("admits a driver, who holds the capability", async () => {
    setMockRole("driver");
    renderWithProviders(withRoutes(guarded), { route: "/protected" });

    signInAs(makeUser());

    expect(await screen.findByText(SECRET)).toBeInTheDocument();
  });

  it("refuses an admin, who does not hold this particular capability", async () => {
    // Guards check capabilities, not seniority.
    setMockRole("admin");
    renderWithProviders(withRoutes(guarded), { route: "/protected" });

    signInAs(makeUser());

    expect(
      await screen.findByRole("heading", { name: /access denied/i })
    ).toBeInTheDocument();
  });

  it("never flashes the page before the role is known", async () => {
    setMockRole("user");
    renderWithProviders(withRoutes(guarded), { route: "/protected" });

    // The window between "signed in" and "role resolved" is exactly where a
    // naive guard leaks privileged UI for a frame.
    signInAs(makeUser());
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /access denied/i })).toBeInTheDocument()
    );
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument();
  });
});

describe("keeping a signed-in user off the sign-in page", () => {
  it("lets a visitor see it", async () => {
    renderWithProviders(
      withRoutes(<RedirectIfAuthenticated><p>{SECRET}</p></RedirectIfAuthenticated>),
      { route: "/protected" }
    );

    expect(await screen.findByText(SECRET)).toBeInTheDocument();
  });

  it("redirects someone already signed in to their dashboard", async () => {
    renderWithProviders(
      withRoutes(<RedirectIfAuthenticated><p>{SECRET}</p></RedirectIfAuthenticated>),
      { route: "/protected" }
    );

    signInAs(makeUser());

    expect(await screen.findByText("dashboard page")).toBeInTheDocument();
  });
});
