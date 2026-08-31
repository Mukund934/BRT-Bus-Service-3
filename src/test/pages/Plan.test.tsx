import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes, useLocation } from "react-router-dom";
import Plan from "@/pages/Plan";
import { renderWithProviders, screen } from "../helpers/render";

vi.mock("@/services/userService", async () => {
  const helper = await import("../helpers/userService");
  return helper.userServiceMock();
});

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 6, 20, 5, 0, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

const LATE_EVENING = "/plan?from=HNLU&to=CBD&date=2026-07-20&time=21:00";

const SignInTarget = () => {
  const { state } = useLocation();
  const from = (state as { from?: { pathname: string; search: string } } | null)?.from;

  return <p>came from {from ? `${from.pathname}${from.search}` : "nowhere"}</p>;
};

describe("pricing a journey", () => {
  it("lists a departure with its arrival, duration and route", async () => {
    renderWithProviders(<Plan />, { route: LATE_EVENING });

    expect(
      await screen.findByRole("heading", { name: "1 departure" })
    ).toBeInTheDocument();

    const main = screen.getByRole("main");
    expect(main).toHaveTextContent("9:25 PM");
    expect(main).toHaveTextContent("9:46 PM");
    expect(main).toHaveTextContent("21 min · Route 101");
    expect(main).toHaveTextContent("₹10/-");
  });

  it("names the interchanges the journey passes through", async () => {
    renderWithProviders(<Plan />, { route: LATE_EVENING });

    expect(
      await screen.findByText(
        "Connects with other routes at Sector 30, Sector 27, South Block, North Block"
      )
    ).toBeInTheDocument();
  });

  it("leaves out departures earlier than the requested time", async () => {
    renderWithProviders(<Plan />, { route: LATE_EVENING });

    await screen.findByRole("heading", { name: "1 departure" });

    expect(screen.getByRole("main")).not.toHaveTextContent("6:25 AM");
  });

  it("refuses a journey that starts and ends at the same stop", async () => {
    renderWithProviders(<Plan />, {
      route: "/plan?from=HNLU&to=HNLU&date=2026-07-20&time=00:00",
    });

    expect(
      await screen.findByText("Choose two different stops.")
    ).toBeInTheDocument();
  });

  it("names the stop that has no departures rather than blaming the direction", async () => {
    renderWithProviders(<Plan />, {
      route: "/plan?from=HNLU&to=Tribal%20Museum&date=2026-07-20&time=00:00",
    });

    expect(
      await screen.findByText(/Tribal Museum is on the published network/)
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).not.toHaveTextContent(
      "The timetable currently runs from HNLU"
    );
  });

  /*
    This test used to assert the opposite - that the page explains "the
    timetable currently runs from HNLU towards Raipur Railway Station only".
    That sentence stopped being true when the inbound working landed, and the
    assertion then protected the defect instead of catching it: CBD to HNLU is
    a published return journey on routes 201-205. The claim is gone and the
    journey is found.
  */
  it("plans a return journey, which the published timetable does run", async () => {
    renderWithProviders(<Plan />, {
      route: "/plan?from=CBD&to=HNLU&date=2026-07-20&time=00:00",
    });

    expect(
      await screen.findByRole("heading", { name: /departures?$/ })
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).not.toHaveTextContent(
      "No scheduled service for this journey"
    );
  });

  it("asks for a firmer choice when what was typed matches several stops", async () => {
    renderWithProviders(<Plan />, {
      route: "/plan?from=Sector&to=CBD&date=2026-07-20&time=00:00",
    });

    expect(
      await screen.findByText(/Pick both stops from the suggestions/)
    ).toBeInTheDocument();
  });
});

describe("booking from the planner", () => {
  it("sends a signed-out passenger to sign in, remembering the journey they priced", async () => {
    const { user } = renderWithProviders(
      <Routes>
        <Route path="/plan" element={<Plan />} />
        <Route path="/login" element={<SignInTarget />} />
      </Routes>,
      { route: LATE_EVENING }
    );

    await user.click(await screen.findByRole("button", { name: /book ticket/i }));

    expect(
      await screen.findByText(`came from ${LATE_EVENING}`)
    ).toBeInTheDocument();
  });
});
