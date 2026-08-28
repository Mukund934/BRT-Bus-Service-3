import { useEffect, useState } from "react";

/**
 * A clock that re-renders on an interval.
 *
 * Anything that highlights "the next bus" needs this rather than a
 * `new Date()` read at render time. A timetable that is correct when the page
 * mounts and wrong five minutes later is worse than one with no highlight at
 * all, because it looks authoritative while pointing at a bus that has gone.
 */
export const useNow = (intervalMs = 30_000): Date => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
};
