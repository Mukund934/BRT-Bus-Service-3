import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Check, Copy, Download } from "lucide-react";
import { POLLING, QR_CONFIG } from "@/constants/config";
import { STATUS_LABELS, isLiveStatus } from "@/domain/ticket/status";
import type { Ticket, TicketStatus } from "@/domain/ticket/types";
import { formatCountdown } from "@/domain/time";

interface VirtualTicketProps {
  ticket: Ticket;
  onCancel?: (ticketId: string) => void;
}

/** Presentation only - the labels themselves come from the domain. */
const STATUS_STYLES: Record<TicketStatus, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-100",
  ACTIVE: "bg-green-500/20 text-green-200",
  BOARDING_SOON: "bg-amber-500/20 text-amber-100",
  IN_TRANSIT: "bg-blue-500/20 text-blue-100",
  COMPLETED: "bg-slate-500/20 text-slate-100",
  CANCELLED: "bg-red-500/20 text-red-200",
};

const VirtualTicket = ({ ticket, onCancel }: VirtualTicketProps) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const live = isLiveStatus(ticket.status);

  useEffect(() => {
    if (!live) {
      setTimeLeft("");
      return;
    }

    const update = () => {
      const remaining = new Date(ticket.expiresAt).getTime() - Date.now();
      setTimeLeft(remaining <= 0 ? "Expired" : formatCountdown(remaining));
    };

    update();
    const interval = setInterval(update, POLLING.TICKET_COUNTDOWN_MS);

    return () => clearInterval(interval);
  }, [ticket.expiresAt, live]);

  useEffect(() => {
    if (!copied) return;

    const timer = setTimeout(() => setCopied(false), 2000);

    return () => clearTimeout(timer);
  }, [copied]);

  const copyBookingId = async () => {
    try {
      await navigator.clipboard.writeText(ticket.ticketId);
      setCopied(true);
    } catch (error) {
      console.error("Failed to copy booking id:", error);
    }
  };

  const downloadQr = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `${ticket.ticketId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="ticket-card animate-fade-in">
      <div className="ticket-header">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest opacity-80">
              BRT Bus Service
            </p>
            <p className="text-lg font-bold tracking-tight">Route {ticket.route}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              STATUS_STYLES[ticket.status]
            }`}
          >
            {STATUS_LABELS[ticket.status]}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              From
            </p>
            <p className="font-bold text-foreground text-lg">{ticket.fromStop}</p>
          </div>
          <div className="flex items-center px-3 pt-2">
            <span className="text-primary text-xl">→</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              To
            </p>
            <p className="font-bold text-foreground text-lg">{ticket.toStop}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div>
            <p className="text-xs text-muted-foreground">Departure</p>
            <p className="font-semibold text-foreground text-sm">
              {ticket.departureTime}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Arrival</p>
            <p className="font-semibold text-foreground text-sm">
              {ticket.arrivalTime}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Fare Paid</p>
            <p className="font-bold text-primary text-sm">₹{ticket.fare}/-</p>
          </div>
        </div>

        {live && (
          <div className="bg-secondary rounded-xl p-3 mb-5 text-center">
            <p className="text-xs text-muted-foreground mb-1">Valid for</p>
            <p className="text-xl font-bold text-primary tabular-nums tracking-wider">
              {timeLeft}
            </p>
          </div>
        )}

        <div className="flex flex-col items-center">
          <div
            ref={qrRef}
            className={`bg-white p-3 rounded-xl border border-border mb-2 ${
              live ? "" : "opacity-40 grayscale"
            }`}
          >
            <QRCodeCanvas
              value={ticket.qrData}
              size={QR_CONFIG.TICKET_SIZE}
              level={QR_CONFIG.ERROR_CORRECTION}
            />
          </div>

          <button
            onClick={copyBookingId}
            className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono hover:text-primary transition-colors"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {ticket.ticketId}
          </button>

          <div className="flex gap-3 mt-4">
            <button
              onClick={downloadQr}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground transition-all duration-300 hover:bg-secondary"
            >
              <Download className="w-3.5 h-3.5" />
              Save QR
            </button>

            {live && onCancel && (
              <button
                onClick={() => onCancel(ticket.ticketId)}
                className="px-3 py-1.5 rounded-lg border border-destructive/40 text-xs font-medium text-destructive transition-all duration-300 hover:bg-destructive/10"
              >
                Cancel Ticket
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualTicket;
