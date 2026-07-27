import { getConnectedRoutes, isInterchange, type NetworkRouteId } from "@/domain/transit/routes";
import type { StopName } from "@/domain/transit/stops";

interface RouteStopListProps {
  routeId: NetworkRouteId;
  stops: readonly StopName[];
  scheduled: ReadonlySet<StopName>;
}

const RouteStopList = ({ routeId, stops, scheduled }: RouteStopListProps) => (
  <ol className="relative">
    {stops.map((stop, index) => {
      const terminus = index === 0 || index === stops.length - 1;
      const connections = isInterchange(stop)
        ? getConnectedRoutes(stop, routeId)
        : [];

      return (
        <li key={stop} className="relative flex gap-4 pb-6 last:pb-0">
          {index < stops.length - 1 && (
            <span
              aria-hidden="true"
              className="absolute left-[7px] top-4 bottom-0 w-0.5 bg-primary/25"
            />
          )}

          <span
            aria-hidden="true"
            className={`relative z-10 mt-1.5 h-4 w-4 flex-shrink-0 rounded-full border-2 ${
              terminus
                ? "border-primary bg-primary"
                : "border-primary/50 bg-card"
            }`}
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-foreground">{stop}</span>

              {terminus && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  {index === 0 ? "Start" : "End"}
                </span>
              )}

              {connections.length > 0 && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
                  Interchange
                </span>
              )}

              {!scheduled.has(stop) && (
                <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                  No departures yet
                </span>
              )}
            </div>

            {connections.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Change here for{" "}
                {connections.map((route) => route.name).join(", ")}
              </p>
            )}
          </div>
        </li>
      );
    })}
  </ol>
);

export default RouteStopList;
