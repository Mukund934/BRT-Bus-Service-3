import { useMemo, useState } from "react";
import { findConflictingTicket } from "@/domain/ticket/conflicts";
import type { JourneySelection } from "@/domain/ticket/types";
import { calculateFare } from "@/domain/transit/fares";
import {
  getCallTime,
  getDestinationsFrom,
  getTripStops,
  type Trip,
} from "@/domain/transit/schedule";
import type { StopName } from "@/domain/transit/stops";
import { parseTimeToDate } from "@/domain/time";
import { useTickets } from "@/contexts/TicketContext";

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  /** The scheduled run the passenger tapped "Book" on. */
  trip: Trip;
  onProceedPayment: (selection: JourneySelection) => void;
}

const BookingModal = ({ open, onClose, trip, onProceedPayment }: BookingModalProps) => {
  const { tickets } = useTickets();

  const servedStops = useMemo(() => getTripStops(trip), [trip]);

  const [fromStop, setFromStop] = useState<StopName>(() => servedStops[0]!);
  const [toStop, setToStop] = useState<StopName | "">("");

  const destinations = useMemo(
    () => getDestinationsFrom(trip, fromStop),
    [trip, fromStop]
  );

  const departureTime = getCallTime(trip, fromStop) ?? "";
  const arrivalTime = toStop ? getCallTime(trip, toStop) ?? "" : "";
  const fare = toStop ? calculateFare(fromStop, toStop) : 0;

  const { hasDeparted, conflict } = useMemo(() => {
    if (!toStop) return { hasDeparted: false, conflict: null };

    const departureAt = parseTimeToDate(departureTime);
    const arrivalAt = parseTimeToDate(arrivalTime);

    if (arrivalAt < departureAt) arrivalAt.setDate(arrivalAt.getDate() + 1);

    return {
      hasDeparted: departureAt < new Date(),
      conflict: findConflictingTicket(tickets, departureAt, arrivalAt),
    };
  }, [toStop, departureTime, arrivalTime, tickets]);

  if (!open) return null;

  const blocked = !toStop || hasDeparted || conflict !== null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl p-8 w-full max-w-md mx-4 animate-scale-in"
        style={{ boxShadow: "0 16px 48px hsla(284,33%,30%,0.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-foreground mb-1 tracking-tight">
          Book Your Ticket
        </h2>

        <p className="text-sm text-muted-foreground mb-6">
          Route {trip.routeId} · {departureTime} departure
        </p>

        <label className="block text-sm font-medium text-foreground mb-1">
          From Stop
        </label>
        <select
          value={fromStop}
          onChange={(e) => {
            setFromStop(e.target.value as StopName);
            setToStop("");
          }}
          className="brt-input mb-4"
        >
          {servedStops.map((stop) => (
            <option key={stop} value={stop}>
              {stop}
            </option>
          ))}
        </select>

        <label className="block text-sm font-medium text-foreground mb-1">
          To Stop
        </label>
        <select
          value={toStop}
          onChange={(e) => setToStop(e.target.value as StopName)}
          className="brt-input mb-6"
        >
          <option value="">Select destination</option>
          {destinations.map((stop) => (
            <option key={stop} value={stop}>
              {stop}
            </option>
          ))}
        </select>

        {toStop && (
          <div className="bg-secondary rounded-xl p-4 mb-6">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">From</span>
              <span className="font-medium text-foreground">{fromStop}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">To</span>
              <span className="font-medium text-foreground">{toStop}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Departure</span>
              <span className="font-medium text-foreground">{departureTime}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Arrival</span>
              <span className="font-medium text-foreground">{arrivalTime}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-border mt-2">
              <span className="font-semibold text-foreground">Fare</span>
              <span className="font-bold text-primary text-lg">₹{fare}/-</span>
            </div>
          </div>
        )}

        {hasDeparted && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 mb-4">
            <p className="text-sm text-destructive font-medium">
              This bus has already departed. Please choose a later service.
            </p>
          </div>
        )}

        {conflict && !hasDeparted && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 mb-4">
            <p className="text-sm text-destructive font-medium">
              You already have a ticket from {conflict.fromStop} to {conflict.toStop}{" "}
              that overlaps this journey.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-medium transition-all duration-300 hover:bg-secondary"
          >
            Cancel
          </button>

          <button
            disabled={blocked}
            onClick={() => {
              if (!toStop) return;

              onProceedPayment({
                route: trip.routeId,
                fromStop,
                toStop,
                fare,
                departureTime,
                arrivalTime,
                bookingTime: new Date().toISOString(),
              });
            }}
            className="flex-1 brt-button disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Proceed to Pay
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
