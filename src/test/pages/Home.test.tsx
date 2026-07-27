import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "@/pages/Home";
import { act, renderWithProviders, screen } from "../helpers/render";

vi.mock("@/services/userService", async () => {
  const helper = await import("../helpers/userService");
  return helper.userServiceMock();
});

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("the front page", () => {
  it("opens on the first strapline", () => {
    renderWithProviders(<Home />, { route: "/" });

    expect(
      screen.getByRole("heading", { name: "Experience the Best BRT Service" })
    ).toBeInTheDocument();
  });

  it("moves to the next strapline on its own", async () => {
    renderWithProviders(<Home />, { route: "/" });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(
      screen.getByRole("heading", { name: "Plan Your Commute with Ease" })
    ).toBeInTheDocument();
  });

  it("describes what the service offers", () => {
    renderWithProviders(<Home />, { route: "/" });

    expect(
      screen.getByRole("heading", { name: "Real-Time Updates" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Route Planning" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Safe & Reliable" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Fast Service" })
    ).toBeInTheDocument();
  });

  it("sends a visitor on to the places they can reach", () => {
    renderWithProviders(<Home />, { route: "/" });

    expect(
      screen.getByRole("link", { name: /explore nearby places/i })
    ).toHaveAttribute("href", "/nearby");
  });
});

describe("the featured departures", () => {
  it("names them from the real timetable", () => {
    renderWithProviders(<Home />, { route: "/" });

    expect(
      screen.getByRole("heading", { name: "BUS 1 - 6:25 AM Departure" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "BUS 5 - 8:40 AM Departure" })
    ).toBeInTheDocument();
  });

  it("shortens a long corridor rather than listing every stop", () => {
    renderWithProviders(<Home />, { route: "/" });

    expect(
      screen.getAllByText(
        "HNLU, Balco Medical Center, Sector 30, Sector 29, … Raipur Railway Station"
      ).length
    ).toBeGreaterThan(0);
  });
});

describe("the hero image", () => {
  it("describes itself and reserves its space", () => {
    renderWithProviders(<Home />, { route: "/" });

    const hero = screen.getByAltText(
      "A BRT bus on the Raipur to Naya Raipur corridor"
    );

    expect(hero).toHaveAttribute("width", "1080");
    expect(hero).toHaveAttribute("height", "572");
  });
});
