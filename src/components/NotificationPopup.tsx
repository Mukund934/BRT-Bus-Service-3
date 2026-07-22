import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { NOTIFICATION_RULES } from "@/constants/config";
import { createAlertThrottle } from "@/services/notificationService";

interface ArrivalNotification {
  id: string;
  routeId: string;
  stop: string;
  /** Minutes until the bus reaches the stop. */
  eta: number;
  timestamp: number;
}

interface NotificationContextValue {
  notify: (routeId: string, stop: string, eta: number) => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  notify: () => {},
});

export const useNotification = (): NotificationContextValue =>
  useContext(NotificationContext);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<ArrivalNotification[]>([]);

  /**
   * Suppresses repeat alerts for the same route and stop.
   *
   * Built lazily so the throttle is not reconstructed and thrown away on
   * every render.
   */
  const throttleRef = useRef<ReturnType<typeof createAlertThrottle> | null>(null);
  throttleRef.current ??= createAlertThrottle();

  const notify = useCallback((routeId: string, stop: string, eta: number) => {
    const now = Date.now();

    if (!throttleRef.current!.claim(routeId, stop, now)) return;

    setNotifications((previous) => [
      ...previous,
      { id: `notif-${now}`, routeId, stop, eta, timestamp: now },
    ]);

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Bus Arrival Alert", {
        body: `Bus ${routeId} arriving at ${stop} in ~${eta} minutes`,
        icon: NOTIFICATION_RULES.ICON_URL,
      });
    }
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (notifications.length === 0) return;

    const timer = setTimeout(
      () => setNotifications((previous) => previous.slice(1)),
      NOTIFICATION_RULES.AUTO_DISMISS_MS
    );

    return () => clearTimeout(timer);
  }, [notifications]);

  const dismiss = (id: string) =>
    setNotifications((previous) => previous.filter((n) => n.id !== id));

  const value = useMemo<NotificationContextValue>(() => ({ notify }), [notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}

      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3 max-w-sm">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="notification-popup animate-slide-in-right"
            onMouseEnter={(e) => e.currentTarget.classList.add("paused")}
            onMouseLeave={(e) => e.currentTarget.classList.remove("paused")}
            onClick={() => dismiss(notification.id)}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🚌</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-sm">
                  Bus {notification.routeId}
                </p>
                <p className="text-sm text-muted-foreground">
                  Arriving at{" "}
                  <span className="font-medium text-foreground">
                    {notification.stop}
                  </span>
                </p>
                <p className="text-xs text-primary font-semibold mt-0.5">
                  In approx {notification.eta} minutes
                </p>
              </div>
              <button className="text-muted-foreground hover:text-foreground text-lg leading-none">
                &times;
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}
