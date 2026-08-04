/**
 * The dashboard router.
 *
 * This page picks a view by capability rather than by role string, so an
 * unresolved or unrecognised role falls through to the least-privileged view
 * instead of matching nothing. It never renders a signed-out state of its own:
 * the route guard redirects before this component is reached, which is what
 * these tests pin down.
 */

import { describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import { RequireAuth } from "@/components/routing/RouteGuards";
import { renderWithProviders, screen } from "../helpers/render";
import { makeUser, signInAs } from "../helpers/firebase";
import { setMockRole } from "../helpers/userService";

vi.mock("@/services/userService", async () => {
  const helper = await import("../helpers/userService");
  return helper.userServiceMock();
});

const guarded = (
  <Routes>
    <Route
      path="/dashboard"
      element={
        <RequireAuth>
          <Dashboard />
        </RequireAuth>
      }
    />
    <Route path="/login" element={<p>sign in page</p>} />
  </Routes>
);

describe("choosing a view by capability", () => {
  it("gives a passenger their tickets", async () => {
    setMockRole("user");

    renderWithProviders(<Dashboard />, { route: "/dashboard" });
    signInAs(makeUser({ uid: "user-1" }), "user");

    expect(await screen.findByText("Ticket History")).toBeInTheDocument();
  });

  it("gives a driver the broadcasting view", async () => {
    setMockRole("driver");

    renderWithProviders(<Dashboard />, { route: "/dashboard" });
    signInAs(makeUser({ uid: "driver-1" }), "driver");

    expect(
      await screen.findByRole("heading", { name: "Share Live Location" })
    ).toBeInTheDocument();
  });

  it("gives an administrator the panel", async () => {
    setMockRole("admin");

    renderWithProviders(<Dashboard />, { route: "/dashboard" });
    signInAs(makeUser({ uid: "admin-1" }), "admin");

    expect(
      await screen.findByRole("heading", { name: "Administrator Panel" })
    ).toBeInTheDocument();
  });
});

describe("reaching the dashboard signed out", () => {
  it("is redirected by the guard rather than shown a page of its own", async () => {
    setMockRole("user");

    renderWithProviders(guarded, { route: "/dashboard" });

    expect(await screen.findByText("sign in page")).toBeInTheDocument();
  });

  it("never renders a sign-in prompt of its own", async () => {
    setMockRole("user");

    renderWithProviders(guarded, { route: "/dashboard" });

    await screen.findByText("sign in page");

    expect(screen.queryByText("Sign in required")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Go to Login" })
    ).not.toBeInTheDocument();
  });
});
