/**
 * Runtime schemas for every value that crosses a trust boundary.
 *
 * TypeScript types vanish at runtime, so anything arriving from browser
 * storage, Firestore, the Realtime Database or a form field is `unknown`
 * until proven otherwise. These schemas are that proof.
 *
 * Written with zod, which was already a dependency but unused.
 */

import { z } from "zod";
import { ROUTE_IDS } from "@/domain/transit/routes";
import { STOPS } from "@/domain/transit/stops";
import { USER_ROLES } from "@/types/user";
import { ANNOUNCEMENT_SEVERITIES } from "@/types/announcement";

/** Stop names, validated against the canonical registry. */
export const stopNameSchema = z.enum(STOPS);

/** Route ids, validated against the canonical registry. */
export const routeIdSchema = z.enum(ROUTE_IDS);

export const userRoleSchema = z.enum(USER_ROLES);

export const ticketStatusSchema = z.enum([
  "PENDING",
  "ACTIVE",
  "BOARDING_SOON",
  "IN_TRANSIT",
  "COMPLETED",
  "CANCELLED",
]);

export const paymentStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "SUCCESS",
  "FAILED",
]);

const isoDate = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "not a valid date");

const displayTime = z
  .string()
  .regex(/^\d{1,2}:\d{2}\s?(AM|PM)$/i, "not a valid timetable time");

/**
 * A persisted ticket.
 *
 * Fare is bounded because a tampered storage entry with a negative or absurd
 * fare would otherwise flow straight into the passenger's spend total.
 */
export const ticketSchema = z.object({
  ticketId: z.string().min(1).max(64),
  paymentId: z.string().min(1).max(64),
  userId: z.string().min(1).max(128),
  userEmail: z.string().max(320),
  route: routeIdSchema,
  fromStop: stopNameSchema,
  toStop: stopNameSchema,
  fare: z.number().int().nonnegative().max(10_000),
  departureTime: displayTime,
  arrivalTime: displayTime,
  travelDate: isoDate,
  bookingTime: isoDate,
  createdAt: isoDate,
  updatedAt: isoDate,
  expiresAt: isoDate,
  status: ticketStatusSchema,
  paymentStatus: paymentStatusSchema,
  qrData: z.string().max(4096),
  validationToken: z.string().min(1).max(128),
});

/**
 * A list whose elements are validated individually by the caller.
 *
 * Deliberately NOT `z.array(ticketSchema)`: that fails the whole array when a
 * single element is malformed, which would make one corrupt record destroy a
 * passenger's entire ticket history. Element-level validation degrades to
 * losing just the bad entry.
 */
export const unknownArraySchema = z.array(z.unknown());

const busPositionShape = {
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  updatedAt: z.number().int().positive().optional(),
  busId: z.string().max(16).optional(),
};

/**
 * A live driver position as PUBLISHED by this client.
 *
 * Strict on `routeId`, because we control what we write and must never put an
 * unknown route into a world-readable node. It stays optional only because
 * positions published before drivers declared a route are still in there.
 */
export const busPositionSchema = z.object({
  ...busPositionShape,
  routeId: routeIdSchema.optional(),
});

/**
 * The same position as READ back from the database.
 *
 * Deliberately tolerant where the publish schema is strict, and the difference
 * is the whole point. `routeId` is parsed as a plain string and resolved
 * against the known set afterwards, so a route this build has never heard of
 * costs the bus its route label - not its place on the map.
 *
 * On the web that distinction is invisible: a deploy updates every client at
 * once, so no client is ever behind the data. An installed app is different.
 * The day a new route opens, every phone that has not updated would drop those
 * buses entirely, and a passenger would see fewer buses than exist with
 * nothing anywhere saying so. Every contract change has to be additive and
 * tolerant, because users do not update.
 */
export const inboundBusPositionSchema = z.object({
  ...busPositionShape,
  routeId: z.string().max(16).optional(),
});

export type ValidatedBusPosition = z.infer<typeof busPositionSchema>;

/**
 * Journeys kept on this device.
 *
 * Stops are parsed **strictly** against the registry here, unlike an operator
 * alert's route id. The difference is what a stale value costs: an alert
 * naming an unknown route is still a warning worth showing, while a saved
 * journey naming a stop that no longer exists is a shortcut that cannot be
 * taken. Dropping it lets the list heal itself the next time it is read.
 */
export const journeyPairSchema = z.object({
  from: stopNameSchema,
  to: stopNameSchema,
});

export const recentJourneySchema = journeyPairSchema.extend({
  at: z.number().int().nonnegative(),
});

export const savedJourneysSchema = z.array(journeyPairSchema).max(50);
export const recentJourneysSchema = z.array(recentJourneySchema).max(50);

export const announcementSeveritySchema = z.enum(ANNOUNCEMENT_SEVERITIES);

/**
 * An operator announcement, as stored and as typed into the admin form.
 *
 * Bounded because the body is rendered on a public page: an unbounded string
 * from a compromised admin session would otherwise be a denial-of-service on
 * every passenger who loads the home page.
 */
/**
 * One thing a notice affects.
 *
 * Ids are bounded strings rather than the `RouteId` / `StopName` unions on
 * purpose. Parsing them as enums would make an older build discard an
 * operator's warning about a route that opened after it shipped, which is the
 * version-skew failure applied to the one message a passenger must not miss.
 * An unknown id simply never matches a scope; the notice still shows.
 */
export const informedEntitySchema = z.object({
  routeId: z.string().trim().min(1).max(32).optional(),
  stopId: z.string().trim().min(1).max(64).optional(),
});

export const announcementDraftSchema = z.object({
  title: z.string().trim().min(1, "A title is required").max(120, "Title is too long"),
  body: z.string().trim().min(1, "A message is required").max(1000, "Message is too long"),
  severity: announcementSeveritySchema,
  /* Bounded like the body: a stored list is untrusted input rendered publicly. */
  informedEntities: z.array(informedEntitySchema).max(20).optional(),
  startsAt: z.number().int().nonnegative().optional(),
  endsAt: z.number().int().nonnegative().optional(),
});

export const announcementSchema = announcementDraftSchema.extend({
  active: z.boolean(),
});

// ---- form input ------------------------------------------------------

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(320, "Email is too long")
  .email("Please enter a valid email address");

/**
 * Password policy.
 *
 * Six characters is Firebase Auth's own floor. An upper bound is included
 * because bcrypt-style hashing costs scale with input length, making
 * unbounded passwords a cheap denial-of-service vector.
 */
export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(128, "Password must be at most 128 characters");

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(80, "Name is too long")
  // Control characters can be used to spoof rendering in the admin roster.
  .regex(/^[^\p{Cc}\p{Cf}]+$/u, "Name contains invalid characters");

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = z.object({
  name: displayNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

/** Flattens a zod failure into `{ field: message }` for form display. */
export const fieldErrors = (error: z.ZodError): Record<string, string> => {
  const result: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in result)) result[key] = issue.message;
  }

  return result;
};
