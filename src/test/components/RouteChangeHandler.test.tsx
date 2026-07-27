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
