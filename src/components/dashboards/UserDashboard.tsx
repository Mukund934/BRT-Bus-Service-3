import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BookOpen, History, IndianRupee, Route, Ticket } from "lucide-react";
import VirtualTicket from "@/components/VirtualTicket";
import { useAnnounce } from "@/components/a11y/LiveAnnouncer";
import { useAuth } from "@/contexts/AuthContext";
import { useTickets } from "@/contexts/TicketContext";
import { STATUS_LABELS } from "@/domain/ticket/status";
import type { TicketStatus } from "@/domain/ticket/types";
import { formatDate } from "@/domain/time";

type HistoryFilter = "ALL" | "COMPLETED" | "CANCELLED";

const FILTERS: HistoryFilter[] = ["ALL", "COMPLETED", "CANCELLED"];

const HISTORY_STYLES: Partial<Record<TicketStatus, string>> = {
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-200 text-gray-700",
};

const getInitials = (name?: string | null): string => {
  if (!name) return "U";

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const UserDashboard = () => {
  const { user } = useAuth();
  const { activeTicket, ticketHistory, stats, cancelTicket } = useTickets();
  const navigate = useNavigate();
  const announce = useAnnounce();

  const [filter, setFilter] = useState<HistoryFilter>("ALL");

  /**
   * Cancelling removes the ticket from view, so without an explicit
   * confirmation the only feedback is that something vanished.
   */
  const handleCancel = useCallback(
    (ticketId: string) => {
      cancelTicket(ticketId);
      toast.success("Ticket cancelled.");
      announce("Your ticket has been cancelled.");
    },
    [cancelTicket, announce]
  );

  const visibleHistory = useMemo(
    () =>
      filter === "ALL"
        ? ticketHistory
        : ticketHistory.filter((ticket) => ticket.status === filter),
    [filter, ticketHistory]
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center text-2xl font-bold">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(user?.displayName)
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {user?.displayName || "Passenger"}
            </h1>
            <p className="text-gray-600">{user?.email}</p>
            <p className="text-sm text-purple-600 font-semibold mt-1">👤 Passenger</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-1">
              <History className="w-4 h-4 text-purple-600" />
              <p className="text-xs text-gray-600">Trips Completed</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.tripsCompleted}</p>
          </div>

          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="w-4 h-4 text-purple-600" />
              <p className="text-xs text-gray-600">Total Spent</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">₹{stats.totalSpent}/-</p>
          </div>

          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-1">
              <Route className="w-4 h-4 text-purple-600" />
              <p className="text-xs text-gray-600">Favourite Route</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.favouriteRoute ?? "—"}
            </p>
          </div>
        </div>

        <div className="border-t pt-8">
          <div className="flex items-center gap-2 mb-6">
            <Ticket className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Your Ticket</h2>
          </div>

          {activeTicket ? (
            <VirtualTicket ticket={activeTicket} onCancel={handleCancel} />
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium mb-1">No active tickets</p>
              <p className="text-sm text-gray-500 mb-4">
                Book a seat from the timetable and your ticket will appear here.
              </p>
              <button
                onClick={() => navigate("/timetable")}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
              >
                Book a Ticket
              </button>
            </div>
          )}
        </div>

        <div className="border-t pt-8 mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <History className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">Ticket History</h2>
            </div>

            {/*
              A single-select group: aria-pressed tells a screen reader which
              filter is currently applied, which colour alone cannot.
            */}
            <div className="flex gap-2" role="group" aria-label="Filter ticket history">
              {FILTERS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  aria-pressed={filter === option}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    filter === option
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {option.charAt(0) + option.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {visibleHistory.length ? (
            <ul className="space-y-3">
              {visibleHistory.map((ticket) => (
                <li
                  key={ticket.ticketId}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {ticket.fromStop} → {ticket.toStop}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      {ticket.ticketId}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-700">
                      {ticket.departureTime} - {ticket.arrivalTime}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(ticket.travelDate)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">₹{ticket.fare}/-</span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        HISTORY_STYLES[ticket.status] ?? "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {STATUS_LABELS[ticket.status]}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <History className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">
                {filter === "ALL"
                  ? "No past journeys yet"
                  : `No ${filter.toLowerCase()} tickets`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
