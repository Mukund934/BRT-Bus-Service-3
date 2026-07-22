import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTickets } from "@/contexts/TicketContext";
import { isLiveStatus } from "@/domain/ticket/status";
import { STOP_COORDS } from "@/domain/transit/stops";
import { subscribeToBuses } from "@/services/locationService";
import { selectNearestEta, shouldAlert } from "@/services/notificationService";
import { useNotification } from "@/components/NotificationPopup";

/**
 * Watches live bus positions and alerts the passenger when their bus is near.
 *
 * Renders nothing. It only runs for a signed-in passenger who holds a live
 * ticket and has not opted out of notifications, so a signed-out visitor
 * never opens a subscription.
 */
const ArrivalMonitor = () => {
  const { user, profile } = useAuth();
  const { activeTicket } = useTickets();
  const { notify } = useNotification();

  useEffect(() => {
    if (!user || !profile?.notifications_enabled || !activeTicket) return;
    if (!isLiveStatus(activeTicket.status)) return;

    const boardingStop = activeTicket.fromStop;
    const stopCoord = STOP_COORDS[boardingStop];

    return subscribeToBuses((buses) => {
      const eta = selectNearestEta(buses, stopCoord);

      if (shouldAlert(eta)) notify(activeTicket.route, boardingStop, eta);
    });
  }, [user, profile?.notifications_enabled, activeTicket, notify]);

  return null;
};

export default ArrivalMonitor;
