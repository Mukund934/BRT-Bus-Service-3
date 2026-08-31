/**
 * Makes client-side navigation behave like a real page load.
 *
 * A browser doing a full page load resets scroll position, tells the screen
 * reader what page you are on, and hands the crawler that page's own title,
 * description and canonical address. A single-page router does none of it, so
 * a keyboard or screen-reader user can follow a link and be left mid-page with
 * no indication anything happened, and every route reports whatever metadata
 * the first one left behind. This restores all of it.
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { setPageDescription } from "@/lib/page-meta";
import { useAnnounce } from "./LiveAnnouncer";

/** Human-readable page names, keyed by route. */
const ROUTE_TITLES: Record<string, string> = {
  "/": "Home",
  "/plan": "Plan your journey",
  "/routes": "Route explorer",
  "/nearby": "Nearby places",
  "/map": "Live bus tracking",
  "/timetable": "Timetable",
  "/fares": "Fares",
  "/contact": "Contact",
  "/help": "Passenger help",
  "/about": "About the BRT corridor",
  "/login": "Sign in",
  "/dashboard": "Dashboard",
  "/driver": "Driver live tracking",
};

/** Search-result summaries, keyed by the same routes. */
const ROUTE_DESCRIPTIONS: Record<string, string> = {
  "/": "Plan a journey, check official BRTS fares, browse every route and track buses live on the Raipur to Naya Raipur corridor.",
  "/plan": "Choose where you are boarding and where you are going. Departures come from the published timetable and fares from the official BRTS fare chart.",
  "/routes": "Every route published in the official Tatpar BRTS network, the stops it serves, and where you can change buses.",
  "/nearby": "Destinations across Nava Raipur and the nearest BRT stop for each. Plan a journey there, see the route, or check the fare.",
  "/map": "Track BRT buses reporting their position live on the Raipur to Naya Raipur corridor.",
  "/timetable": "Weekday and weekend departure times for every stop on BRT routes 101 and 102.",
  "/fares": "Check the official BRTS fare between any two stops, or read the full published fare chart.",
  "/contact": "Reach the BRT Bus Service team for support, collaboration or queries.",
  "/help": "How journeys, fares, tickets, live tracking and arrival alerts work on the BRT Bus Service.",
  "/about": "What Bus Rapid Transit is, the Nava Raipur service as its operator publishes it, and what this site can and cannot tell you.",
  "/login": "Sign in to book a ticket and see your journey history.",
  "/dashboard": "Your tickets, journey history and account.",
  "/driver": "Share your bus position with passengers while you are on shift.",
};

/**
 * Routes whose metadata belongs to the page rather than to this table.
 *
 * A place detail page's title is the place's name, which lives in a dataset
 * this eagerly-loaded component must not import. Those routes are skipped
 * here entirely, so exactly one thing writes the title and there is no race
 * between a parent effect and a child one.
 */
const PAGE_OWNED = [/^\/nearby\/[a-z0-9-]+$/];

const ownsItsMetadata = (pathname: string): boolean =>
  PAGE_OWNED.some((route) => route.test(pathname));

const titleFor = (pathname: string): string => ROUTE_TITLES[pathname] ?? "Page";

/**
 * Points every search-parameter variant of a page at one address.
 *
 * The planner and the route explorer both keep their state in the query
 * string, so `/plan?from=HNLU&to=CBD&date=…&time=…` is a distinct URL for
 * every search anyone has ever run. Without this each one is a separate page
 * to a crawler.
 */
const setCanonical = (pathname: string) => {
  const href = `${window.location.origin}${pathname}`;
  const existing = document.head.querySelector('link[rel="canonical"]');

  if (existing) {
    existing.setAttribute("href", href);
    return;
  }

  const tag = document.createElement("link");
  tag.setAttribute("rel", "canonical");
  tag.setAttribute("href", href);
  document.head.appendChild(tag);
};

export const RouteChangeHandler = () => {
  const { pathname } = useLocation();
  const announce = useAnnounce();

  useEffect(() => {
    setCanonical(pathname);

    // "auto" rather than "smooth": a page change should be instant, and
    // smooth-scrolling a whole page is exactly what reduced-motion users
    // are asking to avoid.
    window.scrollTo({ top: 0, behavior: "auto" });

    // Scroll and canonical apply everywhere; the naming does not, because a
    // page-owned route would only have it overwritten a moment later.
    if (ownsItsMetadata(pathname)) return;

    const title = titleFor(pathname);

    document.title = `${title} · BRT Bus Service`;
    setPageDescription(ROUTE_DESCRIPTIONS[pathname]);
    announce(`${title} page loaded`);
  }, [pathname, announce]);

  return null;
};
