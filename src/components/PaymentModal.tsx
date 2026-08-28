import { useEffect, useRef, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAnnounce } from "@/components/a11y/LiveAnnouncer";
import { useAuth } from "@/contexts/AuthContext";
import { useTickets } from "@/contexts/TicketContext";
import { PAYMENT_FAILURE_MESSAGES } from "@/domain/payment/types";
import type { JourneySelection, PaymentStatus } from "@/domain/ticket/types";
import { activePaymentProvider } from "@/services/payment/demoProvider";
import { BOOKING_FAILURE_MESSAGES } from "@/services/ticketService";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  /** The journey being paid for. */
  selection: JourneySelection;
  onSuccess: () => void;
}

/*
  Identifies the booking attempt rather than the click, so a double-tapped
  button and a retry after a failure both resolve to the same payment.
*/
const idempotencyKeyFor = (userId: string, selection: JourneySelection): string =>
  [
    userId,
    selection.route,
    selection.fromStop,
    selection.toStop,
    selection.departureTime,
  ].join("|");

const PaymentModal = ({ open, onClose, selection, onSuccess }: PaymentModalProps) => {
  const { user } = useAuth();
  const { validateBooking, issueTicket } = useTickets();
  const announce = useAnnounce();

  const provider = activePaymentProvider();

  const [status, setStatus] = useState<PaymentStatus>("PENDING");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  const successRef = useRef<HTMLButtonElement>(null);

  const { fromStop, toStop, fare, departureTime, arrivalTime } = selection;

  /** A payment in flight must not be interrupted by Escape or a click-away. */
  const isProcessing = status === "PROCESSING";

  useEffect(() => {
    if (open) {
      setStatus("PENDING");
      setError("");
      setWarning("");
    }
  }, [open]);

  /**
   * Moves focus onto the confirmation once payment succeeds.
   *
   * Without this a keyboard user is left on a button that no longer exists
   * and focus falls back to the document body.
   */
  useEffect(() => {
    if (status === "SUCCESS") successRef.current?.focus();
  }, [status]);

  const handlePay = async () => {
    if (!user) {
      setError("You must be signed in to complete this payment.");
      setStatus("FAILED");
      announce("Payment failed. You must be signed in.", "assertive");
      return;
    }

    /*
      Every booking rule is applied before the provider is called. Running
      them afterwards is what allowed a passenger to be charged and then
      refused a ticket.
    */
    const validation = validateBooking({
      ...selection,
      userId: user.uid,
      userEmail: user.email ?? "",
    });

    if (!validation.ok) {
      const message = BOOKING_FAILURE_MESSAGES[validation.reason];
      setError(message);
      setStatus("FAILED");
      announce(`Booking failed. ${message}`, "assertive");
      return;
    }

    setStatus("PROCESSING");
    announce("Processing your payment, please wait.");

    try {
      const outcome = await provider.pay(
        fare,
        idempotencyKeyFor(user.uid, selection)
      );

      if (!outcome.ok) {
        const message = PAYMENT_FAILURE_MESSAGES[outcome.reason];
        setError(message);
        setStatus("FAILED");
        announce(`Payment failed. ${message}`, "assertive");
        return;
      }

      // Past this point the passenger owns the ticket, so issuing cannot
      // refuse. A storage failure is reported without destroying it.
      const issued = await issueTicket(validation.ticket);

      setStatus("SUCCESS");
      setWarning(
        issued.persisted
          ? ""
          : "Your ticket could not be saved to this device, so it may not be here later."
      );
      announce(
        `Payment successful. Your ticket from ${fromStop} to ${toStop} is confirmed.`
      );
    } catch (err) {
      console.error("Payment failed:", err);
      setError("Could not complete your payment. Please try again.");
      setStatus("FAILED");
      announce("Payment failed. Please try again.", "assertive");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isProcessing) onClose();
      }}
    >
      <DialogContent
        className="max-w-md rounded-2xl"
        hideClose={isProcessing}
        onEscapeKeyDown={(event) => {
          if (isProcessing) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (isProcessing) event.preventDefault();
        }}
      >
        {status === "PENDING" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Payment</DialogTitle>
              <DialogDescription>
                Review your journey, then confirm to receive your virtual ticket.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-secondary rounded-xl p-4">
              <p className="font-semibold">
                {fromStop} <span aria-hidden="true">→</span>
                <span className="sr-only">to</span> {toStop}
              </p>
              <p className="text-sm">
                {departureTime} <span aria-hidden="true">-</span>
                <span className="sr-only">until</span> {arrivalTime}
              </p>
              <p className="text-2xl font-bold text-primary mt-2">₹{fare}/-</p>
            </div>

            {!provider.settlesRealMoney && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <ShieldAlert
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="font-semibold">No payment will be taken</p>
                  <p className="text-sm mt-0.5">
                    This service is not connected to a payment provider. Confirming
                    issues a demonstration ticket and moves no money. Pay the
                    conductor on board as usual.
                  </p>
                </div>
              </div>
            )}

            <button type="button" onClick={handlePay} className="w-full brt-button touch-target">
              {provider.settlesRealMoney
                ? `Pay ₹${fare}`
                : `Issue a demonstration ticket for ₹${fare}`}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-sm text-muted-foreground touch-target"
            >
              Cancel
            </button>
          </>
        )}

        {isProcessing && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Processing payment</DialogTitle>
              <DialogDescription>
                This will only take a moment. Please do not close this window.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center py-8">
              <Loader2
                className="w-12 h-12 text-primary animate-spin mb-4"
                aria-hidden="true"
              />
              <p>Processing payment…</p>
            </div>
          </>
        )}

        {status === "SUCCESS" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Payment successful</DialogTitle>
              <DialogDescription>
                Your ticket from {fromStop} to {toStop} is confirmed.
              </DialogDescription>
            </DialogHeader>

            {!provider.settlesRealMoney && (
              <p className="text-sm text-muted-foreground text-center">
                Demonstration ticket. No payment was taken.
              </p>
            )}

            {warning && (
              <p role="status" className="text-sm text-amber-900 text-center">
                {warning}
              </p>
            )}

            <div className="flex flex-col items-center py-6">
              <span className="text-4xl mb-3" aria-hidden="true">
                🎉
              </span>

              <button
                ref={successRef}
                type="button"
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="brt-button touch-target"
              >
                View my ticket
              </button>
            </div>
          </>
        )}

        {status === "FAILED" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl text-destructive">
                Payment failed
              </DialogTitle>
              <DialogDescription>
                {error || "Something went wrong while processing your payment."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex gap-3 justify-center py-4">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-border text-foreground font-medium transition-colors duration-150 hover:bg-secondary touch-target"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => setStatus("PENDING")}
                className="brt-button touch-target"
              >
                Try again
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
