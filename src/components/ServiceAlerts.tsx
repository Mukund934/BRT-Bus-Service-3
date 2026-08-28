import { useEffect, useState } from "react";
import { AlertTriangle, Info, OctagonAlert } from "lucide-react";
import { fetchActiveAnnouncements } from "@/services/announcementService";
import { useAnnounce } from "@/components/a11y/LiveAnnouncer";
import {
  SEVERITY_LABELS,
  type Announcement,
  type AnnouncementSeverity,
} from "@/types/announcement";

const SEVERITY_STYLES: Record<AnnouncementSeverity, string> = {
  INFO: "bg-blue-50 border-blue-200 text-blue-900",
  WARNING: "bg-amber-50 border-amber-200 text-amber-900",
  CRITICAL: "bg-destructive/10 border-destructive/30 text-destructive",
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
  const announce = useAnnounce();

  useEffect(() => {
    let stale = false;

    void fetchActiveAnnouncements().then((next) => {
      if (!stale) setAnnouncements(next);
    });

    return () => {
      stale = true;
    };
  }, []);

  /*
    The announcement is routed through the shared live region rather than
    carried by a role on the cards below.

    A live region has to be in the document BEFORE its content changes. These
    cards do not exist until the fetch resolves, so a `role="alert"` on them
    was a region arriving with its message already inside it - which most
    screen readers do not announce at all. The product's most safety-critical
    message was the one being spoken least reliably.

    A critical notice interrupts; anything else waits for a pause.
  */
  useEffect(() => {
    if (announcements.length === 0) return;

    const critical = announcements.filter(
      (announcement) => announcement.severity === "CRITICAL"
    );

    const spoken = (critical.length > 0 ? critical : announcements)
      .map(
        (announcement) =>
          `${SEVERITY_LABELS[announcement.severity]}: ${announcement.title}. ${
            announcement.body
          }`
      )
      .join(" ");

    announce(spoken, critical.length > 0 ? "assertive" : "polite");
  }, [announcements, announce]);

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
