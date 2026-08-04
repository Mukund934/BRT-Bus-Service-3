import { useEffect, useState } from "react";
import { AlertTriangle, Info, OctagonAlert } from "lucide-react";
import { fetchActiveAnnouncements } from "@/services/announcementService";
import {
  SEVERITY_LABELS,
  type Announcement,
  type AnnouncementSeverity,
} from "@/types/announcement";

const SEVERITY_STYLES: Record<AnnouncementSeverity, string> = {
  INFO: "bg-blue-50 border-blue-200 text-blue-900",
  WARNING: "bg-amber-50 border-amber-200 text-amber-900",
  CRITICAL: "bg-red-50 border-red-200 text-red-900",
};

const SEVERITY_ICONS: Record<AnnouncementSeverity, typeof Info> = {
  INFO: Info,
  WARNING: AlertTriangle,
  CRITICAL: OctagonAlert,
};

/**
 * Operator notices, shown to everyone.
 *
 * Renders nothing at all when there is nothing to say, so an ordinary day
 * costs the passenger no screen space and no reassurance they did not ask for.
 */
const ServiceAlerts = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    let stale = false;

    void fetchActiveAnnouncements().then((next) => {
      if (!stale) setAnnouncements(next);
    });

    return () => {
      stale = true;
    };
  }, []);

  if (announcements.length === 0) return null;

  return (
    <section aria-labelledby="service-alerts-heading" className="px-4 pt-6">
      <h2 id="service-alerts-heading" className="sr-only">
        Service announcements
      </h2>

      <div className="max-w-5xl mx-auto space-y-3">
        {announcements.map((announcement) => {
          const Icon = SEVERITY_ICONS[announcement.severity];

          return (
            <div
              key={announcement.id}
              role={announcement.severity === "CRITICAL" ? "alert" : "status"}
              className={`flex items-start gap-3 rounded-xl border p-4 ${
                SEVERITY_STYLES[announcement.severity]
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />

              <div className="min-w-0">
                <p className="font-semibold">
                  <span className="sr-only">
                    {SEVERITY_LABELS[announcement.severity]}:{" "}
                  </span>
                  {announcement.title}
                </p>
                <p className="text-sm mt-0.5">{announcement.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ServiceAlerts;
