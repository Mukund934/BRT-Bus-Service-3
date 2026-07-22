import { useEffect } from "react";
import { rtdb } from "@/firebase";
import { ref, onValue, off } from "firebase/database";
import { useUser } from "@/contexts/UserContext";
import { useNotification } from "@/components/NotificationPopup";
import { STOP_COORDS, ARRIVAL_ALERT_MINUTES, isLiveStatus } from "@/types/ticket";

const AVERAGE_SPEED_KMPH = 30;
const STALE_LOCATION_MS = 120000;

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const ArrivalMonitor = () => {
  const { user, profile, activeTicket } = useUser();
  const { notify } = useNotification();

  useEffect(() => {
    if (!user || !profile?.notifications_enabled || !activeTicket) return;
    if (!isLiveStatus(activeTicket.status)) return;

    const stopName = activeTicket.fromStop;
    const stopCoord = STOP_COORDS[stopName];
    if (!stopCoord) return;

    const busRef = ref(rtdb, "busLocations");

    const handleValue = (snapshot: any) => {
      if (!snapshot.exists()) return;

      const buses = Object.values(snapshot.val()) as Array<{
        lat: number;
        lng: number;
        name?: string;
        updatedAt?: number;
      }>;

      const now = Date.now();
      let bestEta: number | null = null;

      buses.forEach((bus) => {
        if (typeof bus?.lat !== "number" || typeof bus?.lng !== "number") return;
        if (bus.updatedAt && now - bus.updatedAt > STALE_LOCATION_MS) return;

        const dist = haversine(bus.lat, bus.lng, stopCoord.lat, stopCoord.lng);
        const eta = Math.round((dist / AVERAGE_SPEED_KMPH) * 60);

        if (bestEta === null || eta < bestEta) bestEta = eta;
      });

      if (bestEta !== null && bestEta <= ARRIVAL_ALERT_MINUTES) {
        notify(activeTicket.route, stopName, bestEta);
      }
    };

    onValue(busRef, handleValue, (err) => {
      console.error("Arrival monitor error:", err);
    });

    return () => off(busRef, "value", handleValue);
  }, [user, profile?.notifications_enabled, activeTicket, notify]);

  return null;
};

export default ArrivalMonitor;
