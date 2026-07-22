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

/** A live driver position as published to the Realtime Database. */
export const busPositionSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  updatedAt: z.number().int().positive().optional(),
  busId: z.string().max(16).optional(),
});

export type ValidatedBusPosition = z.infer<typeof busPositionSchema>;

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
