import { describe, expect, it, vi } from "vitest";
import NearbyPlaces from "@/pages/NearbyPlaces";
import { renderWithProviders, screen, within } from "../helpers/render";

vi.mock("@/services/userService", async () => {
  const helper = await import("../helpers/userService");
  return helper.userServiceMock();
});

const cardFor = (name: string): HTMLElement =>
  screen.getByText(name).closest("div.brt-card")!;

describe("linking a place to the rest of the site", () => {
  it("plans a journey to the nearest stop", async () => {
    renderWithProviders(<NearbyPlaces />, { route: "/nearby" });

    const card = cardFor("Miraj Cinema");

    expect(
      within(card).getByRole("link", { name: /plan journey/i })
    ).toHaveAttribute("href", "/plan?to=CBD");
  });

  it("escapes a stop name that contains spaces", () => {
    renderWithProviders(<NearbyPlaces />, { route: "/nearby" });

    const card = cardFor("Rawatpura Sarkar University");

    expect(
      within(card).getByRole("link", { name: /plan journey/i })
    ).toHaveAttribute("href", "/plan?to=Rawatpura%20Sarkar%20University");
  });

  it("opens the route that serves the stop", () => {
    renderWithProviders(<NearbyPlaces />, { route: "/nearby" });

    expect(
      within(cardFor("Jungle Safari")).getByRole("link", { name: "Route" })
    ).toHaveAttribute("href", "/routes?route=feeder-ext-1");

    expect(
      within(cardFor("Miraj Cinema")).getByRole("link", { name: "Route" })
    ).toHaveAttribute("href", "/routes?route=trunk");
  });

  it("marks only the places the operator lists itself", () => {
    renderWithProviders(<NearbyPlaces />, { route: "/nearby" });

    expect(
      within(cardFor("Sadbhawna Hospital")).getByText("Official listing")
    ).toBeInTheDocument();

    expect(
      within(cardFor("Jungle Safari")).queryByText("Official listing")
    ).not.toBeInTheDocument();
  });
});

describe("finding a place", () => {
  it("narrows by name", async () => {
    const { user } = renderWithProviders(<NearbyPlaces />, { route: "/nearby" });

    await user.type(screen.getByLabelText("Find a place"), "jungle");

    expect(screen.getByText("Jungle Safari")).toBeInTheDocument();
    expect(screen.queryByText("Miraj Cinema")).not.toBeInTheDocument();
  });

  it("narrows by category", async () => {
    const { user } = renderWithProviders(<NearbyPlaces />, { route: "/nearby" });

    await user.click(screen.getByRole("button", { name: "Hospitals" }));

    expect(screen.getByText("Satya Sai Hospital")).toBeInTheDocument();
    expect(screen.queryByText("Tribal Museum")).not.toBeInTheDocument();
  });

  it("combines a category with a name", async () => {
    const { user } = renderWithProviders(<NearbyPlaces />, { route: "/nearby" });

    await user.click(screen.getByRole("button", { name: "Education" }));
    await user.type(screen.getByLabelText("Find a place"), "hospital");

    expect(screen.getByText("No places match your search")).toBeInTheDocument();
  });

  it("clears both filters at once", async () => {
    const { user } = renderWithProviders(<NearbyPlaces />, { route: "/nearby" });

    await user.click(screen.getByRole("button", { name: "Parks" }));
    await user.type(screen.getByLabelText("Find a place"), "zzz");

    await user.click(screen.getByRole("button", { name: /clear filters/i }));

    expect(screen.getByText("Miraj Cinema")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
});
