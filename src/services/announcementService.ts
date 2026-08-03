/**
 * Operator announcements.
 *
 * This is the only collection whose contents are written by a person and shown
 * to passengers as fact, so two rules govern it. Nothing is ever generated or
 * inferred here - an announcement exists because an administrator wrote it.
 * And everything read back is validated, because a stored document is
 * untrusted input like any other.
 *
 * Reads are deliberately unauthenticated: a passenger checking whether their
 * service is disrupted must not have to sign in first.
 */

import { getDb } from "@/firebase";
import { REMOTE_PATHS } from "@/constants/config";
import { AuthorizationError } from "@/domain/auth/errors";
import { PERMISSIONS, can } from "@/domain/auth/permissions";
import { announcementSchema } from "@/domain/validation/schemas";
import type { Actor } from "@/types/user";
import { isTimestampLike } from "@/types/user";
import type { Announcement, AnnouncementDraft } from "@/types/announcement";

/** Client-side bound on a read, matching the cap the rules expect. */
export const MAX_ANNOUNCEMENTS_PER_READ = 50;

/** Loads the Firestore SDK and database handle together. */
const firestore = async () => {
  const [sdk, db] = await Promise.all([import("firebase/firestore"), getDb()]);
  return { ...sdk, db };
};

const toAnnouncement = (
  id: string,
  data: Record<string, unknown>
): Announcement | null => {
  const parsed = announcementSchema.safeParse(data);

  if (!parsed.success) return null;

  return {
    id,
    ...parsed.data,
    createdAt: isTimestampLike(data.createdAt) ? data.createdAt : undefined,
  };
};

const createdAtMs = (announcement: Announcement): number =>
  announcement.createdAt ? announcement.createdAt.toDate().getTime() : 0;

/**
 * Every announcement, newest first.
 *
 * Sorted here rather than with `orderBy`, which would silently exclude any
 * document written without a `createdAt`.
 */
const readAnnouncements = async (): Promise<Announcement[]> => {
  const { collection, getDocs, limit, query, db } = await firestore();

  const snapshot = await getDocs(
    query(collection(db, REMOTE_PATHS.ANNOUNCEMENTS), limit(MAX_ANNOUNCEMENTS_PER_READ))
  );

  const announcements: Announcement[] = [];

  for (const entry of snapshot.docs) {
    const announcement = toAnnouncement(entry.id, entry.data());

    if (announcement) announcements.push(announcement);
  }

  return announcements.sort((a, b) => createdAtMs(b) - createdAtMs(a));
};

/** What a passenger should currently be told. Never throws into a render. */
export const fetchActiveAnnouncements = async (): Promise<Announcement[]> => {
  try {
    return (await readAnnouncements()).filter((announcement) => announcement.active);
  } catch (error) {
    console.error("Could not load announcements:", error);
    return [];
  }
};

/** Everything an administrator may manage, retired notices included. */
export const fetchAllAnnouncements = async (
  actor: Actor | null
): Promise<Announcement[]> => {
  if (!can(actor, PERMISSIONS.MANAGE_ANNOUNCEMENTS)) {
    throw new AuthorizationError(PERMISSIONS.MANAGE_ANNOUNCEMENTS);
  }

  return readAnnouncements();
};

export type AnnouncementResult =
  | { ok: true; announcement: Announcement }
  | { ok: false; message: string };

/**
 * Publishes a notice. Requires MANAGE_ANNOUNCEMENTS.
 *
 * The draft is validated before it is written, so a malformed value from the
 * form is refused here rather than by the rule.
 */
export const publishAnnouncement = async (
  actor: Actor | null,
  draft: AnnouncementDraft
): Promise<AnnouncementResult> => {
  if (!can(actor, PERMISSIONS.MANAGE_ANNOUNCEMENTS)) {
    return { ok: false, message: new AuthorizationError().message };
  }

  const parsed = announcementSchema.safeParse({ ...draft, active: true });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Please check the announcement.",
    };
  }

  try {
    const { addDoc, collection, db } = await firestore();

    const createdAt = new Date();

    const written = await addDoc(collection(db, REMOTE_PATHS.ANNOUNCEMENTS), {
      ...parsed.data,
      createdAt,
    });

    return {
      ok: true,
      announcement: {
        id: written.id,
        ...parsed.data,
        createdAt: { toDate: () => createdAt },
      },
    };
  } catch (error) {
    console.error("Failed to publish announcement:", error);
    return { ok: false, message: "Could not publish that announcement." };
  }
};

export type MutationResult = { ok: true } | { ok: false; message: string };

/** Takes a notice off the site, or puts it back. Requires MANAGE_ANNOUNCEMENTS. */
export const setAnnouncementActive = async (
  actor: Actor | null,
  announcementId: string,
  active: boolean
): Promise<MutationResult> => {
  if (!can(actor, PERMISSIONS.MANAGE_ANNOUNCEMENTS)) {
    return { ok: false, message: new AuthorizationError().message };
  }

  try {
    const { doc, updateDoc, db } = await firestore();

    await updateDoc(doc(db, REMOTE_PATHS.ANNOUNCEMENTS, announcementId), { active });

    return { ok: true };
  } catch (error) {
    console.error("Failed to update announcement:", error);
    return { ok: false, message: "Could not update that announcement." };
  }
};

/** Removes a notice permanently. Requires MANAGE_ANNOUNCEMENTS. */
export const deleteAnnouncement = async (
  actor: Actor | null,
  announcementId: string
): Promise<MutationResult> => {
  if (!can(actor, PERMISSIONS.MANAGE_ANNOUNCEMENTS)) {
    return { ok: false, message: new AuthorizationError().message };
  }

  try {
    const { deleteDoc, doc, db } = await firestore();

    await deleteDoc(doc(db, REMOTE_PATHS.ANNOUNCEMENTS, announcementId));

    return { ok: true };
  } catch (error) {
    console.error("Failed to delete announcement:", error);
    return { ok: false, message: "Could not delete that announcement." };
  }
};
