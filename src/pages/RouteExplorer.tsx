import { useId, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Clock, Repeat, Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RouteStopList from "@/components/RouteStopList";
import {
  getNetworkRoutes,
  getRoute,
  isInterchange,
  isNetworkRouteId,
  ROUTE_IDS,
  type NetworkRoute,
  type NetworkRouteId,
} from "@/domain/transit/routes";
import { SCHEDULED_STOPS, getTrips } from "@/domain/transit/schedule";
import { findStops } from "@/domain/transit/stops";

const networkRoutes = getNetworkRoutes();

const routeMatches = (route: NetworkRoute, query: string): boolean => {
  const term = query.trim().toLowerCase();
  if (!term) return true;

  if (
    route.id.toLowerCase().includes(term) ||
    route.name.toLowerCase().includes(term) ||
    route.headline.toLowerCase().includes(term)
  ) {
    return true;
  }

  return findStops(term).some((stop) => route.servedStops.includes(stop));
};

const RouteExplorer = () => {
  const panelId = useId();
  const searchId = useId();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");

  const requested = params.get("route");
  const selectedId = isNetworkRouteId(requested) ? requested : null;

  const selected = useMemo(
    () => networkRoutes.find((route) => route.id === selectedId) ?? null,
    [selectedId]
  );

  const visible = useMemo(
    () => networkRoutes.filter((route) => routeMatches(route, query)),
    [query]
  );

  const select = (id: NetworkRouteId | null) => {
    setParams(id ? { route: id } : {}, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main id="main-content" tabIndex={-1} className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 animate-fade-in-up">
            <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">
              Explore the network
            </h1>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Every route published in the official Tatpar BRTS network, the
              stops it serves, and where you can change buses.
            </p>

            <Link
              to="/nearby"
              className="inline-block mt-3 text-primary font-medium underline underline-offset-2 touch-target"
            >
              Places you can reach on these routes
            </Link>
          </div>

          <section className="mb-12" aria-labelledby="scheduled-heading">
            <h2 id="scheduled-heading" className="brt-section-title text-primary">
              Services running today
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ROUTE_IDS.map((id) => {
                const route = getRoute(id);
                const trips =
                  getTrips("weekday").filter((trip) => trip.routeId === id)
                    .length +
                  getTrips("weekend").filter((trip) => trip.routeId === id)
                    .length;

                return (
                  <div key={id} className="brt-card">
                    <p className="font-bold text-foreground">{route.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {route.headline}
                    </p>

                    <p className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      {route.servedStops.length} stops · {trips} departures a
                      week
                    </p>

                    <Link
                      to="/timetable"
                      className="brt-button inline-block mt-4 touch-target"
                    >
                      View timetable
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="network-heading">
            <h2 id="network-heading" className="brt-section-title text-primary">
              Official network routes
            </h2>

            <div className="mb-6">
              <label
                htmlFor={searchId}
                className="block text-sm font-medium text-foreground mb-1"
              >
                Find a route
              </label>

              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id={searchId}
                  type="search"
                  value={query}
                  autoComplete="off"
                  placeholder="Search by route or stop name"
                  onChange={(event) => setQuery(event.target.value)}
                  className="brt-input touch-target pl-11"
                />
              </div>

              <p className="sr-only" role="status" aria-live="polite">
                {visible.length} of {networkRoutes.length} routes shown
              </p>
            </div>

            {visible.length === 0 && (
              <div className="brt-card text-center">
                <p className="font-semibold text-foreground mb-1">
                  No routes match "{query.trim()}"
                </p>
                <p className="text-sm text-muted-foreground">
                  Try a route name, a route id, or the name of a stop.
                </p>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="mt-3 text-primary font-medium underline underline-offset-2 touch-target"
                >
                  Clear search
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visible.map((route) => {
                const withDepartures = route.servedStops.filter((stop) =>
                  SCHEDULED_STOPS.has(stop)
                ).length;
                const interchanges =
                  route.servedStops.filter(isInterchange).length;
                const open = selectedId === route.id;

                return (
                  <button
                    key={route.id}
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => select(open ? null : route.id)}
                    className={`brt-card text-left touch-target ${
                      open ? "ring-2 ring-primary/40" : ""
                    }`}
                  >
                    <p className="text-xs font-semibold text-muted-foreground">
                      {route.id}
                    </p>
                    <p className="mt-1 font-bold text-foreground">
                      {route.name}
                    </p>

                    <p className="mt-2 text-sm text-foreground flex items-center gap-2 flex-wrap">
                      <span>{route.servedStops[0]}</span>
                      <ArrowRight
                        className="w-3.5 h-3.5 text-primary flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>
                        {route.servedStops[route.servedStops.length - 1]}
                      </span>
                    </p>

                    <p className="mt-3 text-xs text-muted-foreground">
                      {route.servedStops.length} stops · {interchanges}{" "}
                      {interchanges === 1 ? "interchange" : "interchanges"}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {withDepartures === route.servedStops.length
                        ? "All stops have scheduled departures"
                        : withDepartures === 0
                          ? "No scheduled departures yet"
                          : `${withDepartures} of ${route.servedStops.length} stops ${withDepartures === 1 ? "has" : "have"} scheduled departures`}
                    </p>
                  </button>
                );
              })}
            </div>

            <div id={panelId} className="mt-8">
              {selected && (
                <div className="brt-container animate-fade-in-up">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-primary">
                        {selected.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selected.headline}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        to={`/plan?from=${encodeURIComponent(selected.servedStops[0]!)}&to=${encodeURIComponent(selected.servedStops[selected.servedStops.length - 1]!)}`}
                        className="brt-button inline-flex items-center gap-2 touch-target"
                      >
                        <Repeat className="w-4 h-4" aria-hidden="true" />
                        Plan a journey
                      </Link>

                      <Link
                        to="/fares"
                        className="px-6 py-3 rounded-xl border border-border text-foreground font-medium transition-all duration-300 hover:bg-secondary inline-flex items-center gap-2 touch-target"
                      >
                        Check fares
                      </Link>

                      <Link
                        to="/timetable"
                        className="px-6 py-3 rounded-xl border border-border text-foreground font-medium transition-all duration-300 hover:bg-secondary inline-flex items-center gap-2 touch-target"
                      >
                        Timetable
                      </Link>
                    </div>
                  </div>

                  <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    {[
                      ["Stops", `${selected.servedStops.length}`],
                      [
                        "Interchanges",
                        `${selected.servedStops.filter(isInterchange).length}`,
                      ],
                      [
                        "With departures",
                        `${selected.servedStops.filter((stop) => SCHEDULED_STOPS.has(stop)).length} of ${selected.servedStops.length}`,
                      ],
                      ["Terminates", selected.servedStops[selected.servedStops.length - 1]!],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-secondary p-4">
                        <dt className="text-xs text-muted-foreground">{label}</dt>
                        <dd className="mt-1 font-bold text-foreground">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  <RouteStopList
                    routeId={selected.id}
                    stops={selected.servedStops}
                    scheduled={SCHEDULED_STOPS}
                  />
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RouteExplorer;
