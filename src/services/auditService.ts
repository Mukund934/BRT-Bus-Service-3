/**
 * The record of administrative acts.
 *
 * Two things an administrator does leave no other trace. Changing a role
 * overwrites the only copy of it - `users` holds the CURRENT role and nothing
 * about the one before. Publishing an announcement puts words in front of
 * passengers as fact, and editing one overwrites what it said. So without
 * this, "who did that, and when?" has no answer anywhere in the system.
 *
 * WHAT MAKES IT EVIDENCE rather than a diary is that the two fields that
 * matter are not the caller's to choose. `actorUid` is pinned by the rules to
 * the authenticated user, so an entry cannot be attributed to somebody else,
 * and `at` is pinned to the server's clock, so nothing can be backdated into
 * a shift nobody was working. The collection is create-only: an administrator
 * who can edit the log is an administrator with no log.
 *
 * FAILURE IS DELIBERATELY NOT FATAL. The action being recorded has already
 * happened by the time we get here, and refusing to report a successful role
 * change because its audit entry failed would leave the administrator
 * retrying an operation that already worked. A failed write is logged for the
 * error reporter and swallowed.
 *
 * COST: a few hundred writes a day against a 20,000/day free allowance. This
 * is free at this scale and remains free well beyond it.
 */

import { getDb } from "@/firebase";
import { PERMISSIONS, can } from "@/domain/auth/permissions";
import { REMOTE_PATHS } from "@/constants/config";
import type { Actor } from "@/types/user";

/*
  One import of the SDK, shared by every caller - the same memoisation
  `locationService` needed. Two services loading it concurrently is not
  hypothetical: a role change and its audit entry happen in the same tick.
*/
let sdkPromise: Promise<typeof import("firebase/firestore")> | null = null;

/** Loads the Firestore SDK and database handle together. */
const firestore = async () => {
  sdkPromise ??= import("firebase/firestore");

  const [sdk, db] = await Promise.all([sdkPromise, getDb()]);

  return { ...sdk, db };
};

/** The administrative acts worth a permanent record. */
export type AuditAction = "ROLE_CHANGED" | "ANNOUNCEMENT_PUBLISHED";

export interface AuditEntry {
  /** What happened. */
  action: AuditAction;
  /** What it happened to - an account id, or an announcement id. */
  subject: string;
  /** Enough to understand the change without another lookup. */
  detail: string;
}

/**
 * Records one administrative act.
 *
 * Returns whether the record was written, which callers may ignore - and all
 * of them do, on purpose. See the note about failure above.
 */
export const recordAudit = async (
  actor: Actor | null,
  entry: AuditEntry
): Promise<boolean> => {
  /*
    Checked here as well as in the rules. The rules are what actually stop a
    forged entry; this stops the app from attempting one it knows will be
    refused, which would otherwise surface as a console error on a screen
    where nothing went wrong.
  */
  if (!can(actor, PERMISSIONS.ASSIGN_ROLES) || !actor) return false;

  try {
    const { addDoc, collection, serverTimestamp, db } = await firestore();

    await addDoc(collection(db, REMOTE_PATHS.AUDIT_LOG), {
      actorUid: actor.uid,
      /*
        The server's clock, matching the rule that requires it. A client
        timestamp would let an entry be placed at a time of the author's
        choosing, which is the one thing an audit trail must not allow.
      */
      at: serverTimestamp(),
      action: entry.action,
      subject: entry.subject,
      detail: entry.detail,
    });

    return true;
  } catch (error) {
    console.error("Could not record an administrative action:", error);

    return false;
  }
};
