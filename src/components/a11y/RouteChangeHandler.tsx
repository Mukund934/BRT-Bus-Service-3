/**
 * Makes client-side navigation behave like a real page load.
 *
 * A browser doing a full page load resets scroll position and tells the
 * screen reader what page you are on. A single-page router does neither, so a
 * keyboard or screen-reader user can follow a link and be left mid-page with
 * no indication anything happened. This restores both.
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAnnounce } from "./LiveAnnouncer";

/** Human-readable page names, keyed by route. */
const ROUTE_TITLES: Record<string, string> = {
  "/": "Home",
  "/map": "Live bus tracking",
  "/timetable": "Timetable",
  "/fares": "Fares",
  "/contact": "Contact",
  "/login": "Sign in",
  "/dashboard": "Dashboard",
  "/driver": "Driver live tracking",
};

const titleFor = (pathname: string): string => ROUTE_TITLES[pathname] ?? "Page";

export const RouteChangeHandler = () => {
  const { pathname } = useLocation();
  const announce = useAnnounce();

  useEffect(() => {
    const title = titleFor(pathname);

    document.title = `${title} · BRT Bus Service`;

    // "auto" rather than "smooth": a page change should be instant, and
    // smooth-scrolling a whole page is exactly what reduced-motion users
    // are asking to avoid.
    window.scrollTo({ top: 0, behavior: "auto" });

    announce(`${title} page loaded`);
  }, [pathname, announce]);

  return null;
};
