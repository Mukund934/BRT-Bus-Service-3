/**
 * Screen-reader announcements.
 *
 * Sighted users learn that a booking succeeded or a bus is arriving from
 * something appearing on screen. A screen reader user only learns it if the
 * change is pushed into a live region. This provider owns the two regions the
 * whole app shares.
 *
 * Two politeness levels, used deliberately:
 *  - "polite" waits for a pause in speech. Correct for status updates.
 *  - "assertive" interrupts. Reserved for errors and things the user must act
 *    on, because interrupting for routine updates is hostile.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Politeness = "polite" | "assertive";

interface AnnouncerValue {
  announce: (message: string, politeness?: Politeness) => void;
}

const AnnouncerContext = createContext<AnnouncerValue>({ announce: () => {} });

export const useAnnounce = (): AnnouncerValue["announce"] =>
  useContext(AnnouncerContext).announce;

export const LiveAnnouncer = ({ children }: { children: ReactNode }) => {
  const [polite, setPolite] = useState("");
  const [assertive, setAssertive] = useState("");

  /**
   * Clearing before setting matters: a live region only announces when its
   * content *changes*, so re-announcing the identical message (a second
   * failed booking, say) needs the value to pass through empty first.
   */
  const announce = useCallback(
    (message: string, politeness: Politeness = "polite") => {
      const set = politeness === "assertive" ? setAssertive : setPolite;

      set("");
      window.setTimeout(() => set(message), 50);
    },
    []
  );

  const value = useMemo<AnnouncerValue>(() => ({ announce }), [announce]);

  return (
    <AnnouncerContext.Provider value={value}>
      {children}

      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {polite}
      </div>

      <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">
        {assertive}
      </div>
    </AnnouncerContext.Provider>
  );
};
