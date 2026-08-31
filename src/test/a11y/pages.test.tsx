/**
 * Every passenger-facing page, audited by axe.
 *
 * This is the difference between "we care about accessibility" and a claim
 * with something behind it. Each page below is rendered and run through
 * axe-core's WCAG 2.1 A and AA rules, so a missing label or a broken heading
 * order fails CI rather than reaching somebody who depends on it.
 *
 * TWO RULES ARE TURNED OFF, AND NEITHER IS A WAIVER.
 *
 * `color-contrast` cannot be evaluated in jsdom: there is no layout, so axe
 * cannot composite a colour against what is actually behind it. It is measured
 * instead, exactly and from the stylesheet, in `design/contrast.test.ts`.
 *
 * `region` (all content inside a landmark) fires because these render a page
 * body without the surrounding document, which is an artefact of rendering a
 * component rather than a defect in the page.
 *
 * Automated rules catch roughly a third to a half of real barriers. Passing
 * here is a floor, not a verdict - the keyboard, focus-visibility, target-size
 * and reflow checks that need a real browser are recorded in ROADMAP-2.0.md.
 */

import { describe, expect, it, vi } from "vitest";
import axe, { type Result } from "axe-core";

import Home from "@/pages/Home";
import Plan from "@/pages/Plan";
import RouteExplorer from "@/pages/RouteExplorer";
import NearbyPlaces from "@/pages/NearbyPlaces";
import Fares from "@/pages/Fares";
import Timetable from "@/pages/Timetable";
import Contact from "@/pages/Contact";
import Help from "@/pages/Help";
import About from "@/pages/About";
import Search from "@/pages/Search";
import NotFound from "@/pages/NotFound";

import { renderWithProviders } from "../helpers/render";

vi.mock("@/services/userService", async () => {
  const helper = await import("../helpers/userService");
  return helper.userServiceMock();
});

const DISABLED = { "color-contrast": { enabled: false }, region: { enabled: false } };

const describeViolation = (violation: Result) =>
  `${violation.id} (${violation.impact}): ${violation.help}\n` +
  violation.nodes
    .slice(0, 3)
    .map((node) => `    ${node.html.slice(0, 120)}`)
    .join("\n");

const auditOf = async (container: HTMLElement): Promise<string[]> => {
  const results = await axe.run(container, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    rules: DISABLED,
  });

  return results.violations.map(describeViolation);
};

const PAGES: [string, () => JSX.Element, string][] = [
  ["Home", () => <Home />, "/"],
  ["Plan", () => <Plan />, "/plan?from=HNLU&to=CBD"],
  ["Route explorer", () => <RouteExplorer />, "/routes"],
  ["Nearby places", () => <NearbyPlaces />, "/nearby"],
  ["Fares", () => <Fares />, "/fares"],
  ["Timetable", () => <Timetable />, "/timetable"],
  ["Contact", () => <Contact />, "/contact"],
  ["Help", () => <Help />, "/help"],
  ["About", () => <About />, "/about"],
  ["Search", () => <Search />, "/search?q=CBD"],
  ["Not found", () => <NotFound />, "/nowhere"],
];

describe("every page a passenger can reach", () => {
  for (const [name, render, route] of PAGES) {
    it(`${name} has no accessibility violations`, async () => {
      const { container } = renderWithProviders(render(), { route });

      const violations = await auditOf(container);

      expect(violations.join("\n"), `${name}:\n${violations.join("\n")}`).toBe("");
    }, 30_000);
  }
});
