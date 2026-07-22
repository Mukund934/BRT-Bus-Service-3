import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MAP_CONFIG } from "@/constants/config";
import { DEFAULT_MAP_CENTER } from "@/domain/transit/stops";
import { subscribeToBuses, type LiveBus } from "@/services/locationService";
import { isLiveTrackingAvailable } from "@/firebase";

/**
 * Public live-tracking map.
 *
 * This page is deliberately reachable without signing in, which is why the
 * table below shows only an opaque bus label and coordinates. The driver
 * names and email addresses it used to display were personal data on a
 * world-readable page; they are no longer published at all.
 */
const MapPage = () => {
  const [buses, setBuses] = useState<LiveBus[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isLiveTrackingAvailable) {
      setLoading(false);
      setFailed(true);
      return;
    }

    return subscribeToBuses(
      (next) => {
        setBuses(next);
        setLoading(false);
      },
      () => {
        setFailed(true);
        setLoading(false);
      }
    );
  }, []);

  /** Centre on the fleet, falling back to the first stop before any report. */
  const { lat, lng } = useMemo(() => {
    if (buses.length === 0) return DEFAULT_MAP_CENTER;

    const total = buses.reduce(
      (acc, bus) => ({ lat: acc.lat + bus.lat, lng: acc.lng + bus.lng }),
      { lat: 0, lng: 0 }
    );

    return { lat: total.lat / buses.length, lng: total.lng / buses.length };
  }, [buses]);

  const bbox = [
    lng - MAP_CONFIG.BBOX_DELTA_DEG,
    lat - MAP_CONFIG.BBOX_DELTA_DEG,
    lng + MAP_CONFIG.BBOX_DELTA_DEG,
    lat + MAP_CONFIG.BBOX_DELTA_DEG,
  ].join(",");

  return (
    <div className="min-h-screen bg-[#f4f2ff]">
      <Header />

      <main id="main-content" tabIndex={-1} className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-center mb-6 text-[#6b4fa3]">
            Live Bus Tracking
          </h1>

          <div className="w-full h-[400px] rounded-xl overflow-hidden shadow mb-4 relative">
            <iframe
              title="Live bus locations"
              width="100%"
              height="100%"
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`}
            />

            <div className="absolute top-3 left-3 bg-white px-3 py-1 rounded shadow text-sm">
              🚍 Active Buses: {buses.length}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-[#6b4fa3]">Active Buses</h2>

            {loading && <p>Loading buses...</p>}

            {!loading && failed && (
              <p className="text-gray-600">
                Live tracking is unavailable right now. Please try again later.
              </p>
            )}

            {!loading && !failed && buses.length === 0 && <p>No buses active</p>}

            {!loading && !failed && buses.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Bus</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th>Last update</th>
                  </tr>
                </thead>
                <tbody>
                  {buses.map((bus) => (
                    <tr key={bus.busId} className="border-b">
                      <td className="py-2">{bus.busId}</td>
                      <td>{bus.lat.toFixed(5)}</td>
                      <td>{bus.lng.toFixed(5)}</td>
                      <td>
                        {bus.updatedAt
                          ? new Date(bus.updatedAt).toLocaleTimeString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MapPage;
