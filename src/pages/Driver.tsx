import { useCallback, useEffect, useId, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { POLLING } from "@/constants/config";
import { useAuth } from "@/contexts/AuthContext";
import { toSafeMessage } from "@/domain/auth/errors";
import { PERMISSIONS, can } from "@/domain/auth/permissions";
import { ROUTE_IDS, getRoute, type RouteId } from "@/domain/transit/routes";
import {
  SHARING_MESSAGES,
  interruptionReason,
  sharingHealth,
} from "@/domain/fleet/sharing";
import { useNow } from "@/hooks/use-now";
import { useAnnounce } from "@/components/a11y/LiveAnnouncer";
import {
  isLiveTrackingAvailable,
  publishLocation,
  stopPublishing,
  toBusId,
} from "@/services/locationService";

interface DriverCoords {
  latitude: number;
  longitude: number;
}

/**
 * Driver location broadcasting.
 *
 * The route guard already refuses non-drivers, but the capability is checked
 * again here before any publish. That redundancy is deliberate: a guard
 * decides what renders, this decides what is written.
 */
const Driver = () => {
  const { user, actor } = useAuth();

  const [isSharing, setIsSharing] = useState(false);
  const [routeId, setRouteId] = useState<RouteId>(ROUTE_IDS[0]);
  const [coords, setCoords] = useState<DriverCoords | null>(null);
  const [error, setError] = useState("");

  /*
    Evidence, not intent. The indicator below is driven by when a publish last
    actually succeeded rather than by the Start button, because a background
    tab has its timers clamped and its geolocation suspended - so the old
    boolean showed a green "sharing" light while nothing was being sent.
  */
  const [lastPublishedAt, setLastPublishedAt] = useState<number | null>(null);
  const [wasHidden, setWasHidden] = useState(false);

  // A short tick so an interruption is noticed while the driver is looking at
  // the screen, rather than only when something else happens to re-render.
  const now = useNow(2_000);

  const mayPublish = can(actor, PERMISSIONS.PUBLISH_LOCATION);
  const announce = useAnnounce();
  const routeFieldId = useId();

  useEffect(() => {
    if (!isSharing || !mayPublish) return;

    let cancelled = false;

    const publish = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (cancelled) return;

          const { latitude, longitude } = position.coords;
          setCoords({ latitude, longitude });

          publishLocation(actor, { latitude, longitude }, routeId)
            .then(() => {
              if (cancelled) return;
              setLastPublishedAt(Date.now());
              setWasHidden(false);
            })
            .catch((err) => {
              if (cancelled) return;
              setError(toSafeMessage(err, "Could not share your location."));
              setIsSharing(false);
            });
        },
        (geoError) => {
          if (cancelled) return;

          console.error("Geolocation failed:", geoError);
          setError(
            geoError.code === geoError.PERMISSION_DENIED
              ? "Location permission is required to broadcast your position."
              : "Could not read your location. Please try again."
          );
          setIsSharing(false);
        },
        { enableHighAccuracy: true }
      );
    };

    publish();
    const interval = setInterval(publish, POLLING.DRIVER_LOCATION_MS);

    /*
      Publish again the moment the tab comes back.

      A throttled interval may not fire for another minute, so without this the
      bus stays missing from the map long after the driver has returned to the
      screen. The hidden flag is recorded on the way out so the driver can be
      told what actually happened rather than a generic failure.
    */
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setWasHidden(true);
        return;
      }

      publish();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isSharing, mayPublish, actor, routeId]);

  /**
   * Clears the published position when the driver stops or leaves the page,
   * so a stale marker does not sit on the public map after a shift ends.
   */
  const stop = useCallback(async () => {
    setIsSharing(false);
    setCoords(null);
    setLastPublishedAt(null);
    setWasHidden(false);

    try {
      await stopPublishing(actor);
    } catch (err) {
      console.error("Could not clear published location:", err);
    }
  }, [actor]);

  useEffect(() => {
    return () => {
      void stopPublishing(actor);
    };
  }, [actor]);

  const health = sharingHealth(
    isSharing,
    lastPublishedAt,
    now.getTime(),
    POLLING.DRIVER_LOCATION_MS
  );

  /*
    Announced once per interruption, not on every re-render: the health check
    re-evaluates every two seconds, and re-announcing would talk over the
    driver continuously.
  */
  useEffect(() => {
    if (health !== "interrupted") return;

    announce(
      `Your position is not reaching passengers. ${interruptionReason(wasHidden)}`,
      "assertive"
    );
  }, [health, wasHidden, announce]);

  const startSharing = async () => {
    setError("");

    // Resolves the on-demand Realtime Database load before promising the
    // driver that their position is being broadcast.
    if (!(await isLiveTrackingAvailable())) {
      setError("Live tracking is unavailable right now.");
      return;
    }

    setIsSharing(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main id="main-content" tabIndex={-1} className="py-20 px-4">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">
            <h1 className="text-2xl font-bold text-primary-deep">Driver Live Tracking</h1>

            {user && (
              <p className="text-sm text-gray-500">
                Broadcasting as{" "}
                <span className="font-mono font-medium">{toBusId(user.uid)}</span>
              </p>
            )}

            <div className="text-left">
              <label
                htmlFor={routeFieldId}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Route you are running
              </label>

              <select
                id={routeFieldId}
                value={routeId}
                disabled={isSharing}
                onChange={(event) => setRouteId(event.target.value as RouteId)}
                className="w-full bg-gray-50 rounded-lg px-4 py-2.5 border-2 border-input focus:border-primary transition-colors disabled:opacity-60"
              >
                {ROUTE_IDS.map((id) => (
                  <option key={id} value={id}>
                    {getRoute(id).name} — {getRoute(id).headline}
                  </option>
                ))}
              </select>

              {isSharing && (
                <p className="text-xs text-gray-500 mt-1">
                  Stop sharing to change route.
                </p>
              )}
            </div>

            <div className="flex justify-center items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  health === "sharing"
                    ? "bg-green-500 animate-pulse"
                    : health === "interrupted"
                      ? "bg-destructive"
                      : "bg-gray-400"
                }`}
              />
              <span className="text-sm font-medium">
                {SHARING_MESSAGES[health]}
                {health === "sharing" && ` on ${getRoute(routeId).name}`}
              </span>
            </div>

            {/*
              Spoken through the shared assertive region rather than by a role
              on this box - it does not exist until the interruption does, and
              a live region that appears with its message already inside it is
              not reliably announced. Colour alone certainly cannot carry it.
            */}
            {health === "interrupted" && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-left">
                <p className="text-sm font-semibold text-destructive">
                  Your position is not reaching passengers.
                </p>
                <p className="text-sm text-destructive mt-1">
                  {interruptionReason(wasHidden)}
                </p>
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {coords && (
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                <p>Latitude: {coords.latitude}</p>
                <p>Longitude: {coords.longitude}</p>
              </div>
            )}

            <div className="flex justify-center gap-4">
              {!isSharing ? (
                <button
                  onClick={() => void startSharing()}
                  disabled={!mayPublish}
                  className="px-6 py-3 rounded-xl bg-green-600 text-white font-medium shadow hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Sharing
                </button>
              ) : (
                <button
                  onClick={() => void stop()}
                  className="px-6 py-3 rounded-xl bg-destructive text-white font-medium shadow hover:bg-destructive transition"
                >
                  Stop Sharing
                </button>
              )}
            </div>

            <p className="text-xs text-gray-400">
              Only your coordinates and this bus label are shared. Your name and
              email address are never published.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Driver;
