import { useEffect, useState } from "react";
import { rtdb } from "@/firebase";
import { ref, set, remove } from "firebase/database";
import { POLLING, REMOTE_PATHS } from "@/constants/config";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface DriverCoords {
  latitude: number;
  longitude: number;
}

const Driver = () => {
  const { user, role } = useAuth();

  const [isSharing, setIsSharing] = useState(false);
  const [coords, setCoords] = useState<DriverCoords | null>(null);

  const busRefPath = user ? `${REMOTE_PATHS.BUS_LOCATIONS}/${user.uid}` : null;

  useEffect(() => {
    if (!user || role !== "driver" || !isSharing || !busRefPath) return;

    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          setCoords({ latitude, longitude });

          void set(ref(rtdb, busRefPath), {
            lat: latitude,
            lng: longitude,
            name: user.displayName || "Driver",
            email: user.email,
            updatedAt: Date.now(),
          });
        },
        (error) => console.error("Geolocation failed:", error),
        { enableHighAccuracy: true }
      );
    }, POLLING.DRIVER_LOCATION_MS);

    return () => clearInterval(interval);
  }, [user, role, isSharing, busRefPath]);

  const stopSharing = async () => {
    if (!busRefPath) return;

    await remove(ref(rtdb, busRefPath));
    setIsSharing(false);
  };

  if (role !== "driver") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow text-center">
          <h2 className="text-xl font-semibold text-red-500">
            Access Denied
          </h2>
          <p className="mt-2 text-gray-600">
            You are not authorized to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f2ff]">
      <Header />

      <main className="py-20 px-4">
        <div className="max-w-xl mx-auto">

          <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">

            <h1 className="text-2xl font-bold text-[#6b4fa3]">
              Driver Live Tracking
            </h1>

            {/* STATUS */}
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

            {/* COORDS */}
            {coords && (
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                <p>Latitude: {coords.latitude}</p>
                <p>Longitude: {coords.longitude}</p>
              </div>
            )}

            {/* BUTTONS */}
            <div className="flex justify-center gap-4">

              {!isSharing ? (
                <button
                  onClick={() => setIsSharing(true)}
                  className="px-6 py-3 rounded-xl bg-green-600 text-white font-medium shadow hover:bg-green-700 transition"
                >
                  Start Sharing
                </button>
              ) : (
                <button
                  onClick={stopSharing}
                  className="px-6 py-3 rounded-xl bg-red-500 text-white font-medium shadow hover:bg-red-600 transition"
                >
                  Stop Sharing
                </button>
              )}

            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Driver;
