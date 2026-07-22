import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import { TicketProvider } from "@/contexts/TicketContext";
import { NotificationProvider } from "@/components/NotificationPopup";
import ArrivalMonitor from "@/components/ArrivalMonitor";
import { LiveAnnouncer } from "@/components/a11y/LiveAnnouncer";
import { RouteChangeHandler } from "@/components/a11y/RouteChangeHandler";
import {
  RedirectIfAuthenticated,
  RequireAuth,
  RequirePermission,
} from "@/components/routing/RouteGuards";
import { PERMISSIONS } from "@/domain/auth/permissions";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <TicketProvider>
          <LiveAnnouncer>
            <NotificationProvider>
              <Toaster />
              <Sonner />

              <BrowserRouter>
                <RouteChangeHandler />

                {/*
                  First focusable element on every page, so a keyboard user
                  can jump straight past the navigation.
                */}
                <a href="#main-content" className="skip-link">
                  Skip to main content
                </a>

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
                      <RedirectIfAuthenticated>
                        <Login />
                      </RedirectIfAuthenticated>
                    }
                  />

                  {/*
                    Previously any signed-in user could reach /driver and the
                    page policed itself. The capability is now checked before
                    the page is ever rendered.
                  */}
                  <Route
                    path="/driver"
                    element={
                      <RequirePermission permission={PERMISSIONS.PUBLISH_LOCATION}>
                        <Driver />
                      </RequirePermission>
                    }
                  />

                  <Route
                    path="/dashboard"
                    element={
                      <RequireAuth>
                        <Dashboard />
                      </RequireAuth>
                    }
                  />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </NotificationProvider>
          </LiveAnnouncer>
        </TicketProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
