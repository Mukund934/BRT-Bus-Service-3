import { describe, expect, it, vi } from "vitest";
import { Link } from "react-router-dom";
import { RouteChangeHandler } from "@/components/a11y/RouteChangeHandler";
import { renderWithProviders, screen } from "../helpers/render";

vi.mock("@/services/userService", async () => {
  const helper = await import("../helpers/userService");
  return helper.userServiceMock();
});

describe("arriving on a page", () => {
  it("names the page in the document title", () => {
    renderWithProviders(<RouteChangeHandler />, { route: "/fares" });

    expect(document.title).toBe("Fares · BRT Bus Service");
  });

  it("falls back to a neutral title for a page it does not know", () => {
    renderWithProviders(<RouteChangeHandler />, { route: "/somewhere-else" });

    expect(document.title).toBe("Page · BRT Bus Service");
  });

  it("describes the page for a search result", () => {
    renderWithProviders(<RouteChangeHandler />, { route: "/fares" });

    expect(
      document.head.querySelector('meta[name="description"]')
    ).toHaveAttribute(
      "content",
      "Check the official BRTS fare between any two stops, or read the full published fare chart."
    );
  });

  it("claims one canonical address for the page", () => {
    renderWithProviders(<RouteChangeHandler />, { route: "/routes" });

    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${window.location.origin}/routes`
    );
  });

  it("drops the query string from the canonical address", () => {
    renderWithProviders(<RouteChangeHandler />, {
      route: "/plan?from=HNLU&to=CBD&date=2026-07-31&time=09:00",
    });

    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${window.location.origin}/plan`
    );
  });

  it("carries no description onto a page that has none", () => {
    renderWithProviders(<RouteChangeHandler />, { route: "/fares" });

    expect(
      document.head.querySelector('meta[name="description"]')
    ).toBeInTheDocument();

    renderWithProviders(<RouteChangeHandler />, { route: "/somewhere-else" });

    expect(
      document.head.querySelector('meta[name="description"]')
    ).not.toBeInTheDocument();
  });

  it("returns the viewport to the top without animating", () => {
    renderWithProviders(<RouteChangeHandler />, { route: "/timetable" });

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
  });

  it("tells a screen reader which page loaded", async () => {
    renderWithProviders(<RouteChangeHandler />, { route: "/nearby" });

    expect(
      await screen.findByText("Nearby places page loaded")
    ).toBeInTheDocument();
  });
});

describe("every route the app knows", () => {
  const KNOWN_ROUTES = [
    "/",
    "/plan",
    "/routes",
    "/nearby",
    "/map",
    "/timetable",
    "/fares",
    "/contact",
    "/login",
    "/dashboard",
    "/driver",
  ];

  it.each(KNOWN_ROUTES)("names and describes %s", (route) => {
    renderWithProviders(<RouteChangeHandler />, { route });

    expect(document.title).not.toBe("Page · BRT Bus Service");
    expect(
      document.head.querySelector('meta[name="description"]')
    ).toBeInTheDocument();
  });
});

describe("moving between pages", () => {
  it("announces the new page after following a link", async () => {
    const { user } = renderWithProviders(
      <>
        <RouteChangeHandler />
        <Link to="/routes">Explore the network</Link>
      </>,
      { route: "/" }
    );

    expect(await screen.findByText("Home page loaded")).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Explore the network" }));

    expect(
      await screen.findByText("Route explorer page loaded")
    ).toBeInTheDocument();
    expect(document.title).toBe("Route explorer · BRT Bus Service");
  });
});
