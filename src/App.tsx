import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TicketProvider } from "@/contexts/TicketContext";
import { NotificationProvider } from "@/components/NotificationPopup";
import ArrivalMonitor from "@/components/ArrivalMonitor";

import Home from "./pages/Home";
import Fares from "./pages/Fares";
import Timetable from "./pages/Timetable";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Driver from "./pages/Driver";
import MapPage from "./pages/MapPage";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/** Redirects signed-out visitors to the login page. */
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  return children;
};

/** Keeps signed-in users off the login page. */
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuth();

  if (user) return <Navigate to="/dashboard" replace />;

  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <TicketProvider>
          <NotificationProvider>
            <Toaster />
            <Sonner />

            <BrowserRouter>
              <ArrivalMonitor />

              <Routes>
                {/* Public */}
                <Route path="/" element={<Home />} />
                <Route path="/fares" element={<Fares />} />
                <Route path="/timetable" element={<Timetable />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/map" element={<MapPage />} />

                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />

                <Route
                  path="/driver"
                  element={
                    <ProtectedRoute>
                      <Driver />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </NotificationProvider>
        </TicketProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
