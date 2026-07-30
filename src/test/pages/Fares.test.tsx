import { describe, expect, it, vi } from "vitest";
import Fares from "@/pages/Fares";
import { renderWithProviders, screen, within } from "../helpers/render";

vi.mock("@/services/userService", async () => {
  const helper = await import("../helpers/userService");
  return helper.userServiceMock();
});

describe("checking a fare between two stops", () => {
  it("prices the journey from the official chart", async () => {
    const { user } = renderWithProviders(<Fares />, { route: "/fares" });

    await user.type(screen.getByLabelText("From"), "HNLU");
    await user.type(screen.getByLabelText("To"), "Balco Medical Center");

    expect(await screen.findByText("₹5/-")).toBeInTheDocument();
  });

  it("refuses a journey that starts and ends at the same stop", async () => {
    const { user } = renderWithProviders(<Fares />, { route: "/fares" });

    await user.type(screen.getByLabelText("From"), "CBD");
    await user.type(screen.getByLabelText("To"), "CBD");

    expect(
      await screen.findByText("Choose two different stops.")
    ).toBeInTheDocument();
  });

  it("groups every fare from the chosen origin", async () => {
    const { user } = renderWithProviders(<Fares />, { route: "/fares" });

    await user.type(screen.getByLabelText("From"), "HNLU");

    expect(
      await screen.findByRole("heading", { name: "All fares from HNLU" })
    ).toBeInTheDocument();
  });
});

describe("popular journeys", () => {
  it("publishes a fare for every one of them", () => {
    renderWithProviders(<Fares />, { route: "/fares" });

    const popular = screen.getByRole("region", { name: "Popular journeys" });

    for (const journey of within(popular).getAllByRole("button")) {
      expect(journey).toHaveTextContent(/₹\d+\/-/);
    }
  });

  it("fills both stops when one is chosen", async () => {
    const { user } = renderWithProviders(<Fares />, { route: "/fares" });

    const popular = screen.getByRole("region", { name: "Popular journeys" });

    await user.click(
      within(popular).getByRole("button", { name: /Sector 30.*CBD/ })
    );

    expect(screen.getByLabelText("From")).toHaveValue("Sector 30");
    expect(screen.getByLabelText("To")).toHaveValue("CBD");

    expect(
      await screen.findByRole("link", { name: /find departures and book/i })
    ).toBeInTheDocument();
  });
});
