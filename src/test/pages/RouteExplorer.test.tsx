import { describe, expect, it, vi } from "vitest";
import RouteExplorer from "@/pages/RouteExplorer";
import { renderWithProviders, screen } from "../helpers/render";

vi.mock("@/services/userService", async () => {
  const helper = await import("../helpers/userService");
  return helper.userServiceMock();
});

describe("browsing the network", () => {
  it("lists the official routes", async () => {
    renderWithProviders(<RouteExplorer />, { route: "/routes" });

    expect(
      await screen.findByRole("button", { name: /Trunk Route \(IIM branch\)/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Feeder Route Ext\. 3/ })
    ).toBeInTheDocument();
  });

  it("counts the stops, interchanges and scheduled departures on a route", async () => {
    renderWithProviders(<RouteExplorer />, { route: "/routes" });

    const route = await screen.findByRole("button", {
      name: /Feeder Route Ext\. 2/,
    });

    expect(route).toHaveTextContent("3 stops · 1 interchange");
    expect(route).toHaveTextContent("1 of 3 stops has scheduled departures");
  });

  it("reports a route whose stops are only partly served by the timetable", async () => {
    renderWithProviders(<RouteExplorer />, { route: "/routes" });

    const route = await screen.findByRole("button", { name: /^trunk Trunk Route/ });

    expect(route).toHaveTextContent("14 of 15 stops have scheduled departures");
  });
});

describe("searching for a route", () => {
  it("finds a route by a stop it serves", async () => {
    const { user } = renderWithProviders(<RouteExplorer />, { route: "/routes" });

    await user.type(screen.getByLabelText("Find a route"), "Stadium");

    expect(
      await screen.findByRole("button", { name: /Feeder Route 1/ })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Trunk Route \(IIM branch\)/ })
    ).not.toBeInTheDocument();
  });

  it("says so when nothing matches", async () => {
    const { user } = renderWithProviders(<RouteExplorer />, { route: "/routes" });

    await user.type(screen.getByLabelText("Find a route"), "zzz");

    expect(await screen.findByText(/No routes match/)).toBeInTheDocument();
  });
});

describe("opening a route from a link", () => {
  it("expands the route named in the address", async () => {
    renderWithProviders(<RouteExplorer />, { route: "/routes?route=feeder-ext-2" });

    expect(
      await screen.findByRole("heading", { name: "Feeder Route Ext. 2" })
    ).toBeInTheDocument();
  });

  it("ignores a route id the network does not publish", async () => {
    renderWithProviders(<RouteExplorer />, { route: "/routes?route=not-a-route" });

    await screen.findByRole("button", { name: /Feeder Route Ext\. 2/ });

    expect(
      screen.queryByRole("link", { name: /plan a journey/i })
    ).not.toBeInTheDocument();
  });

  it("collapses the route when it is chosen a second time", async () => {
    const { user } = renderWithProviders(<RouteExplorer />, {
      route: "/routes?route=feeder-ext-2",
    });

    await screen.findByRole("heading", { name: "Feeder Route Ext. 2" });

    await user.click(
      screen.getByRole("button", { name: /Feeder Route Ext\. 2/ })
    );

    expect(
      screen.queryByRole("heading", { name: "Feeder Route Ext. 2" })
    ).not.toBeInTheDocument();
  });
});
