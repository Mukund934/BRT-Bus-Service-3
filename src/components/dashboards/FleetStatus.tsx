import { useEffect, useMemo, useState } from "react";
import { Bus, RadioTower } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS, can } from "@/domain/auth/permissions";
import { POLLING } from "@/constants/config";
import { destinationOf, getRoute } from "@/domain/transit/routes";
import type { VehicleTelemetry } from "@/domain/fleet/telemetry";
import {
  selectFreshBuses,
  subscribeToBuses,
  toBusId,
  type LiveBus,
} from "@/services/locationService";
import type { UserRecord } from "@/types/user";

type Filter = "ALL" | "ON_SHIFT";

const FILTERS: Filter[] = ["ALL", "ON_SHIFT"];

const FILTER_LABELS: Record<Filter, string> = {
  ALL: "All drivers",
  ON_SHIFT: "On shift",
};

const lastSeen = (telemetry: VehicleTelemetry): string =>
  telemetry.observedAt
    ? new Date(telemetry.observedAt).toLocaleTimeString()
    : "—";

interface FleetStatusProps {
  users: UserRecord[];
  loading: boolean;
}

const FleetStatus = ({ users, loading }: FleetStatusProps) => {
  const { actor } = useAuth();

  const mayView = can(actor, PERMISSIONS.READ_ALL_USERS);

  const [buses, setBuses] = useState<LiveBus[]>([]);
  const [checkedAt, setCheckedAt] = useState(() => Date.now());
  const [trackingFailed, setTrackingFailed] = useState(false);
  const [filter, setFilter] = useState<Filter>("ALL");

  const drivers = useMemo(
    () => users.filter((entry) => entry.role === "driver"),
    [users]
  );

  useEffect(() => {
    if (!mayView) return;

    return subscribeToBuses(
      (next) => {
        setBuses(next);
        setCheckedAt(Date.now());
      },
      () => setTrackingFailed(true)
    );
  }, [mayView]);

  useEffect(() => {
    if (!mayView) return;

    const interval = setInterval(
      () => setCheckedAt(Date.now()),
      POLLING.BUS_FRESHNESS_MS
    );

    return () => clearInterval(interval);
  }, [mayView]);

  const live = useMemo(() => selectFreshBuses(buses, checkedAt), [buses, checkedAt]);

  const byBusId = useMemo(
    () => new Map(live.map((vehicle) => [vehicle.telemetry.vehicleId, vehicle])),
    [live]
  );

  const rows = useMemo(
    () =>
      drivers.map((driver) => ({
        driver,
        busId: toBusId(driver.uid),
        bus: byBusId.get(toBusId(driver.uid)) ?? null,
      })),
    [drivers, byBusId]
  );

  const visible = useMemo(
    () => (filter === "ON_SHIFT" ? rows.filter((row) => row.bus) : rows),
    [filter, rows]
  );

  const onShift = rows.filter((row) => row.bus).length;

  if (!mayView) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <RadioTower className="w-6 h-6 text-primary" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-gray-900">Fleet Status</h2>
        </div>

        <div className="flex gap-2" role="group" aria-label="Filter drivers">
          {FILTERS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              aria-pressed={filter === option}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                filter === option
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {FILTER_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-secondary rounded-xl p-4 border border-border">
          <p className="text-xs text-gray-600 mb-1">Driver accounts</p>
          <p className="text-2xl font-bold text-gray-900">{drivers.length}</p>
        </div>

        <div className="bg-secondary rounded-xl p-4 border border-border">
          <p className="text-xs text-gray-600 mb-1">On shift</p>
          <p className="text-2xl font-bold text-gray-900">{onShift}</p>
        </div>

        <div className="bg-secondary rounded-xl p-4 border border-border">
          <p className="text-xs text-gray-600 mb-1">Buses reporting</p>
          <p className="text-2xl font-bold text-gray-900">{live.length}</p>
        </div>
      </div>

      {trackingFailed && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            Live tracking is unreachable, so nobody shows as on shift. The driver list
            below is still accurate.
          </p>
        </div>
      )}

      {loading && <p className="text-gray-600 text-sm">Loading the driver list…</p>}

      {!loading && drivers.length === 0 && (
        <p className="text-gray-600 text-sm">
          No accounts hold the driver role yet. Assign one below to let someone
          broadcast a bus position.
        </p>
      )}

      {!loading && drivers.length > 0 && visible.length === 0 && (
        <p className="text-gray-600 text-sm">Nobody is broadcasting a position.</p>
      )}

      {!loading && visible.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Drivers and the vehicles they are running
            </caption>
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Driver</th>
                <th className="text-left">Bus</th>
                <th className="text-left">Status</th>
                <th className="text-left">Route</th>
                <th className="text-left">Towards</th>
                <th className="text-left">Last report</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(({ driver, busId, bus }) => {
                return (
                  <tr key={driver.uid} className="border-b">
                    <td className="py-2">
                      <span className="font-medium text-gray-900">
                        {driver.name || "Unnamed driver"}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {driver.email}
                      </span>
                    </td>

                    <td className="font-mono text-xs">{busId}</td>

                    <td>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          bus
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        <Bus className="w-3 h-3" aria-hidden="true" />
                        {bus ? "On shift" : "Offline"}
                      </span>
                    </td>

                    <td>
                      {bus?.telemetry.routeId
                        ? getRoute(bus.telemetry.routeId).name
                        : "—"}
                    </td>

                    {/* The route's published terminus, not a coordinate match. */}
                    <td>
                      {bus?.telemetry.routeId
                        ? destinationOf(bus.telemetry.routeId)
                        : "—"}
                    </td>

                    <td>{bus ? lastSeen(bus.telemetry) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FleetStatus;
