import { useEffect } from "react";
import { off, onValue, ref, type DataSnapshot } from "firebase/database";
import { rtdb } from "@/firebase";
import { REMOTE_PATHS } from "@/constants/config";
import { useAuth } from "@/contexts/AuthContext";
import { useTickets } from "@/contexts/TicketContext";
import { isLiveStatus } from "@/domain/ticket/status";
import { STOP_COORDS } from "@/domain/transit/stops";
import { selectNearestEta, shouldAlert } from "@/services/notificationService";
import { useNotification } from "@/components/NotificationPopup";

/**
 * Watches live bus positions and alerts the passenger when their bus is near.
 *
 * Renders nothing - it exists purely to bridge the Realtime Database
 * subscription to the notification system. The distance and ETA maths live in
 * `notificationService`.
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

    const busRef = ref(rtdb, REMOTE_PATHS.BUS_LOCATIONS);

    const handleValue = (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) return;

      const eta = selectNearestEta(Object.values(snapshot.val()), stopCoord);

      if (shouldAlert(eta)) notify(activeTicket.route, boardingStop, eta);
    };

    onValue(busRef, handleValue, (error) => {
      console.error("Arrival monitor subscription failed:", error);
    });

    return () => off(busRef, "value", handleValue);
  }, [user, profile?.notifications_enabled, activeTicket, notify]);

  return null;
};

export default ArrivalMonitor;
