import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { PAYMENT_CONFIG, QR_CONFIG } from "@/constants/config";
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

  const [status, setStatus] = useState<PaymentStatus>("PENDING");
  const [error, setError] = useState("");

  const { fromStop, toStop, fare, departureTime, arrivalTime } = selection;

  useEffect(() => {
    if (open) {
      setStatus("PENDING");
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const handlePay = async () => {
    if (!user) {
      setError("You must be logged in to complete this payment.");
      setStatus("FAILED");
      return;
    }

    setStatus("PROCESSING");

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
        setError(BOOKING_FAILURE_MESSAGES[result.reason]);
        setStatus("FAILED");
        return;
      }

      setStatus("SUCCESS");
    } catch (err) {
      console.error("Payment failed:", err);
      setError("Could not save your ticket. Please try again.");
      setStatus("FAILED");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={() => {
        if (status !== "PROCESSING") onClose();
      }}
    >
      <div
        className="bg-card rounded-2xl p-8 w-full max-w-md mx-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {status === "PENDING" && (
          <>
            <h2 className="text-xl font-bold mb-2">Payment</h2>

            <div className="bg-secondary rounded-xl p-4 mb-6">
              <p className="font-semibold">
                {fromStop} → {toStop}
              </p>
              <p className="text-sm">
                {departureTime} - {arrivalTime}
              </p>
              <p className="text-2xl font-bold text-primary mt-2">₹{fare}/-</p>
            </div>

            <div className="flex justify-center mb-6">
              <QRCodeSVG value={buildUpiLink(fare)} size={QR_CONFIG.PAYMENT_SIZE} />
            </div>

            <button onClick={handlePay} className="w-full brt-button">
              Simulate Payment ₹{fare}
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 mt-2 text-sm text-muted-foreground"
            >
              Cancel
            </button>
          </>
        )}

        {status === "PROCESSING" && (
          <div className="flex flex-col items-center py-8">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
            <p>Processing Payment...</p>
          </div>
        )}

        {status === "SUCCESS" && (
          <div className="flex flex-col items-center py-8">
            <h3 className="text-xl font-bold mb-3">Payment Successful 🎉</h3>

            <button
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="brt-button"
            >
              View My Ticket
            </button>
          </div>
        )}

        {status === "FAILED" && (
          <div className="flex flex-col items-center py-8">
            <h3 className="text-xl font-bold mb-3 text-red-500">Payment Failed</h3>

            <p className="text-sm text-muted-foreground text-center mb-5">
              {error || "Something went wrong while processing your payment."}
            </p>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-border text-foreground font-medium transition-all duration-300 hover:bg-secondary"
              >
                Close
              </button>

              <button onClick={() => setStatus("PENDING")} className="brt-button">
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
