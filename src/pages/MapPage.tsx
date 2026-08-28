import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MAP_CONFIG, POLLING } from "@/constants/config";
import { DEFAULT_MAP_CENTER } from "@/domain/transit/stops";
import { destinationOf, getRoute } from "@/domain/transit/routes";
import { STATE_DESCRIPTIONS, STATE_LABELS } from "@/domain/fleet/state";
import { hasPosition } from "@/domain/fleet/telemetry";
import {
  selectFreshBuses,
  subscribeToBuses,
  type LiveBus,
} from "@/services/locationService";

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
  const [checkedAt, setCheckedAt] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  /*
    Availability is reported through the error callback rather than checked
    up front, because the Realtime Database SDK is now loaded on demand and
    an effect must return its cleanup synchronously.
  */
  useEffect(
    () =>
      subscribeToBuses(
        (next) => {
          setBuses(next);
          setCheckedAt(Date.now());
          setLoading(false);
        },
        () => {
          setFailed(true);
          setLoading(false);
        }
      ),
    []
  );

  /*
    A bus that stops reporting produces no further snapshot, so nothing would
    re-render to retire it. Re-checking against the clock is what makes the
    staleness rule hold while the tab stays open.
  */
  useEffect(() => {
    const interval = setInterval(
      () => setCheckedAt(Date.now()),
      POLLING.BUS_FRESHNESS_MS
    );

    return () => clearInterval(interval);
  }, []);

  const active = useMemo(
    () => selectFreshBuses(buses, checkedAt),
    [buses, checkedAt]
  );

  /*
    Centre on the fleet, falling back to the first stop before any report.

    Only vehicles that actually carry a position count: the contract permits a
    null one, and real feeds publish them, so averaging over the whole fleet
    would drag the centre towards zero.
  */
  const { lat, lng } = useMemo(() => {
    const located = active.filter((vehicle) => hasPosition(vehicle.telemetry));

    if (located.length === 0) return DEFAULT_MAP_CENTER;

    const total = located.reduce(
      (acc, vehicle) => ({
        lat: acc.lat + vehicle.telemetry.lat!,
        lng: acc.lng + vehicle.telemetry.lng!,
      }),
      { lat: 0, lng: 0 }
    );

    return { lat: total.lat / located.length, lng: total.lng / located.length };
  }, [active]);

  const bbox = [
    lng - MAP_CONFIG.BBOX_DELTA_DEG,
    lat - MAP_CONFIG.BBOX_DELTA_DEG,
    lng + MAP_CONFIG.BBOX_DELTA_DEG,
    lat + MAP_CONFIG.BBOX_DELTA_DEG,
  ].join(",");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main id="main-content" tabIndex={-1} className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-center mb-6 text-primary-deep">
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
              🚍 Active Buses: {active.length}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-primary-deep">Active Buses</h2>

            {loading && <p>Loading buses...</p>}

            {!loading && failed && (
              <p className="text-gray-600">
                Live tracking is unavailable right now. Please try again later.
              </p>
            )}

            {!loading && !failed && active.length === 0 && <p>No buses active</p>}

            {!loading && !failed && active.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Bus</th>
                    <th className="text-left">Route</th>
                    <th className="text-left">Towards</th>
                    <th className="text-left">Status</th>
                    <th>Last update</th>
                  </tr>
                </thead>
                <tbody>
                  {active.map(({ telemetry, state }) => (
                      <tr key={telemetry.vehicleId} className="border-b">
                        <td className="py-2">
                          {telemetry.vehicleId}
                          {/*
                            A synthetic vehicle says so, every time it is
                            drawn. Unlabelled, it sits beside the operator's
                            real fares and real timetable as though it were a
                            bus.
                          */}
                          {telemetry.simulated && (
                            <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                              Simulated
                            </span>
                          )}
                        </td>
                        <td>{telemetry.routeId ? getRoute(telemetry.routeId).name : "—"}</td>
                        <td>{telemetry.routeId ? destinationOf(telemetry.routeId) : "—"}</td>
                        <td>
                          {STATE_LABELS[state]}
                          <span className="sr-only"> — {STATE_DESCRIPTIONS[state]}</span>
                        </td>
                        <td className="text-center">
                          {telemetry.observedAt
                            ? new Date(telemetry.observedAt).toLocaleTimeString()
                            : "—"}
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/*
              The honest limit, said out loud rather than left to be assumed.

              A bus reports a coordinate, and matching that to a stop needs
              surveyed stop positions. Ours are a generated lattice, so any
              "next stop" here would be arbitrary - and it is exactly the kind
              of claim a passenger stands in the road acting on.
            */}
            {!loading && !failed && active.length > 0 && (
              <p className="mt-4 text-xs text-muted-foreground">
                Route and destination come from what the bus reports. We do not
                show which stop it reaches next: that needs surveyed stop
                positions, which the corridor does not have yet.
              </p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MapPage;
