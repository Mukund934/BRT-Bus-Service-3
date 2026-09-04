/**
 * Which languages this corridor is served in, and how a string is looked up.
 *
 * The copy itself lives one module per language - `en.ts` is the source every
 * other is typed against, and each other language is its own file. What is
 * translated and what is deliberately not is written down in `en.ts`, because
 * that distinction is the whole design and getting it wrong is the failure
 * mode.
 *
 * NO LIBRARY. A typed record and a hook cover this stage at zero bundle cost,
 * and the initial payload is already measured against a budget.
 * `react-i18next` is worth reaching for when pluralisation starts to bite -
 * Hindi has two plural forms - which is a later stage than this one.
 */

import { en, type Catalogue, type TranslationKey } from "./en";
import { hi } from "./hi";

export type { Catalogue, TranslationKey } from "./en";

export const LOCALES = ["en", "hi"] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * The BCP 47 tag each locale formats dates with.
 *
 * Separate from the locale itself because `Intl` needs a region to choose
 * conventions, and because only DISPLAY formatting may follow the interface
 * language - the formatters in `calendar.ts` whose output is used as a key
 * stay pinned to English regardless of what a passenger has chosen.
 */
export const DATE_LOCALES: Record<Locale, string> = {
  en: "en-GB",
  hi: "hi-IN",
};

/** What each language calls itself, which is what a switcher must show. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
};

export const STRINGS: Record<Locale, Catalogue> = {
  en,
  hi,
};

/**
 * Whether a value is a locale this app ships.
 *
 * Used at the storage boundary: a value read back from a device is not
 * trusted, and an unknown one falls back rather than rendering keys.
 */
export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (LOCALES as readonly string[]).includes(value);

/**
 * The best locale for a browser's stated preferences.
 *
 * Matches on the language subtag only: `hi-IN` and `hi` are the same request,
 * and a device set to Indian English should get English rather than Hindi.
 */
export const preferredLocale = (
  languages: readonly string[],
  fallback: Locale = "en"
): Locale => {
  for (const tag of languages) {
    const base = tag.toLowerCase().split("-")[0];

    if (isLocale(base)) return base;
  }

  return fallback;
};

/**
 * Looks up a string, falling back to English rather than showing a key.
 *
 * Values are substituted INSIDE the sentence rather than concatenated around
 * it, because word order is not a constant. "Next from HNLU" is
 * "HNLU से अगली" - the stop comes first in Hindi and last in English, so a
 * prefix-plus-value approach produces something a Hindi reader has to
 * mentally reassemble. A placeholder can sit wherever the sentence needs it.
 *
 * An unknown placeholder is left visible rather than replaced with nothing:
 * "Next from {stop}" is a bug somebody notices, and "Next from " is a bug
 * that ships.
 */
export const translate = (
  locale: Locale,
  key: TranslationKey,
  values?: Readonly<Record<string, string | number>>
): string => {
  const template = STRINGS[locale]?.[key] ?? STRINGS.en[key];

  if (!values) return template;

  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name)
      ? String(values[name])
      : placeholder
  );
};
