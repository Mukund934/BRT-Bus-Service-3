import { useUser } from "@/contexts/UserContext";
import { Ticket, BookOpen, History, IndianRupee, Route } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import VirtualTicket from "@/components/VirtualTicket";
import { TicketStatus } from "@/types/ticket";

interface UserDashboardProps {
  onError?: (error: string) => void;
}

type HistoryFilter = "ALL" | "COMPLETED" | "CANCELLED";

const FILTERS: HistoryFilter[] = ["ALL", "COMPLETED", "CANCELLED"];

const HISTORY_STYLES: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-200 text-gray-700",
};

const UserDashboard = (_props: UserDashboardProps) => {
  const { user, activeTicket, ticketHistory, cancelTicket } = useUser();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<HistoryFilter>("ALL");

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const completed = ticketHistory.filter((t) => t.status === "COMPLETED");
  const totalSpent = completed.reduce((sum, t) => sum + t.fare, 0);
  const favouriteRoute = completed.length ? completed[0]?.route : "—";

  const visibleHistory =
    filter === "ALL"
      ? ticketHistory
      : ticketHistory.filter((t) => t.status === (filter as TicketStatus));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
        {/* User Info */}
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
            <h1 className="text-3xl font-bold text-gray-900">{user?.displayName || "Passenger"}</h1>
            <p className="text-gray-600">{user?.email}</p>
            <p className="text-sm text-purple-600 font-semibold mt-1">👤 Passenger</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-1">
              <History className="w-4 h-4 text-purple-600" />
              <p className="text-xs text-gray-600">Trips Completed</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{completed.length}</p>
          </div>

          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="w-4 h-4 text-purple-600" />
              <p className="text-xs text-gray-600">Total Spent</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">₹{totalSpent}/-</p>
          </div>

          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-1">
              <Route className="w-4 h-4 text-purple-600" />
              <p className="text-xs text-gray-600">Favourite Route</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{favouriteRoute}</p>
          </div>
        </div>

        {/* Active Ticket Section */}
        <div className="border-t pt-8">
          <div className="flex items-center gap-2 mb-6">
            <Ticket className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Your Ticket</h2>
          </div>

          {activeTicket ? (
            <VirtualTicket ticket={activeTicket} onCancel={cancelTicket} />
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

        {/* History */}
        <div className="border-t pt-8 mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <History className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">Ticket History</h2>
            </div>

            <div className="flex gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    filter === f
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {visibleHistory.length ? (
            <div className="space-y-3">
              {visibleHistory.map((t) => (
                <div
                  key={t.ticketId}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {t.fromStop} → {t.toStop}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">{t.ticketId}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-700">
                      {t.departureTime} - {t.arrivalTime}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(t.travelDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">₹{t.fare}/-</span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        HISTORY_STYLES[t.status] || "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {t.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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