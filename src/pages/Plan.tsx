import { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, Clock, Repeat, Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StopField from "@/components/StopField";
import BookingModal from "@/components/BookingModal";
import PaymentModal from "@/components/PaymentModal";
import { useAuth } from "@/contexts/AuthContext";
import type { JourneySelection } from "@/domain/ticket/types";
import { parseTimeToDate } from "@/domain/time";
import { calculateFare } from "@/domain/transit/fares";
import { isInterchange } from "@/domain/transit/routes";
import {
  getCallTime,
  getDestinationsFrom,
  getTripStops,
  getTrips,
  type ServiceDay,
  type Trip,
} from "@/domain/transit/schedule";
import { findStops, isStopName, type StopName } from "@/domain/transit/stops";

interface JourneyOption {
  trip: Trip;
  departure: string;
  arrival: string;
  minutes: number;
  interchanges: StopName[];
}

const isoDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const clockTime = (date: Date): string =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

const serviceFor = (iso: string): ServiceDay => {
  const day = new Date(`${iso}T00:00:00`).getDay();
  return day === 0 || day === 6 ? "weekend" : "weekday";
};

/**
 * Resolves whatever the passenger typed to a stop.
 *
 * An exact name wins; otherwise a search that narrows to exactly one stop is
 * accepted, so "raipur" resolves but "sector" stays ambiguous.
 */
const resolveStop = (value: string): StopName | null => {
  const trimmed = value.trim();
  if (isStopName(trimmed)) return trimmed;

  const matches = findStops(trimmed);
  return matches.length === 1 ? matches[0]! : null;
};

const minutesBetween = (from: string, to: string): number =>
  Math.round(
    (parseTimeToDate(to).getTime() - parseTimeToDate(from).getTime()) / 60_000
  );

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
};

