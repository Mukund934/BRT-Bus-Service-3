/**
 * The interface copy, and the line it must not cross.
 *
 * The dictionary itself is type-checked - a missing Hindi string will not
 * compile - so these cover what types cannot: that the two languages actually
 * say different things, that a bad stored value cannot render keys at a
 * passenger, and above all that no published transit name has been quietly
 * translated.
 */

import { describe, expect, it } from "vitest";
import {
  isLocale,
  LOCALES,
  LOCALE_NAMES,
  preferredLocale,
  STRINGS,
  translate,
} from "@/domain/i18n/strings";
import { STOPS } from "@/domain/transit/stops";
import { ROUTE_IDS, getRoute } from "@/domain/transit/routes";

describe("the two languages", () => {
  it("ships both, and no more than it can maintain", () => {
    expect([...LOCALES]).toEqual(["en", "hi"]);
  });

  it("covers every key in both", () => {
    expect(Object.keys(STRINGS.hi).sort()).toEqual(
      Object.keys(STRINGS.en).sort()
    );
  });

  /*
    A key copied across untranslated is the failure a type cannot catch: it
    compiles, it renders, and it is English on a Hindi screen. Punctuation and
    the brand name are legitimately shared, so only alphabetic copy counts.
  */
  it("does not leave English copy sitting in the Hindi record", () => {
    const untranslated = (Object.keys(STRINGS.en) as (keyof typeof STRINGS.en)[])
      .filter((key) => STRINGS.en[key] === STRINGS.hi[key])
      .filter((key) => /[a-z]{4,}/i.test(STRINGS.en[key]));

    expect(untranslated).toEqual([]);
  });

  /*
    Somebody looking for Hindi scans for "हिन्दी", not for the word "Hindi"
    written in an alphabet they came here to avoid.
  */
  it("names each language in itself", () => {
    expect(LOCALE_NAMES.en).toBe("English");
    expect(LOCALE_NAMES.hi).toMatch(/[ऀ-ॿ]/);
  });

  it("writes the Hindi in Devanagari", () => {
    const devanagari = Object.values(STRINGS.hi).filter((value) =>
      /[ऀ-ॿ]/.test(value)
    );

    expect(devanagari.length).toBeGreaterThan(Object.keys(STRINGS.hi).length / 2);
  });
});

/*
  THE RULE THIS FILE EXISTS FOR.

  Stop names, route names and headlines are published by the operator. Their
  official Devanagari forms are the operator's to supply, and machine
  transliteration produces strings that look plausible and read as wrong to
  somebody who lives on the corridor. Until they are supplied, published names
  render in their published form in both languages - which is normal practice,
  and honest.
*/
describe("what must never be translated", () => {
  it("holds no stop name in the dictionary, in either language", () => {
    const copy = [
      ...Object.values(STRINGS.en),
      ...Object.values(STRINGS.hi),
    ].join(" ");

    for (const stop of STOPS) {
      expect(copy, `${stop} appears in interface copy`).not.toContain(stop);
    }
  });

  it("holds no route name or headline", () => {
    const copy = [
      ...Object.values(STRINGS.en),
      ...Object.values(STRINGS.hi),
    ].join(" ");

    for (const id of ROUTE_IDS) {
      const route = getRoute(id);

      expect(copy).not.toContain(route.headline);
      expect(copy).not.toContain(route.name);
    }
  });
});

describe("choosing a language", () => {
  it("recognises the locales it ships", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("hi")).toBe(true);
  });

  /*
    The storage boundary. A value read back from a device is not trusted -
    without this, a tampered or stale entry would render translation keys at a
    passenger rather than words.
  */
  it("refuses anything else", () => {
    expect(isLocale("mr")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(["hi"])).toBe(false);
  });

  it("takes Hindi from a browser that asks for it", () => {
    expect(preferredLocale(["hi-IN", "en-GB"])).toBe("hi");
  });

  /*
    Matched on the language subtag. `hi-IN` and `hi` are the same request, and
    a phone set to Indian English is asking for English.
  */
  it("reads a regional tag as its language", () => {
    expect(preferredLocale(["hi"])).toBe("hi");
    expect(preferredLocale(["en-IN"])).toBe("en");
  });

  it("takes the first language it can actually serve", () => {
    expect(preferredLocale(["ta-IN", "mr", "hi-IN"])).toBe("hi");
  });

  it("falls back rather than failing when it serves none of them", () => {
    expect(preferredLocale(["ta", "bn"])).toBe("en");
    expect(preferredLocale([])).toBe("en");
  });
});

describe("looking a string up", () => {
  it("returns the language asked for", () => {
    expect(translate("hi", "nav.timetable")).toBe(STRINGS.hi["nav.timetable"]);
    expect(translate("en", "nav.timetable")).toBe("Timetable");
  });

  /*
    Falls back to English rather than rendering the key. A passenger seeing
    "nav.timetable" learns nothing; seeing "Timetable" on a Hindi screen at
    least still works.
  */
  it("falls back to English rather than showing a key", () => {
    expect(
      translate("de" as unknown as "hi", "nav.timetable")
    ).toBe("Timetable");
  });
});

/*
  Interpolation, which exists because word order is not a constant.

  "Next from HNLU" is "HNLU से अगली बस": the stop leads in one language and
  trails in the other. A prefix-plus-value approach cannot express that, which
  is why the placeholder lives inside the sentence.
*/
describe("putting a value into a sentence", () => {
  it("substitutes wherever the sentence puts the placeholder", () => {
    expect(translate("en", "timetable.nextFrom", { stop: "HNLU" })).toBe(
      "Next from HNLU"
    );
    expect(translate("hi", "timetable.nextFrom", { stop: "HNLU" })).toContain(
      "HNLU"
    );
  });

  /*
    The stop leads in Hindi and trails in English. If both put it in the same
    place, the Hindi is a transliterated English sentence rather than a Hindi
    one.
  */
  it("does not assume the value sits in the same place in both", () => {
    const english = translate("en", "timetable.nextFrom", { stop: "CBD" });
    const hindi = translate("hi", "timetable.nextFrom", { stop: "CBD" });

    expect(english.indexOf("CBD")).toBeGreaterThan(0);
    expect(hindi.indexOf("CBD")).toBe(0);
  });

  it("substitutes every placeholder in a sentence with several", () => {
    const shown = translate("en", "timetable.showing", {
      shown: "Weekend service",
      today: "Weekday service",
    });

    expect(shown).toContain("Weekend service");
    expect(shown).toContain("Weekday service");
    expect(shown).not.toContain("{");
  });

  /*
    A missing value is left visible. "Next from {stop}" is a bug somebody
    reports; "Next from " is a bug that ships.
  */
  it("leaves an unfilled placeholder visible rather than blank", () => {
    expect(translate("en", "timetable.nextFrom", {})).toBe("Next from {stop}");
  });

  it("leaves a plain string alone when given no values", () => {
    expect(translate("en", "timetable.finished")).toBe(
      "Service has finished for today"
    );
  });

  /*
    Every placeholder an English string declares must exist in the Hindi one,
    or a translated sentence silently drops the value it was written around.
  */
  it("declares the same placeholders in both languages", () => {
    const names = (value: string) =>
      [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

    for (const key of Object.keys(STRINGS.en) as (keyof typeof STRINGS.en)[]) {
      expect(names(STRINGS.hi[key]), `${key} placeholders differ`).toEqual(
        names(STRINGS.en[key])
      );
    }
  });
});
