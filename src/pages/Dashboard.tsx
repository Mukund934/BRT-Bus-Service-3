import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS, can } from "@/domain/auth/permissions";
import UserDashboard from "@/components/dashboards/UserDashboard";
import DriverDashboard from "@/components/dashboards/DriverDashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import { AlertCircle, Loader } from "lucide-react";

const Dashboard = () => {
  const { user, actor, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div
        className="min-h-screen bg-[#f4f2ff] flex items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-[#874f9c] animate-spin" aria-hidden="true" />
          <p className="text-[#6b4fa3] font-medium">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f4f2ff]">
        <Header />
        <main id="main-content" tabIndex={-1} className="py-24 px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl p-10 shadow-lg border-2 border-purple-100">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-orange-500" aria-hidden="true" />
                <h1 className="text-xl font-semibold text-[#6b4fa3]">
                  Sign in required
                </h1>
              </div>
              <p className="text-gray-600 mb-6">
                You need to log in to access the dashboard. Please authenticate to continue.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                Go to Login
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f2ff] to-white">
      <Header />

      <main id="main-content" tabIndex={-1} className="py-8 px-4">
        {error && (
          <div
            role="alert"
            className="max-w-5xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" aria-hidden="true" />
            <p className="text-red-800">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800 font-medium touch-target px-2"
            >
              Dismiss
              <span className="sr-only"> error message</span>
            </button>
          </div>
        )}

        {/*
          Chosen by capability rather than by role string, so an unresolved
          or unrecognised role falls through to the least-privileged view
          instead of matching nothing or defaulting to something elevated.
        */}
        {can(actor, PERMISSIONS.VIEW_ADMIN_PANEL) ? (
          <AdminDashboard onError={setError} />
        ) : can(actor, PERMISSIONS.PUBLISH_LOCATION) ? (
          <DriverDashboard />
        ) : (
          <UserDashboard />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