const Plan = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();

  const today = isoDate(new Date());

  const [from, setFrom] = useState(params.get("from") ?? "");
  const [to, setTo] = useState(params.get("to") ?? "");
  const [date, setDate] = useState(params.get("date") ?? today);
  const [time, setTime] = useState(params.get("time") ?? clockTime(new Date()));

  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selection, setSelection] = useState<JourneySelection | null>(null);

  const searched = params.has("from") && params.has("to");
  const origin = resolveStop(params.get("from") ?? "");
  const destination = resolveStop(params.get("to") ?? "");
  const searchedDate = params.get("date") ?? today;
  const searchedTime = params.get("time") ?? "00:00";

  const fare =
    origin && destination ? calculateFare(origin, destination) : null;

  const options = useMemo<JourneyOption[]>(() => {
    if (!origin || !destination || origin === destination) return [];

    const [hours = 0, mins = 0] = searchedTime.split(":").map(Number);
    const earliest = hours * 60 + mins;

    return getTrips(serviceFor(searchedDate))
      .filter((trip) => getDestinationsFrom(trip, origin).includes(destination))
      .map((trip) => {
        const departure = getCallTime(trip, origin)!;
        const arrival = getCallTime(trip, destination)!;
        const stops = getTripStops(trip);
        const between = stops.slice(
          stops.indexOf(origin) + 1,
          stops.indexOf(destination)
        );

        return {
          trip,
          departure,
          arrival,
          minutes: minutesBetween(departure, arrival),
          interchanges: between.filter(isInterchange),
        };
      })
      .filter((option) => {
        const at = parseTimeToDate(option.departure);
        return at.getHours() * 60 + at.getMinutes() >= earliest;
      });
  }, [origin, destination, searchedDate, searchedTime]);

  const sameStop = Boolean(origin && destination && origin === destination);
  const unresolved =
    (params.get("from") ?? "") !== "" && (!origin || !destination);
  const bookable = searchedDate === today;

  const handleSearch = () => {
    setParams({ from: from.trim(), to: to.trim(), date, time });
  };

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  const handleBook = (trip: Trip) => {
    if (!user) {
      toast.info("Please sign in to book a ticket.");
      navigate("/login", { state: { from: location } });
      return;
    }

    setSelection(null);
    setSelectedTrip(trip);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main id="main-content" tabIndex={-1} className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 animate-fade-in-up">
            <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">
              Plan your journey
            </h1>
            <p className="mt-3 text-muted-foreground">
              Choose where you are boarding and where you are going. Fares come
              from the official BRTS fare chart.
            </p>
          </div>

          <div className="brt-search-card animate-fade-in-up animate-stagger-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StopField
                label="From"
                value={from}
                onChange={setFrom}
                exclude={resolveStop(to) ?? ""}
              />

              <StopField
                label="To"
                value={to}
                onChange={setTo}
                exclude={resolveStop(from) ?? ""}
              />

              <div>
                <label
                  htmlFor="plan-date"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Travel date
                </label>
                <input
                  id="plan-date"
                  type="date"
                  value={date}
                  min={today}
                  onChange={(event) => setDate(event.target.value)}
                  className="brt-input touch-target"
                />
              </div>

              <div>
                <label
                  htmlFor="plan-time"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Leaving after
                </label>
                <input
                  id="plan-time"
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="brt-input touch-target"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                type="button"
                onClick={handleSearch}
                className="brt-button flex-1 flex items-center justify-center gap-2 touch-target"
              >
                <Search className="w-4 h-4" aria-hidden="true" />
                Search journeys
              </button>

              <button
                type="button"
                onClick={handleSwap}
                className="px-6 py-3 rounded-xl border border-border text-foreground font-medium transition-all duration-300 hover:bg-secondary flex items-center justify-center gap-2 touch-target"
              >
                <Repeat className="w-4 h-4" aria-hidden="true" />
                Swap
              </button>
            </div>
          </div>

          <div aria-live="polite" className="mt-8">
            {sameStop && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3">
                <p className="text-sm text-destructive font-medium">
                  Choose two different stops.
                </p>
              </div>
            )}

            {unresolved && !sameStop && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3">
                <p className="text-sm text-destructive font-medium">
                  Pick both stops from the suggestions so we can price the
                  journey.
                </p>
              </div>
            )}

            {searched && origin && destination && !sameStop && (
              <>
                <div className="brt-card mb-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-foreground font-semibold">
                      <span>{origin}</span>
                      <ArrowRight
                        className="w-4 h-4 text-primary"
                        aria-hidden="true"
                      />
                      <span>{destination}</span>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Official fare
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {fare === null ? "Not published" : `₹${fare}/-`}
                      </p>
                    </div>
                  </div>
                </div>

                {fare === null && (
                  <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 mb-6">
                    <p className="text-sm text-destructive font-medium">
                      The official fare chart does not price this journey, so it
                      cannot be booked yet.
                    </p>
                  </div>
                )}

                {options.length === 0 ? (
                  <div className="brt-card text-center">
                    <p className="font-semibold text-foreground mb-1">
                      No scheduled service for this journey
                    </p>
                    <p className="text-sm text-muted-foreground">
                      The timetable currently runs from HNLU towards Raipur
                      Railway Station only, and departures are listed for the
                      selected day after {searchedTime}.
                    </p>
                  </div>
                ) : (
                  <>
                    <h2 className="brt-section-title text-left text-primary">
                      {options.length}{" "}
                      {options.length === 1 ? "departure" : "departures"}
                    </h2>

                    <div className="space-y-4">
                      {options.map((option) => (
                        <div key={option.trip.id} className="brt-card">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <p className="text-lg font-bold text-foreground">
                                {option.departure}
                                <span className="text-muted-foreground font-normal">
                                  {" "}
                                  →{" "}
                                </span>
                                {option.arrival}
                              </p>

                              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                                {formatDuration(option.minutes)} · Route{" "}
                                {option.trip.routeId}
                              </p>

                              {option.interchanges.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Connects with other routes at{" "}
                                  {option.interchanges.join(", ")}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              disabled={fare === null || !bookable}
                              onClick={() => handleBook(option.trip)}
                              className="brt-button disabled:opacity-40 disabled:cursor-not-allowed touch-target"
                            >
                              Book ticket
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {!bookable && (
                      <p className="text-sm text-muted-foreground mt-4">
                        Tickets are issued for travel today, so booking is
                        available on today's departures only.
                      </p>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {selectedTrip && origin && destination && (
        <BookingModal
          key={selectedTrip.id}
          open
          trip={selectedTrip}
          initialFromStop={origin}
          initialToStop={destination}
          onClose={() => setSelectedTrip(null)}
          onProceedPayment={(next) => {
            setSelection(next);
            setSelectedTrip(null);
          }}
        />
      )}

      {selection && (
        <PaymentModal
          open
          selection={selection}
          onClose={() => setSelection(null)}
          onSuccess={() => navigate("/dashboard")}
        />
      )}
    </div>
  );
};

export default Plan;
