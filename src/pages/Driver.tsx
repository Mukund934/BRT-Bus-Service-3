import { useCallback, useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { POLLING } from "@/constants/config";
import { useAuth } from "@/contexts/AuthContext";
import { toSafeMessage } from "@/domain/auth/errors";
import { PERMISSIONS, can } from "@/domain/auth/permissions";
import { isLiveTrackingAvailable } from "@/firebase";
import { publishLocation, stopPublishing, toBusId } from "@/services/locationService";

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
  const [coords, setCoords] = useState<DriverCoords | null>(null);
  const [error, setError] = useState("");

  const mayPublish = can(actor, PERMISSIONS.PUBLISH_LOCATION);

  useEffect(() => {
    if (!isSharing || !mayPublish) return;

    let cancelled = false;

    const publish = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (cancelled) return;

          const { latitude, longitude } = position.coords;
          setCoords({ latitude, longitude });

          publishLocation(actor, { latitude, longitude }).catch((err) => {
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

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isSharing, mayPublish, actor]);

  /**
   * Clears the published position when the driver stops or leaves the page,
   * so a stale marker does not sit on the public map after a shift ends.
   */
  const stop = useCallback(async () => {
    setIsSharing(false);
    setCoords(null);

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

  const startSharing = () => {
    setError("");

    if (!isLiveTrackingAvailable) {
      setError("Live tracking is unavailable right now.");
      return;
    }

    setIsSharing(true);
  };

  return (
    <div className="min-h-screen bg-[#f4f2ff]">
      <Header />

      <main id="main-content" tabIndex={-1} className="py-20 px-4">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">
            <h1 className="text-2xl font-bold text-[#6b4fa3]">Driver Live Tracking</h1>

            {user && (
              <p className="text-sm text-gray-500">
                Broadcasting as{" "}
                <span className="font-mono font-medium">{toBusId(user.uid)}</span>
              </p>
            )}

            <div className="flex justify-center items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  isSharing ? "bg-green-500 animate-pulse" : "bg-gray-400"
                }`}
              />
              <span className="text-sm font-medium">
                {isSharing ? "Sharing Live Location" : "Not Sharing"}
              </span>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
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
                  onClick={startSharing}
                  disabled={!mayPublish}
                  className="px-6 py-3 rounded-xl bg-green-600 text-white font-medium shadow hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Sharing
                </button>
              ) : (
                <button
                  onClick={() => void stop()}
                  className="px-6 py-3 rounded-xl bg-red-500 text-white font-medium shadow hover:bg-red-600 transition"
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
