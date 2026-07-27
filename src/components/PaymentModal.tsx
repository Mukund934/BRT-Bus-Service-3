import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PAYMENT_CONFIG, QR_CONFIG } from "@/constants/config";
import { useAnnounce } from "@/components/a11y/LiveAnnouncer";
import { useAuth } from "@/contexts/AuthContext";
import { useTickets } from "@/contexts/TicketContext";
import type { JourneySelection, PaymentStatus } from "@/domain/ticket/types";
import { BOOKING_FAILURE_MESSAGES } from "@/services/ticketService";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  /** The journey being paid for. */
  selection: JourneySelection;
  onSuccess: () => void;
}

/** UPI deep link for the simulated payment QR. */
const buildUpiLink = (amount: number): string =>
  `upi://pay?pa=${PAYMENT_CONFIG.UPI_VPA}&pn=${PAYMENT_CONFIG.UPI_PAYEE}` +
  `&am=${amount}&cu=${PAYMENT_CONFIG.CURRENCY}`;

const PaymentModal = ({ open, onClose, selection, onSuccess }: PaymentModalProps) => {
  const { user } = useAuth();
  const { bookTicket } = useTickets();
  const announce = useAnnounce();

  const [status, setStatus] = useState<PaymentStatus>("PENDING");
  const [error, setError] = useState("");

  const successRef = useRef<HTMLButtonElement>(null);

  const { fromStop, toStop, fare, departureTime, arrivalTime } = selection;

  /** A payment in flight must not be interrupted by Escape or a click-away. */
  const isProcessing = status === "PROCESSING";

  useEffect(() => {
    if (open) {
      setStatus("PENDING");
      setError("");
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

    setStatus("PROCESSING");
    announce("Processing your payment, please wait.");

    try {
      await new Promise((resolve) =>
        setTimeout(resolve, PAYMENT_CONFIG.SIMULATED_DELAY_MS)
      );

      const result = bookTicket({
        ...selection,
        userId: user.uid,
        userEmail: user.email ?? "",
      });

      if (!result.ok) {
        const message = BOOKING_FAILURE_MESSAGES[result.reason];
        setError(message);
        setStatus("FAILED");
        announce(`Payment failed. ${message}`, "assertive");
        return;
      }

      setStatus("SUCCESS");
      announce(
        `Payment successful. Your ticket from ${fromStop} to ${toStop} is confirmed.`
      );
    } catch (err) {
      console.error("Payment failed:", err);
      setError("Could not save your ticket. Please try again.");
      setStatus("FAILED");
      announce("Payment failed. Could not save your ticket.", "assertive");
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

            <div className="flex justify-center">
              <div
                role="img"
                aria-label={`UPI payment QR code for ${fare} rupees`}
                className="bg-white p-2 rounded-lg"
              >
                <QRCodeSVG value={buildUpiLink(fare)} size={QR_CONFIG.PAYMENT_SIZE} />
              </div>
            </div>

            <button type="button" onClick={handlePay} className="w-full brt-button touch-target">
              Simulate payment of ₹{fare}
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
                className="px-5 py-2.5 rounded-xl border border-border text-foreground font-medium transition-all duration-300 hover:bg-secondary touch-target"
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
