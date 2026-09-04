/**
 * The English interface copy, and the keys every other language is typed
 * against.
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
 * This module is the one catalogue that ships in the entry bundle. It is the
 * fallback every other locale falls back TO, and a fallback that has to be
 * fetched is not a fallback - so English is static and every other language
 * is loaded on demand. See `strings.ts`.
 */

export const en = {
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

/**
 * Every key the interface can ask for.
 *
 * English is the source: a component names a key here first, and each other
 * language is typed against this, so adding a string without translating it
 * does not compile. A half-translated screen is worse than an untranslated
 * one, and a type error is the only reminder that arrives before a passenger
 * sees it.
 */
export type TranslationKey = keyof typeof en;

/** One language's complete copy. */
export type Catalogue = Readonly<Record<TranslationKey, string>>;
