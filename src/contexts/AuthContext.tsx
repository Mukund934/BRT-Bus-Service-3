/**
 * Authentication state and actions.
 *
 * Split out of the former all-purpose UserContext so that ticket updates -
 * which tick every 15 seconds - no longer re-render every component that only
 * cares who is signed in.
 *
 * Firestore access lives in `userService`; this provider holds state and
 * exposes actions over it.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider } from "@/firebase";
import {
  createUserRecord,
  ensureUserRecord,
  toUserProfile,
} from "@/services/userService";
import type { Actor, UserProfile, UserRole } from "@/types/user";

interface AuthContextValue {
  user: FirebaseUser | null;
  role: UserRole | null;
  profile: UserProfile | null;
  loading: boolean;
  /** Identity to pass to services that perform privileged operations. */
  actor: Actor | null;
  signUp: (name: string, email: string, password: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  logout: () => Promise<void>;
  /**
   * Re-reads the signed-in user's record and republishes role and profile.
   *
   * Needed because a Firestore write does not fire `onAuthStateChanged`, so
   * changing your own role would otherwise leave the session on its old one.
   */
  refreshUserRecord: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const describeError = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * The single place a signed-in session is resolved.
   *
   * Sign-in methods below only talk to Firebase Auth; this listener then
   * loads (or creates) the matching user record, so role and profile are
   * derived in one place rather than in each sign-in path.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (!nextUser) {
        setUser(null);
        setRole(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(nextUser);

      try {
        const record = await ensureUserRecord(nextUser);
        setRole(record.role);
        setProfile(toUserProfile(nextUser, record));
      } catch (error) {
        console.error("Failed to resolve user record:", error);
        setRole("user");
        setProfile(toUserProfile(nextUser, null));
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string): Promise<string | null> => {
      try {
        const credential = await createUserWithEmailAndPassword(auth, email, password);

        await updateProfile(credential.user, { displayName: name });

        // Written explicitly rather than left to the listener so the chosen
        // display name wins over the default the listener would create.
        const record = await createUserRecord(credential.user, name);

        setRole(record.role);
        setProfile(toUserProfile(credential.user, record));

        return null;
      } catch (error) {
        console.error("Sign up failed:", error);
        return describeError(error, "Failed to sign up");
      }
    },
    []
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        return null;
      } catch (error) {
        console.error("Sign in failed:", error);
        return describeError(error, "Failed to sign in");
      }
    },
    []
  );

  const signInWithGoogle = useCallback(async (): Promise<string | null> => {
    try {
      await signInWithPopup(auth, googleProvider);
      return null;
    } catch (error) {
      console.error("Google sign in failed:", error);
      return describeError(error, "Failed to sign in with Google");
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  }, []);

  /**
   * Reads `auth.currentUser` rather than the `user` state so this stays
   * referentially stable and does not churn its consumers' dependencies.
   */
  const refreshUserRecord = useCallback(async (): Promise<void> => {
    const current = auth.currentUser;
    if (!current) return;

    try {
      const record = await ensureUserRecord(current);
      setRole(record.role);
      setProfile(toUserProfile(current, record));
    } catch (error) {
      console.error("Failed to refresh user record:", error);
    }
  }, []);

  const actor = useMemo<Actor | null>(
    () => (user ? { uid: user.uid, role } : null),
    [user, role]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      profile,
      loading,
      actor,
      signUp,
      signIn,
      signInWithGoogle,
      logout,
      refreshUserRecord,
    }),
    [
      user,
      role,
      profile,
      loading,
      actor,
      signUp,
      signIn,
      signInWithGoogle,
      logout,
      refreshUserRecord,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) throw new Error("useAuth must be used within an AuthProvider");

  return context;
};
