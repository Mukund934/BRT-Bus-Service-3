/**
 * Single source of truth for tunable application values.
 *
 * Anything that was previously a magic number buried in a component or a
 * hook lives here. Domain rules (fares, stops, schedules) do NOT belong in
 * this file - those live under `src/domain`.
 */

/** Ticket lifecycle timing rules. */
export const TICKET_RULES = {
  /** Minutes a ticket stays valid after its scheduled arrival. */
  GRACE_MINUTES: 15,
  /** Minutes before departure at which a ticket flips to BOARDING_SOON. */
  BOARDING_WINDOW_MINUTES: 15,
  /**
   * A timetable arrival earlier than its departure is only treated as a real
   * midnight crossing when the gap exceeds this many hours. Smaller gaps are
   * data-entry slips and get clamped to the departure time instead.
   */
  MIDNIGHT_ROLLOVER_HOURS: 12,
} as const;

/** Live-tracking and arrival-estimation tuning. */
export const ARRIVAL_RULES = {
  /** Alert the passenger when the nearest bus is within this many minutes. */
  ALERT_MINUTES: 5,
  /** Assumed average bus speed used to turn distance into an ETA. */
  AVERAGE_SPEED_KMPH: 30,
  /** Bus pings older than this are ignored as stale. */
  STALE_LOCATION_MS: 120_000,
} as const;

/** Recurring timer intervals. */
export const POLLING = {
  /** How often ticket statuses are re-evaluated against the clock. */
  TICKET_STATUS_MS: 15_000,
  /** How often a sharing driver publishes their position. */
  DRIVER_LOCATION_MS: 3_000,
  /** How often the virtual ticket countdown re-renders. */
  TICKET_COUNTDOWN_MS: 1_000,
} as const;

/** In-app notification behaviour. */
export const NOTIFICATION_RULES = {
  /** Suppress repeat alerts for the same bus/stop pair within this window. */
  DEDUPE_WINDOW_MS: 300_000,
  /** How long a popup stays on screen before auto-dismissing. */
  AUTO_DISMISS_MS: 6_000,
  ICON_URL: "https://cdn-icons-png.freepik.com/512/1719/1719609.png",
} as const;

/** Simulated payment gateway configuration. */
export const PAYMENT_CONFIG = {
  /** Artificial latency so the processing state is visible. */
  SIMULATED_DELAY_MS: 2_000,
  UPI_VPA: "brtbus@upi",
  UPI_PAYEE: "BRT Bus",
  CURRENCY: "INR",
} as const;

/** QR rendering sizes. */
export const QR_CONFIG = {
  TICKET_SIZE: 120,
  PAYMENT_SIZE: 140,
  ERROR_CORRECTION: "M",
} as const;

/** Namespaced browser-storage keys. */
export const STORAGE_KEYS = {
  /** Per-user ticket collection: `brt.tickets.<uid>`. */
  TICKETS_PREFIX: "brt.tickets",
  /** Pre-Sprint-2 single-ticket key, migrated then removed on first login. */
  LEGACY_TICKET: "latestTicket",
} as const;

/** Remote data locations. */
export const REMOTE_PATHS = {
  /** Realtime Database node holding live driver positions. */
  BUS_LOCATIONS: "busLocations",
  /** Firestore collection holding user profiles and roles. */
  USERS: "users",
} as const;

/** How wide a bounding box the embedded map draws around its centre. */
export const MAP_CONFIG = {
  BBOX_DELTA_DEG: 0.02,
} as const;
