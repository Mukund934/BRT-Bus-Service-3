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

  "service.weekdays": "Weekdays",
  "service.weekends": "Weekends",
  "timetable.notToday":
    "This service does not run today, so it cannot be booked. The times are listed for reference.",
  "timetable.departs": "Departs",
  "timetable.next": "Next",
  "timetable.serviceDay": "Service day",
  /*
    The caption keeps the operator's service name and the published direction
    as they are; only the frame around them is ours.
  */
  "timetable.caption": "BRT Service - {direction} ({service})",
  "booking.book": "Book",
  "booking.bookTrip": "route {route} departing {time}",
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

  /*
    Form validation.

    Named by the problem rather than the sentence, because the schema that
    detects the problem should not be choosing the words - it runs in a domain
    that has no idea which language anybody is reading in.
  */

  /*
    Stage 3: the transactional surface, starting where an account does.

    "Continue with Google" keeps the product name in both languages - it names
    a button in somebody else's product, and a translated form of it would be
    a button nobody recognises.
  */

  /*
    Booking. The route NUMBER and the times are published data substituted
    into the sentence, never translated - as are the two stop names in the
    clash warning.
  */
  "booking.title": "Book your ticket",
  "booking.description":
    "Route {route}, departing {time}. Choose where you are boarding and where you are travelling to.",
  "booking.fromStop": "From stop",
  "booking.toStop": "To stop",
  "booking.selectDestination": "Select destination",
  "journey.from": "From",
  "journey.to": "To",
  "journey.departure": "Departure",
  "journey.arrival": "Arrival",
  "booking.fare": "Fare",
  "booking.departed":
    "This bus has already departed. Please choose a later service.",
  "booking.unpriced":
    "No fare is published for this journey yet, so it cannot be booked. Please choose a different destination.",
  "booking.conflict":
    "You already have a ticket from {from} to {to} that overlaps this journey.",
  "booking.proceed": "Proceed to pay",


  /*
    Why a booking was refused, and why a payment failed.

    Keyed off the failure code rather than written at the call site, because
    the same refusal is shown in the payment dialog and listed on /help - and
    those two drifting apart is how a help page starts describing behaviour
    the app no longer has.
  */
  "booking.failure.notAuthenticated": "Please sign in to book a ticket.",
  "booking.failure.alreadyDeparted":
    "This service has already departed. Please choose a later bus.",
  "booking.failure.overlapping":
    "You already hold a ticket for a journey that overlaps this one.",
  "booking.failure.invalidJourney":
    "That journey is not valid. Please reselect your stops.",
  "booking.failure.storageFailed":
    "Your ticket could not be saved. Your device storage may be full.",

  "payment.failure.declined":
    "The payment was declined. No money has left your account.",
  "payment.failure.unavailable":
    "Payments are unavailable right now. Please try again in a moment.",

  "payment.title": "Payment",
  "payment.description":
    "Review your journey, then confirm to receive your virtual ticket.",
  "payment.srTo": "to",
  "payment.srUntil": "until",

  /*
    The honesty notice, which is the most important string in this file. It
    must say plainly in every language that confirming moves no money - a
    Hindi reader shown a softened version has been misled about whether they
    have paid for their journey.
  */
  "payment.noMoney.title": "No payment will be taken",
  "payment.noMoney.body":
    "This service is not connected to a payment provider. Confirming issues a demonstration ticket and moves no money. Pay the conductor on board as usual.",

  "payment.pay": "Pay ₹{fare}",
  "payment.payDemo": "Issue a demonstration ticket for ₹{fare}",

  "payment.processing.title": "Processing payment",
  "payment.processing.description":
    "This will only take a moment. Please do not close this window.",
  "payment.processing.status": "Processing payment…",

  "payment.success.title": "Payment successful",
  "payment.success.description": "Your ticket from {from} to {to} is confirmed.",
  "payment.success.demo": "Demonstration ticket. No payment was taken.",
  "payment.success.notSaved":
    "Your ticket could not be saved to this device, so it may not be here later.",
  "payment.viewTicket": "View my ticket",

  "payment.failed.title": "Payment failed",
  "payment.failed.generic":
    "Something went wrong while processing your payment.",
  "payment.error.signedOut": "You must be signed in to complete this payment.",
  "payment.error.unknown": "Could not complete your payment. Please try again.",

  "payment.announce.signedOut": "Payment failed. You must be signed in.",
  "payment.announce.bookingFailed": "Booking failed. {reason}",
  "payment.announce.processing": "Processing your payment, please wait.",
  "payment.announce.paymentFailed": "Payment failed. {reason}",
  "payment.announce.success":
    "Payment successful. Your ticket from {from} to {to} is confirmed.",
  "payment.announce.retry": "Payment failed. Please try again.",


  /*
    What a ticket says it is. Shown on the ticket itself, in the history list
    and explained on /help - three surfaces that have to agree, which is why
    the status engine names a key rather than each screen writing its own.
  */

  /*
    The ticket a passenger shows a conductor.

    "BRT Bus Service" is NOT here: it is the operator's name printed on the
    ticket, and it stays as published in both languages.

    Two keys for the countdown rather than one with a plural rule. English
    needs "1 more minute" and "5 more minutes"; a rule engine for one string
    is more machinery than the string is worth, and Hindi does not inflect it
    at all.
  */
  "ticket.expired": "Expired",
  "ticket.heading": "Route {route} · {from} to {to}",
  "ticket.statusPrefix": "Ticket status: ",
  "ticket.farePaid": "Fare paid",
  "ticket.validFor": "Valid for",
  "ticket.qrLabel": "Boarding QR code for booking {id}",
  "ticket.qrLabelExpired": "Expired boarding QR code for booking {id}",
  "ticket.copied": "Booking reference copied",
  "ticket.copy": "Copy booking reference {id}",
  "ticket.saveQr": "Save QR",
  "ticket.cancel": "Cancel ticket",
  "ticket.cancelFor": " for {from} to {to}",

  "ticket.announce.validForOne":
    "Your ticket is valid for about {minutes} more minute.",
  "ticket.announce.validForMany":
    "Your ticket is valid for about {minutes} more minutes.",
  "ticket.announce.copied": "Booking reference copied to clipboard.",
  "ticket.announce.copyFailed": "Could not copy the booking reference.",
  "ticket.announce.qrFailed": "Could not prepare the QR code for download.",
  "ticket.announce.qrDownloaded": "QR code downloaded.",


  /*
    A passenger's own dashboard.

    The empty history states are three separate strings rather than one with
    the filter name substituted. English wants "No completed tickets" from a
    label that reads "Completed", and lower-casing a translated word is an
    assumption that only holds for languages with letter case.
  */
  "dashboard.avatarAlt": "User",
  "dashboard.passenger": "Passenger",
  "dashboard.tripsCompleted": "Trips Completed",
  "dashboard.totalSpent": "Total Spent",
  "dashboard.favouriteRoute": "Favourite Route",

  "dashboard.yourTicket": "Your Ticket",
  "dashboard.noActiveTickets": "No active tickets",
  "dashboard.bookPrompt":
    "Book a seat from the timetable and your ticket will appear here.",
  "dashboard.bookCta": "Book a Ticket",

  "dashboard.alerts.title": "Arrival Alerts",
  "dashboard.alerts.body":
    "Tells you when your bus is close to your boarding stop.",
  "dashboard.alerts.on": "On",
  "dashboard.alerts.off": "Off",
  "dashboard.alerts.suffix": " — arrival alerts",
  "dashboard.alerts.switchedOn": "Arrival alerts switched on.",
  "dashboard.alerts.switchedOff": "Arrival alerts switched off.",
  "dashboard.alerts.failed": "Could not change your alert setting.",

  "dashboard.history.title": "Ticket History",
  "dashboard.history.filterLabel": "Filter ticket history",
  "dashboard.filter.all": "All",
  "dashboard.history.emptyAll": "No past journeys yet",
  "dashboard.history.emptyCompleted": "No completed tickets",
  "dashboard.history.emptyCancelled": "No cancelled tickets",

  "dashboard.cancel.failed":
    "That ticket could not be cancelled. It may have already departed.",
  "dashboard.cancel.done": "Ticket cancelled.",
  "dashboard.cancel.announced": "Your ticket has been cancelled.",


  /*
    The driver's screen.

    Route names and headlines in the picker are published data and stay as
    published, in both languages - only the label above the picker is ours.

    The interruption reasons name the ONE cause that can actually be observed,
    a backgrounded tab, and stay general about everything else. Translating
    them must not turn "we do not know why" into a guess that sounds specific.
  */
  "fleet.sharing.idle": "Not sharing",
  "fleet.sharing.sharing": "Sharing your live location",
  "fleet.sharing.interrupted": "Your position is not reaching passengers",
  "fleet.interruption.background":
    "This tab was in the background, and browsers stop a background tab from reading its location. Keep this screen open and awake while you are on shift.",
  "fleet.interruption.signal":
    "The last update did not reach us. Check your signal.",

  "driver.title": "Driver Live Tracking",
  "driver.broadcastingAs": "Broadcasting as",
  "driver.checking": "Checking your assignment…",
  "driver.noAssignment.lead": "No bus is assigned to you right now.",
  "driver.noAssignment.body":
    "Sharing your position needs an assignment from the operator, and each one covers a single shift. Ask them to assign you a vehicle.",
  "driver.routeLabel": "Route you are running",
  "driver.stopToChange": "Stop sharing to change route.",
  "driver.sharingOn": " on {route}",
  "driver.interrupted.title": "Your position is not reaching passengers.",
  "driver.latitude": "Latitude",
  "driver.longitude": "Longitude",
  "driver.start": "Start Sharing",
  "driver.stop": "Stop Sharing",
  "driver.privacy":
    "Only your coordinates and this bus label are shared. Your name and email address are never published.",
  "driver.error.permission":
    "Location permission is required to broadcast your position.",
  "driver.error.readFailed": "Could not read your location. Please try again.",
  "driver.error.unavailable": "Live tracking is unavailable right now.",
  "driver.announce.interrupted":
    "Your position is not reaching passengers. {reason}",

  "driver.dashboard.noAssignment":
    "No bus is assigned to you right now, so nothing is being shared. The operator assigns one for each shift.",
  "driver.dashboard.role": "Driver",
  "driver.dashboard.title": "Share Live Location",
  "driver.dashboard.body":
    "Broadcasting runs on the live tracking page and stops when you leave it, so keep that page open while you are on shift.",
  "driver.dashboard.cta": "Open live tracking",

  "ticket.status.pending": "Pending",
  "ticket.status.active": "Active",
  "ticket.status.boardingSoon": "Boarding Soon",
  "ticket.status.inTransit": "In Transit",
  "ticket.status.completed": "Completed",
  "ticket.status.cancelled": "Cancelled",

  "login.signIn.title": "Sign in",
  "login.signUp.title": "Create account",
  "login.reset.title": "Reset password",

  "login.email": "Email",
  "login.password": "Password",
  "login.name": "Full name",
  "field.required": " (required)",

  "login.signIn.action": "Sign in",
  "login.signIn.pending": "Signing in…",
  "login.signUp.action": "Sign up",
  "login.signUp.pending": "Creating account…",
  "login.google": "Continue with Google",
  "login.forgot": "Forgot password?",
  "login.backToSignIn": "Back to sign in",
  "login.passwordHint": "At least 6 characters.",

  "login.reset.intro":
    "Enter your email and we will send you a link to set a new password.",
  /*
    Deliberately says "if". The reset flow must never confirm whether an
    address is registered, in any language.
  */
  "login.reset.sent":
    "If an account exists for {email}, a password reset link is on its way. Check your inbox and spam folder.",
  "login.reset.action": "Send reset link",
  "login.reset.pending": "Sending…",

  "login.haveAccount": "Already have an account?",
  "login.noAccount": "Don't have an account?",
  "login.showPassword": "Show password",
  "login.hidePassword": "Hide password",

  "login.aside.newTitle": "Hello, friend!",
  "login.aside.newBody":
    "Don't have an account? Sign up now to book bus tickets and enjoy seamless travel.",
  "login.aside.returningTitle": "Welcome back!",
  "login.aside.returningBody":
    "Already have an account? Sign in to continue booking your tickets.",

  "login.announce.signInProblem": "There is a problem with the sign-in form.",
  "login.announce.signUpProblem": "There is a problem with the sign-up form.",
  "login.announce.resetProblem": "There is a problem with the reset form.",
  "login.announce.signingIn": "Signing you in…",
  "login.announce.creating": "Creating your account…",
  "login.announce.resetSent":
    "If that email has an account, a reset link is on its way.",

  /*
    What is safe to show when something failed.

    Never a Firebase code, an index hint or a project id - those go to the
    console for whoever debugs them. A rules refusal is not a bug and reads as
    a plain refusal.
  */

  /*
    The screen shown when the app itself has failed, and the arrival popup.

    "Position only" is a truthfulness notice, not a caption: the app knows
    where a bus IS and never when it will arrive, and both languages have to
    say so with the same force.
  */
  "boundary.title": "Something went wrong",
  "boundary.body":
    "This page could not be displayed. Reloading usually fixes it, especially if the app was updated while this tab was open.",
  "boundary.offlineTitle": "This page needs a connection",
  "boundary.offlineBody":
    "You appear to be offline, and this page has not been opened on this device before. Pages you have already visited still work.",
  "boundary.reload": "Reload the page",
  "boundary.home": "Back to home",

  "notification.dismiss": "Dismiss notification",
  "notification.positionOnly": "Position only — not an arrival time",


  /*
    What a screen reader is told when a route changes.

    These name pages for a PERSON. The same table also fills `document.title`
    and the meta description, and those stay English on purpose: they are what
    a search engine indexes, and the descriptions beside them are long-form
    copy that belongs to the stage this one is not. Localising the tab title
    is a decision about search results, not about translation.
  */
  "route.loaded": "{page} page loaded",
  "page.placeNotFound": "Place not found",
  "page.unknown": "Page",
  "page.home": "Home",
  "page.plan": "Plan your journey",
  "page.routes": "Route explorer",
  "page.nearby": "Nearby places",
  "page.map": "Live bus tracking",
  "page.timetable": "Timetable",
  "page.fares": "Fares",
  "page.contact": "Contact",
  "page.help": "Passenger help",
  "page.about": "About the BRT corridor",
  "page.search": "Search",
  "page.login": "Sign in",
  "page.dashboard": "Dashboard",
  "page.driver": "Driver live tracking",

  /*
    The route guards. "Access denied" deliberately says nothing about what the
    page contains or which role would grant it - a refusal should not double
    as a map of the app, in any language.
  */
  "guard.checking": "Checking your access…",
  "guard.deniedTitle": "Access denied",
  "guard.deniedBody": "You do not have permission to view this page.",

  "error.generic": "Something went wrong. Please try again.",
  "error.noPermission": "You do not have permission to perform this action.",
  "error.signInRequired": "Please sign in to continue.",
  "error.network":
    "Network unavailable. Please check your connection and try again.",
  "error.loadUsers": "Could not load users.",
  "error.updateRole": "Could not update that role.",
  "error.loadAnnouncements": "Could not load announcements.",
  "error.shareLocation": "Could not share your location.",

  "validation.generic": "Please check your details.",
  "validation.email.required": "Email is required",
  "validation.email.tooLong": "Email is too long",
  "validation.email.invalid": "Please enter a valid email address",
  "validation.password.tooShort": "Password must be at least 6 characters",
  "validation.password.tooLong": "Password must be at most 128 characters",
  "validation.name.required": "Name is required",
  "validation.name.tooLong": "Name is too long",
  "validation.name.invalid": "Name contains invalid characters",

  /*
    Sign-in failures.

    `auth.error.credentials` covers a wrong password, an unknown account, a
    malformed address and a rejected credential, and it must stay one string
    in every language. Splitting it - even into two Hindi sentences that read
    more naturally - turns the form into an account-enumeration oracle, where
    an attacker learns which addresses are registered by watching which
    message comes back.
  */
  "auth.error.credentials": "Incorrect email or password.",
  "auth.error.tooManyAttempts":
    "Too many attempts. Please wait a few minutes and try again.",
  "auth.error.disabled": "This account has been disabled.",
  "auth.error.emailInUse": "That email address cannot be used to register.",
  "auth.error.weakPassword": "Please choose a password of at least 6 characters.",
  "auth.error.cancelled": "Sign-in was cancelled.",
  "auth.error.popupBlocked":
    "Your browser blocked the sign-in popup. Please allow popups and retry.",
  "auth.error.network":
    "Network unavailable. Please check your connection and try again.",
  "auth.error.generic": "Sign-in failed. Please try again.",
  "auth.error.resetFailed": "Could not send the reset email. Please try again.",
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
