import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useUser } from "@/contexts/UserContext";
import { PaymentStatus } from "@/types/ticket";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  route: string;
  fromStop: string;
  toStop: string;
  fare: number;
  departureTime: string;
  arrivalTime: string;
  bookingTime: string; // ✅ ADDED
  onSuccess: () => void;
}

const PaymentModal = ({
  open,
  onClose,
  route,
  fromStop,
  toStop,
  fare,
  departureTime,
  arrivalTime,
  bookingTime, // ✅ ADDED
  onSuccess,
}: PaymentModalProps) => {
  const { user, bookTicket } = useUser();
  const [status, setStatus] = useState<PaymentStatus>("PENDING");
  const [error, setError] = useState("");

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
      await new Promise((r) => setTimeout(r, 2000));

      const ticket = bookTicket({
        userId: user.uid,
        userEmail: user.email || "",
        route,
        fromStop,
        toStop,
        fare,
        departureTime,
        arrivalTime,
        bookingTime,
      });

      if (!ticket) {
        setError(
          "We could not confirm this booking. The service may have departed, you may already have an overlapping ticket, or your device storage is full."
        );
        setStatus("FAILED");
        return;
      }

      setStatus("SUCCESS");
    } catch (err) {
      console.error("Payment error:", err);
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
              <p className="text-2xl font-bold text-primary mt-2">
                ₹{fare}/-
              </p>
            </div>

            <div className="flex justify-center mb-6">
              <QRCodeSVG
                value={`upi://pay?pa=brtbus@upi&pn=BRT Bus&am=${fare}&cu=INR`}
                size={140}
              />
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
            <h3 className="text-xl font-bold mb-3">
              Payment Successful 🎉
            </h3>

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
            <h3 className="text-xl font-bold mb-3 text-red-500">
              Payment Failed
            </h3>

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

              <button
                onClick={() => setStatus("PENDING")}
                className="brt-button"
              >
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