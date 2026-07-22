import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingModal from "@/components/BookingModal";
import PaymentModal from "@/components/PaymentModal";
import { useAuth } from "@/contexts/AuthContext";
import type { JourneySelection } from "@/domain/ticket/types";
import { getRoute } from "@/domain/transit/routes";
import {
  getCallTime,
  getTrips,
  type ServiceDay,
  type Trip,
} from "@/domain/transit/schedule";
import { STOPS } from "@/domain/transit/stops";

const CORRIDOR = getRoute("101").headline;

const SERVICES: Array<{ day: ServiceDay; caption: string }> = [
  { day: "weekday", caption: `BRT Service - ${CORRIDOR} (Weekdays)` },
  { day: "weekend", caption: `BRT Service - ${CORRIDOR} (Weekends)` },
];

interface TimetableTableProps {
  caption: string;
  trips: readonly Trip[];
  onBook: (trip: Trip) => void;
}

/**
 * Renders trips as a stop-per-column grid.
 *
 * A trip that does not call at a stop simply has no entry for it, which is
 * how the express route's skipped stops render as blanks without the data
 * needing empty-string placeholders.
 */
const TimetableTable = ({ caption, trips, onBook }: TimetableTableProps) => (
  <div className="overflow-x-auto mx-auto max-w-full mb-10">
    <table
      className="w-full border-collapse rounded-2xl overflow-hidden"
      style={{
        boxShadow:
          "0 4px 16px hsla(284,33%,30%,0.06), 0 12px 32px hsla(284,33%,30%,0.04)",
      }}
    >
      <caption className="text-lg font-bold text-foreground mb-4 tracking-tight">
        {caption}
      </caption>
      <thead>
        <tr className="bg-primary text-primary-foreground">
          <th className="px-2 py-2.5 text-[10px] lg:text-xs font-semibold whitespace-nowrap text-center">
            Route
          </th>
          {STOPS.map((stop) => (
            <th
              key={stop}
              className="px-2 py-2.5 text-[10px] lg:text-xs font-semibold whitespace-nowrap text-center"
            >
              {stop}
            </th>
          ))}
          <th className="px-2 py-2.5 text-[10px] lg:text-xs font-semibold text-center">
            Book
          </th>
        </tr>
      </thead>
      <tbody>
        {trips.map((trip, index) => (
          <tr
            key={trip.id}
            className={`transition-colors duration-200 ${
              index % 2 === 0 ? "bg-card" : "bg-secondary"
            } hover:bg-accent/50`}
          >
            <td className="px-2 py-1.5 text-[10px] lg:text-xs text-center whitespace-nowrap text-foreground border-b border-border">
              {trip.routeId}
            </td>

            {STOPS.map((stop) => (
              <td
                key={stop}
                className="px-2 py-1.5 text-[10px] lg:text-xs text-center whitespace-nowrap text-foreground border-b border-border"
              >
                {getCallTime(trip, stop) ?? ""}
              </td>
            ))}

            <td className="px-2 py-1.5 border-b border-border text-center">
              <button
                onClick={() => onBook(trip)}
                className="px-2 py-1 text-[10px] lg:text-xs bg-primary text-primary-foreground rounded-md hover:-translate-y-0.5 transition-all duration-200 hover:shadow-md active:scale-95"
              >
                Book
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Timetable = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selection, setSelection] = useState<JourneySelection | null>(null);

  const handleBook = (trip: Trip) => {
    if (!user) {
      // Kept as-is for now; replacing this blocking alert belongs to the UX sprint.
      alert("Please log in first to book a ticket.");
      navigate("/login");
      return;
    }

    setSelection(null);
    setSelectedTrip(trip);
  };

  const handleProceedPayment = (next: JourneySelection) => {
    setSelection(next);
    setSelectedTrip(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="py-10 px-4">
        {SERVICES.map(({ day, caption }) => (
          <TimetableTable
            key={day}
            caption={caption}
            trips={getTrips(day)}
            onBook={handleBook}
          />
        ))}
      </main>

      <Footer />

      {/*
        Keyed on the trip so each booking starts from a clean stop selection
        rather than inheriting the previous trip's choice.
      */}
      {selectedTrip && (
        <BookingModal
          key={selectedTrip.id}
          open
          trip={selectedTrip}
          onClose={() => setSelectedTrip(null)}
          onProceedPayment={handleProceedPayment}
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

export default Timetable;
