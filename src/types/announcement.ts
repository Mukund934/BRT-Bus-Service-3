import type { TimestampLike } from "./user";

export const ANNOUNCEMENT_SEVERITIES = ["INFO", "WARNING", "CRITICAL"] as const;

export type AnnouncementSeverity = (typeof ANNOUNCEMENT_SEVERITIES)[number];

/** How each severity is described to a passenger. */
export const SEVERITY_LABELS: Record<AnnouncementSeverity, string> = {
  INFO: "Notice",
  WARNING: "Service change",
  CRITICAL: "Major disruption",
};

/**
 * Something the operator wants passengers to know.
 *
 * Every field is authored by an administrator. Nothing here is derived or
 * generated, because a notice the operator did not write is a notice no
 * passenger should be shown.
 */
export interface Announcement {
  id: string;
  title: string;
  body: string;
  severity: AnnouncementSeverity;
  /** Retired notices stay readable to an administrator but leave the site. */
  active: boolean;
  createdAt?: TimestampLike;
}

export interface AnnouncementDraft {
  title: string;
  body: string;
  severity: AnnouncementSeverity;
}
