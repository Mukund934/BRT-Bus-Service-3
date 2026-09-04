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

  /*
    Stage 2: the pitch surface. Home first.

    The rotating headlines are marketing copy and ours to write, so they are
    translated rather than transliterated - a Hindi reader should meet a Hindi
    sentence, not English words in Devanagari letters.
  */
  "home.headline.1": "Experience the Best BRT Service",
  "home.headline.2": "Plan Your Commute with Ease",
  "home.headline.3": "Stay Informed About Routes & Fares",
  "home.headline.4": "Welcome to the Bus Tracker",
  "home.strapline": "Your Journey, Our Priority — Fast, Safe, and Reliable",
  "home.search.label": "Search stops, routes and places",
  "home.search.placeholder": "Search a stop, route or place",

  "home.why": "Why travel with us",
  "home.feature.timetable.title": "Published timetable",
  "home.feature.timetable.body":
    "Departures come from the operator's published timetable, shown for today's service.",
  "home.feature.live.title": "Live when shared",
  "home.feature.live.body":
    "A bus appears on the map while its driver is sharing a position. Nothing is predicted.",
  "home.feature.fares.title": "Official fares",
  "home.feature.fares.body":
    "Prices come from the official BRTS fare chart, never from distance measured on a map.",
  "home.feature.plan.title": "One place to plan",
  "home.feature.plan.body":
    "Two stops gives you the departures, the fare and the journey time together.",

  "home.places.title": "Places to explore",
  "home.places.body":
    "Campuses, hospitals, government offices and attractions across Nava Raipur, each with its nearest BRT stop.",
  "home.places.cta": "Explore nearby places",

  "home.next.title": "Still to come today",
  "home.next.finished": "Today's service has finished.",
  "home.next.checkTimetable": "Check the timetable",
  "home.next.forWhenItStarts": "for when it starts again.",

  "fares.title": "Official fare information",
  "fares.intro":
    "Travel confidently using the official BRTS fare structure. Check the fare between any two stops, or read the full chart.",
  "fares.sameStop": "Choose two different stops.",
  "fares.findDepartures": "Find departures and book",
  "fares.noFare":
    "The official chart does not publish a fare for this journey, so it cannot be booked yet.",
  "fares.popular": "Popular journeys",
  "fares.chart": "Official fare chart",
  "fares.openFullScreen": "Open full screen",
  "fares.cannotDisplay": "Your browser cannot display the fare chart inline.",
  "fares.openNewTab": "Open it in a new tab",
  "fares.notes": "Fare information",
  /*
    Our explanation of how the official chart works, not text quoted from it.
    The organisation names stay as published inside the Hindi sentence, which
    is ordinary practice and avoids inventing a Devanagari form for a body
    that has its own.
  */
  "fares.note.1":
    "Fares follow the official Tatpar BRTS fare chart for Nava Raipur Atal Nagar.",
  "fares.note.2":
    "The price depends on the stop you board at and the stop you alight at, not on distance travelled inside the bus.",
  "fares.note.3": "The same fare applies in both directions between any two stops.",
  "fares.note.4":
    "Where the official chart publishes no fare for a pair, the journey cannot be booked.",

  /*
    Placeholders sit inside the sentence rather than around it. "Next from
    HNLU" is "HNLU से अगली बस" - the stop leads in Hindi and trails in English,
    which no amount of concatenation expresses.

    The route NUMBER is published and is substituted, never translated. Only
    the word describing it is ours.
  */
  "timetable.title": "Bus timetable",
  "timetable.nextFrom": "Next from {stop}",
  "timetable.scheduled": "Scheduled · Route {route}",
  "timetable.then": "Then",
  "timetable.finished": "Service has finished for today",
  "timetable.resumes": "Resumes {weekday} at",
  "timetable.onThe": "on the {service}.",
  "timetable.showing":
    "Showing the {shown}. Booking stays on today's {today}.",

  "service.weekday": "Weekday service",
  "service.weekend": "Weekend service",
  "service.weekday.short": "Weekday",
  "service.weekend.short": "Weekend",
  "timetable.today": " (today)",
  "timetable.towards": "Towards {terminus}",
  "timetable.fromStop": "from {stop} · ",
  "timetable.alsoToday": " · today",
  "timetable.now": "Now {time}",
  "timetable.noneForDirection":
    "No services are published for this direction on the {service}.",

  "plan.title": "Plan your journey",
  "plan.intro":
    "Choose where you are boarding and where you are going. Fares come from the official BRTS fare chart.",
  "plan.browseNearby": "Not sure where to go? Browse nearby places",
  "plan.from": "From",
  "plan.to": "To",
  "plan.date": "Travel date",
  "plan.leavingAfter": "Leaving after",
  "plan.search": "Search journeys",
  "plan.swap": "Swap",
  "plan.sameStop": "Choose two different stops.",
  "plan.unresolved":
    "Pick both stops from the suggestions so we can price the journey.",
  "plan.notPublished": "Not published",
  "plan.noFare":
    "The official fare chart does not price this journey, so it cannot be booked yet.",
  "plan.noService": "No scheduled service for this journey",
  "plan.unservedStop":
    "{stop} is on the published network but has no departures yet. Browse the routes to see which stops the timetable covers.",
  "stopField.placeholder": "Type to search stops",
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

  "home.headline.1": "बेहतरीन BRT सेवा का अनुभव करें",
  "home.headline.2": "अपनी यात्रा आसानी से बनाएँ",
  "home.headline.3": "मार्ग और किराए की जानकारी पाएँ",
  "home.headline.4": "बस ट्रैकर में आपका स्वागत है",
  "home.strapline": "आपकी यात्रा, हमारी प्राथमिकता — तेज़, सुरक्षित और भरोसेमंद",
  "home.search.label": "स्टॉप, मार्ग और जगहें खोजें",
  "home.search.placeholder": "स्टॉप, मार्ग या जगह खोजें",

  "home.why": "हमारे साथ क्यों चलें",
  "home.feature.timetable.title": "प्रकाशित समय सारणी",
  "home.feature.timetable.body":
    "प्रस्थान संचालक की प्रकाशित समय सारणी से आते हैं, और आज की सेवा के लिए दिखाए जाते हैं।",
  "home.feature.live.title": "साझा होने पर लाइव",
  "home.feature.live.body":
    "बस मानचित्र पर तभी दिखती है जब उसका चालक अपनी स्थिति साझा कर रहा हो। कोई अनुमान नहीं लगाया जाता।",
  "home.feature.fares.title": "आधिकारिक किराया",
  "home.feature.fares.body":
    "किराया आधिकारिक BRTS किराया सूची से आता है, मानचित्र पर मापी गई दूरी से कभी नहीं।",
  "home.feature.plan.title": "योजना एक ही जगह",
  "home.feature.plan.body":
    "दो स्टॉप चुनिए और प्रस्थान, किराया तथा यात्रा का समय एक साथ देखिए।",

  "home.places.title": "देखने लायक जगहें",
  "home.places.body":
    "नवा रायपुर के परिसर, अस्पताल, सरकारी कार्यालय और दर्शनीय स्थल — हर एक के पास का BRT स्टॉप साथ में।",
  "home.places.cta": "आसपास की जगहें देखें",

  "home.next.title": "आज अभी बाकी",
  "home.next.finished": "आज की सेवा समाप्त हो चुकी है।",
  "home.next.checkTimetable": "समय सारणी देखें",
  "home.next.forWhenItStarts": "कि यह दोबारा कब शुरू होगी।",

  "fares.title": "आधिकारिक किराया जानकारी",
  "fares.intro":
    "आधिकारिक BRTS किराया संरचना के साथ निश्चिंत होकर यात्रा कीजिए। किन्हीं दो स्टॉप के बीच का किराया देखिए, या पूरी सूची पढ़िए।",
  "fares.sameStop": "दो अलग-अलग स्टॉप चुनिए।",
  "fares.findDepartures": "प्रस्थान देखें और बुक करें",
  "fares.noFare":
    "आधिकारिक सूची में इस यात्रा के लिए कोई किराया प्रकाशित नहीं है, इसलिए इसे अभी बुक नहीं किया जा सकता।",
  "fares.popular": "लोकप्रिय यात्राएँ",
  "fares.chart": "आधिकारिक किराया सूची",
  "fares.openFullScreen": "पूरी स्क्रीन पर खोलें",
  "fares.cannotDisplay": "आपका ब्राउज़र किराया सूची यहीं नहीं दिखा सकता।",
  "fares.openNewTab": "इसे नए टैब में खोलें",
  "fares.notes": "किराए की जानकारी",
  "fares.note.1":
    "किराया Nava Raipur Atal Nagar के लिए आधिकारिक Tatpar BRTS किराया सूची के अनुसार है।",
  "fares.note.2":
    "किराया इस पर निर्भर करता है कि आप किस स्टॉप से चढ़े और किस स्टॉप पर उतरे, बस में तय की गई दूरी पर नहीं।",
  "fares.note.3": "किन्हीं दो स्टॉप के बीच दोनों दिशाओं में एक ही किराया लगता है।",
  "fares.note.4":
    "जिस जोड़ी के लिए आधिकारिक सूची में किराया प्रकाशित नहीं है, वह यात्रा बुक नहीं की जा सकती।",

  "timetable.title": "बस समय सारणी",
  "timetable.nextFrom": "{stop} से अगली बस",
  "timetable.scheduled": "निर्धारित · मार्ग {route}",
  "timetable.then": "फिर",
  "timetable.finished": "आज की सेवा समाप्त हो चुकी है",
  "timetable.resumes": "{weekday} को फिर शुरू —",
  "timetable.onThe": "({service})।",
  "timetable.showing":
    "{shown} दिखाई जा रही है। बुकिंग आज की {today} पर ही रहेगी।",

  "service.weekday": "सप्ताह के दिनों की सेवा",
  "service.weekend": "सप्ताहांत की सेवा",
  "service.weekday.short": "सप्ताह के दिन",
  "service.weekend.short": "सप्ताहांत",
  "timetable.today": " (आज)",
  "timetable.towards": "{terminus} की ओर",
  "timetable.fromStop": "{stop} से · ",
  "timetable.alsoToday": " · आज",
  "timetable.now": "अभी {time}",
  "timetable.noneForDirection":
    "इस दिशा के लिए {service} पर कोई सेवा प्रकाशित नहीं है।",

  "plan.title": "अपनी यात्रा की योजना बनाइए",
  "plan.intro":
    "चुनिए कि आप कहाँ से चढ़ेंगे और कहाँ जाना है। किराया आधिकारिक BRTS किराया सूची से आता है।",
  "plan.browseNearby": "तय नहीं कि कहाँ जाएँ? आसपास की जगहें देखिए",
  "plan.from": "कहाँ से",
  "plan.to": "कहाँ तक",
  "plan.date": "यात्रा की तारीख",
  "plan.leavingAfter": "इसके बाद निकलना है",
  "plan.search": "यात्राएँ खोजें",
  "plan.swap": "अदला-बदली",
  "plan.sameStop": "दो अलग-अलग स्टॉप चुनिए।",
  "plan.unresolved":
    "दोनों स्टॉप सुझावों में से चुनिए, तभी किराया बताया जा सकता है।",
  "plan.notPublished": "प्रकाशित नहीं",
  "plan.noFare":
    "आधिकारिक किराया सूची में इस यात्रा का किराया नहीं है, इसलिए इसे अभी बुक नहीं किया जा सकता।",
  "plan.noService": "इस यात्रा के लिए कोई निर्धारित सेवा नहीं है",
  "plan.unservedStop":
    "{stop} प्रकाशित नेटवर्क में है, पर वहाँ से अभी कोई प्रस्थान नहीं है। समय सारणी किन स्टॉप को कवर करती है, यह देखने के लिए मार्ग देखिए।",
  "stopField.placeholder": "स्टॉप खोजने के लिए लिखिए",
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
