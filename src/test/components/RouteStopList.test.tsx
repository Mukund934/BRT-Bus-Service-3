import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RouteStopList from "@/components/RouteStopList";
import { getNetworkRoute } from "@/domain/transit/routes";
import type { StopName } from "@/domain/transit/stops";
import { renderWithProviders } from "@/test/helpers/render";

const feeder = getNetworkRoute("feeder-2");
const scheduled: ReadonlySet<StopName> = new Set<StopName>(["CBD", "South Block"]);

const renderList = () =>
  renderWithProviders(
    <RouteStopList
      routeId={feeder.id}
      stops={feeder.servedStops}
      scheduled={scheduled}
    />
  );

describe("route stop list", () => {
  it("lists every stop on the route in travel order", () => {
    renderList();

    const listed = screen
      .getAllByRole("listitem")
      .map((item) => item.textContent ?? "");

    expect(listed).toHaveLength(feeder.servedStops.length);

    feeder.servedStops.forEach((stop, index) => {
      expect(listed[index]).toContain(stop);
    });
  });

  it("marks only the first and last stop as termini", () => {
    renderList();

    const items = screen.getAllByRole("listitem");

    expect(within(items[0]!).getByText("Start")).toBeInTheDocument();
    expect(within(items[items.length - 1]!).getByText("End")).toBeInTheDocument();
    expect(screen.getAllByText("Start")).toHaveLength(1);
    expect(screen.getAllByText("End")).toHaveLength(1);
  });

  it("names the routes a passenger can change to at an interchange", () => {
    renderList();

    const northBlock = screen
      .getAllByRole("listitem")
      .find((item) => item.textContent?.startsWith("North Block"))!;

    expect(within(northBlock).getByText("Interchange")).toBeInTheDocument();
    expect(northBlock.textContent).toContain("Feeder Route 1");
    expect(northBlock.textContent).toContain("Trunk Route");
  });

  it("flags the stops that have no scheduled departures", () => {
    renderList();

    const items = screen.getAllByRole("listitem");
    const flagged = items.filter((item) =>
      item.textContent?.includes("No departures yet")
    );

    expect(flagged).toHaveLength(feeder.servedStops.length - scheduled.size);

    const cbd = items.find(
      (item) =>
        item.textContent?.startsWith("CBD") &&
        !item.textContent.startsWith("CBD Railway")
    );

    expect(cbd).toBeDefined();
    expect(cbd!.textContent).not.toContain("No departures yet");
  });

  it("only links the stops a journey can start from", () => {
    renderList();

    expect(screen.getByRole("link", { name: /^CBD/ })).toHaveAttribute(
      "href",
      "/plan?from=CBD"
    );
    expect(
      screen.queryByRole("link", { name: /^Sector 22/ })
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(scheduled.size);
  });
});
