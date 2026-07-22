import { useEffect, useMemo, useState } from "react";
import { off, onValue, ref, type DataSnapshot } from "firebase/database";
import { rtdb } from "@/firebase";
import { MAP_CONFIG, REMOTE_PATHS } from "@/constants/config";
import { DEFAULT_MAP_CENTER } from "@/domain/transit/stops";
import type { BusPosition } from "@/services/notificationService";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const MapPage = () => {
  const [buses, setBuses] = useState<Record<string, BusPosition>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const busRef = ref(rtdb, REMOTE_PATHS.BUS_LOCATIONS);

    const handleValue = (snapshot: DataSnapshot) => {
      setBuses(snapshot.exists() ? snapshot.val() : {});
      setLoading(false);
    };

    onValue(busRef, handleValue);

    return () => off(busRef, "value", handleValue);
  }, []);

  const busArray = useMemo(() => Object.values(buses), [buses]);

  /** Centre on the fleet, falling back to the first stop before any bus reports. */
  const { lat, lng } = useMemo(() => {
    if (busArray.length === 0) return DEFAULT_MAP_CENTER;

    const total = busArray.reduce(
      (acc, bus) => ({ lat: acc.lat + bus.lat, lng: acc.lng + bus.lng }),
      { lat: 0, lng: 0 }
    );

    return { lat: total.lat / busArray.length, lng: total.lng / busArray.length };
  }, [busArray]);

  const bbox = [
    lng - MAP_CONFIG.BBOX_DELTA_DEG,
    lat - MAP_CONFIG.BBOX_DELTA_DEG,
    lng + MAP_CONFIG.BBOX_DELTA_DEG,
    lat + MAP_CONFIG.BBOX_DELTA_DEG,
  ].join(",");

  return (
    <div className="min-h-screen bg-[#f4f2ff]">
      <Header />

      <main className="py-20 px-4">
        <div className="max-w-6xl mx-auto">

          <h1 className="text-2xl font-bold text-center mb-6 text-[#6b4fa3]">
            Live Bus Tracking
          </h1>

          {/* 🔥 MAP */}
          <div className="w-full h-[400px] rounded-xl overflow-hidden shadow mb-4 relative">
            
            <iframe
              title="Live bus locations"
              width="100%"
              height="100%"
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`}
            />

            {/* 🔥 Overlay info */}
            <div className="absolute top-3 left-3 bg-white px-3 py-1 rounded shadow text-sm">
              🚍 Active Buses: {busArray.length}
            </div>
          </div>

          {/* 🔥 TABLE */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-[#6b4fa3]">
              Active Buses
            </h2>

            {loading && <p>Loading buses...</p>}

            {!loading && busArray.length === 0 && (
              <p>No buses active</p>
            )}

            {!loading && busArray.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Driver</th>
                    <th>Email</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                  </tr>
                </thead>
                <tbody>
                  {busArray.map((bus, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2">{bus.name}</td>
                      <td>{bus.email}</td>
                      <td>{bus.lat}</td>
                      <td>{bus.lng}</td>
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
