/**
 * Interface copy, in the two languages this corridor is used in.
 *
 * WHAT IS TRANSLATED AND WHAT IS NOT, because the distinction is the whole
 * design and getting it wrong is the failure mode.
 *
 * Translated: the interface. Buttons, navigation, headings, the words that
 * describe a state. Those are ours to write.
 *
 * NOT translated: stop names, route names and headlines, fares, and every
 * fact quoted from the operator. `Ekatm Path` and `DKS Bhawan` have official
 * Devanagari forms that only the operator can supply, and machine
 * transliteration produces strings that look plausible and read as WRONG to
 * somebody who lives there. Rendering published names in their published form
 * in both locales is normal practice and is honest; inventing them is not.
 * See ARCHITECTURE-2.0 SS10.
 *
 * NO LIBRARY. A typed record and a hook cover this stage at zero bundle cost,
 * and the initial payload is already measured against a budget. `react-i18next`
 * is worth reaching for when pluralisation starts to bite - Hindi has two
 * plural forms - which is a later stage than this one.
 *
 * THE HINDI HERE HAS NOT BEEN REVIEWED BY A NATIVE SPEAKER. It uses the plain
 * civic register Indian transit signage uses, and it should be read by
 * somebody from Raipur before this is put in front of passengers. That is
 * recorded as a founder action rather than assumed away.
 */

export const LOCALES = ["en", "hi"] as const;

export type Locale = (typeof LOCALES)[number];

/** What each language calls itself, which is what a switcher must show. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
};

/*
  English is the source. Every key a component uses is declared here first,
  and the Hindi record below is typed against it - so a missing translation is
  a compile error rather than a screen that silently falls back.
*/
const en = {
  "nav.home": "Home",
  "nav.plan": "Plan Journey",
  "nav.routes": "Routes",
  "nav.nearby": "Nearby",
  "nav.nearbyPlaces": "Nearby Places",
  "nav.map": "Live Map",
  "nav.timetable": "Timetable",
  "nav.fares": "Fares",
  "nav.contact": "Contact",
  "nav.help": "Help",
  "nav.search": "Search",
  "nav.about": "About",
  "nav.dashboard": "Dashboard",
  "nav.login": "Login",
  "nav.logout": "Log out",
  "nav.menu": "Menu",
  "nav.openMenu": "Open menu",
  "nav.closeMenu": "Close menu",
  "nav.primary": "Primary",

  "footer.location": "Location",
  "footer.explore": "Explore",
  "footer.rights": "© BRT Bus Services. All Rights Reserved.",

  "language.label": "Language",
  "language.change": "Change language",

  "state.loading": "Loading…",
  "state.retry": "Try again",
  "state.none": "Nothing to show yet.",
  "state.offline": "You appear to be offline.",

  "action.search": "Search",
  "action.cancel": "Cancel",
  "action.close": "Close",
  "action.back": "Back",

  "skip.toContent": "Skip to main content",
} as const;

export type TranslationKey = keyof typeof en;

/*
  Typed against the English keys, so adding a string without translating it
  does not compile. That is deliberate: a half-translated screen is worse than
  an untranslated one, and a type error is the only reminder that arrives
  before a passenger sees it.
*/
const hi: Record<TranslationKey, string> = {
  "nav.home": "होम",
  "nav.plan": "यात्रा योजना",
  "nav.routes": "मार्ग",
  "nav.nearby": "आसपास",
  "nav.nearbyPlaces": "आसपास की जगहें",
  "nav.map": "लाइव मैप",
  "nav.timetable": "समय सारणी",
  "nav.fares": "किराया",
  "nav.contact": "संपर्क",
  "nav.help": "सहायता",
  "nav.search": "खोज",
  "nav.about": "परिचय",
  "nav.dashboard": "डैशबोर्ड",
  /*
    One word, not two. "लॉग इन" wraps inside the fixed-width login button and
    spills out of the header - a break that only appears once it is rendered,
    which is why the header was measured in a browser rather than trusted to
    jsdom. "लॉगिन" is the ordinary spelling anyway.
  */
  "nav.login": "लॉगिन",
  "nav.logout": "लॉगआउट",
  "nav.menu": "मेन्यू",
  "nav.openMenu": "मेन्यू खोलें",
  "nav.closeMenu": "मेन्यू बंद करें",
  "nav.primary": "मुख्य",

  "footer.location": "स्थान",
  "footer.explore": "और देखें",
  "footer.rights": "© BRT Bus Services. सर्वाधिकार सुरक्षित।",

  "language.label": "भाषा",
  "language.change": "भाषा बदलें",

  "state.loading": "लोड हो रहा है…",
  "state.retry": "फिर कोशिश करें",
  "state.none": "अभी दिखाने के लिए कुछ नहीं है।",
  "state.offline": "आप ऑफ़लाइन लग रहे हैं।",

  "action.search": "खोजें",
  "action.cancel": "रद्द करें",
  "action.close": "बंद करें",
  "action.back": "वापस",

  "skip.toContent": "मुख्य सामग्री पर जाएँ",
};

export const STRINGS: Record<Locale, Record<TranslationKey, string>> = {
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

/** Looks up a string, falling back to English rather than showing a key. */
export const translate = (locale: Locale, key: TranslationKey): string =>
  STRINGS[locale]?.[key] ?? STRINGS.en[key];
