/**
 * Whether a driver's position is actually reaching anyone.
 *
 * The driver screen used to answer this from a boolean the Start button sets,
 * which is a claim about intent rather than about what happened. A browser
 * clamps timers in a background tab - and suspends geolocation in one - so a
 * driver who switches apps at a terminus sees a green "Sharing Live Location"
 * indicator while nothing is being published at all. Passengers meanwhile watch
 * the bus go stale with no explanation.
 *
 * So health is derived from evidence: the last time a publish actually
 * succeeded. A timer that has been throttled produces no publish, and no
 * publish is exactly what this notices.
 */

export type SharingHealth =
  /** Not trying to share. */
  | "idle"
  /** Sharing, and a publish landed recently enough to believe it. */
  | "sharing"
  /** Sharing was asked for, but nothing has reached the database in time. */
  | "interrupted";

/**
 * How long past a due publish before sharing is called interrupted.
 *
 * Two and a half intervals, so one slow fix or a single dropped request does
 * not raise a false alarm, while a throttled background tab - which stretches
 * a 15 s timer to at least a minute - is caught on its first missed publish.
 */
export const INTERRUPTION_TOLERANCE = 2.5;

export const sharingHealth = (
  isSharing: boolean,
  lastPublishedAt: number | null,
  now: number,
  intervalMs: number
): SharingHealth => {
  if (!isSharing) return "idle";

  /*
    Nothing published yet is not an interruption: the first fix is still being
    acquired, and geolocation on a cold start can take several seconds.
  */
  if (lastPublishedAt === null) return "sharing";

  const overdue = now - lastPublishedAt > intervalMs * INTERRUPTION_TOLERANCE;

  return overdue ? "interrupted" : "sharing";
};

/** What the driver is told, in each state. */
export const SHARING_MESSAGES: Record<SharingHealth, string> = {
  idle: "Not sharing",
  sharing: "Sharing your live location",
  interrupted: "Your position is not reaching passengers",
};

/**
 * Why sharing stopped, when we can tell.
 *
 * Only the background-tab cause is named, because it is the only one we can
 * actually observe - `document.visibilityState` says so directly. Anything
 * else gets the honest general form rather than a guess at a cause.
 */
export const interruptionReason = (hiddenSinceLastPublish: boolean): string =>
  hiddenSinceLastPublish
    ? "This tab was in the background, and browsers stop a background tab from reading its location. Keep this screen open and awake while you are on shift."
    : "The last update did not reach us. Check your signal.";
