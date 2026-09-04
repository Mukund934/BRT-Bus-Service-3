/**
 * Screens that are supposed to be translated, checked against their source.
 *
 * The dictionary tests cannot see this. A key added in English and forgotten
 * in Hindi is a compile error, and a Hindi value left as English fails a test
 * - but a sentence typed straight into JSX never reaches the dictionary at
 * all, so every one of those guards passes while the screen ships English.
 *
 * That is not hypothetical. Sweeping the rendered strings after the
 * component-by-component pass turned up three surfaces still holding English:
 * the error boundary, the arrival popup, and a booking refusal hardcoded in
 * two pages that already existed as a key. This is that sweep, kept.
 *
 * It reads source rather than rendering, deliberately. A rendering test only
 * covers the states it happens to reach - an error branch nobody triggers
 * keeps its English - and these files are full of branches.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/*
  The surfaces translated through stage 3. A file joins this list when it is
  translated, and the list is the record of what has been done - so adding a
  screen here before wiring it fails immediately, which is the point.
*/
const SURFACES = [
  "src/pages/Login.tsx",
  "src/pages/Timetable.tsx",
  "src/pages/Driver.tsx",
  "src/components/BookingModal.tsx",
  "src/components/PaymentModal.tsx",
  "src/components/VirtualTicket.tsx",
  "src/components/StopField.tsx",
  "src/components/routing/RouteGuards.tsx",
  "src/components/a11y/RouteChangeHandler.tsx",
  "src/components/ErrorBoundary.tsx",
  "src/components/NotificationPopup.tsx",
  "src/components/dashboards/UserDashboard.tsx",
  "src/components/dashboards/DriverDashboard.tsx",
];

/*
  English that is allowed to stay, each with the reason it is not ours to
  translate. A name is not copy.
*/
const PUBLISHED: Record<string, string[]> = {
  /* The operator's name, printed on the ticket as they publish it. */
  "src/components/VirtualTicket.tsx": ["BRT Bus Service"],
};

/** Attributes whose value a person reads or hears. */
const SPOKEN = /(?:aria-label|alt|title|placeholder)="([^"]{4,})"/g;

/*
  A JSX line that is prose: no code punctuation anywhere on it, starting with
  a capital and carrying at least two words.

  The first attempt required the WHOLE line to be words separated by single
  spaces, which quietly excluded every sentence containing a full stop -
  "This bus has already departed. Please choose a later service." went
  straight through it. That was found by putting the string back and watching
  the guard pass, which is the only way that class of hole is ever found.
*/
const CODE = /[{}<>=[\];"`]/;

const isProse = (line: string): boolean => {
  if (CODE.test(line)) return false;
  if (!/^[A-Z]/.test(line)) return false;

  return line.split(/\s+/).filter((word) => /^[A-Za-z]{2,}/.test(word)).length >= 2;
};

/*
  Comments come out first. This codebase writes block comments as plain
  indented prose rather than with leading asterisks, which is exactly the
  shape being looked for - without this the guard reports its own
  explanations and gets switched off within a day.
*/
const withoutComments = (source: string): string =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");

const englishIn = (file: string): string[] => {
  const source = withoutComments(readFileSync(file, "utf8"));
  const allowed = PUBLISHED[file] ?? [];
  const found: string[] = [];

  for (const match of source.matchAll(SPOKEN)) {
    const value = match[1]!;

    if (/\s/.test(value) && /^[A-Z]/.test(value)) found.push(value);
  }

  for (const raw of source.split("\n")) {
    const line = raw.trim();

    if (isProse(line)) found.push(line);
  }

  return found.filter((value) => !allowed.includes(value));
};

describe("screens that are supposed to be translated", () => {
  it.each(SURFACES)("holds no untranslated copy: %s", (file) => {
    expect(englishIn(file)).toEqual([]);
  });

  /*
    And the check that stops the one above passing for the wrong reason. If a
    path were wrong, `readFileSync` would throw - but if the patterns stopped
    matching anything at all, every file would pass while nothing was
    inspected. This asserts the detector still finds what it is looking for.
  */
  it("detects copy when there is copy to detect", () => {
    const sample = [
      `  This bus has already departed. Please choose a later service.`,
      `  Reload the page`,
      `<button aria-label="Dismiss notification">`,
    ].join("\n");

    const detected: string[] = [];

    for (const match of sample.matchAll(SPOKEN)) detected.push(match[1]!);
    for (const raw of sample.split("\n")) {
      const line = raw.trim();

      if (isProse(line)) detected.push(line);
    }

    expect(detected).toContain("Dismiss notification");
    expect(detected).toContain("Reload the page");
    expect(detected).toContain(
      "This bus has already departed. Please choose a later service."
    );
  });

  it("reads every surface it names", () => {
    for (const file of SURFACES) {
      expect(readFileSync(file, "utf8").length).toBeGreaterThan(500);
    }
  });
});
