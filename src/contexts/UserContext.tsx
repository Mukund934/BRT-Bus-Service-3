import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
  collection,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { auth, googleProvider, db } from "@/firebase";
import {
  Ticket,
  TicketDraft,
  createTicket,
  resolveTicketStatus,
  isLiveStatus,
  getDepartureAt,
  getArrivalAt,
  findConflictingTicket,
} from "@/types/ticket";
import {
  loadTickets,
  saveTickets,
  addTicket,
  replaceTicket,
  migrateLegacyTicket,
} from "@/lib/ticketStorage";

interface FirestoreUser {
  uid: string;
  name?: string;
  email?: string;
  role: "user" | "admin" | "driver";
  createdAt?: Timestamp;
  photoURL?: string;
}

interface UserProfile {
  name: string;
  email: string;
  notifications_enabled: boolean;
}

interface UserContextType {
  user: FirebaseUser | null;
  role: "user" | "admin" | "driver" | null;
  profile: UserProfile | null;
  tickets: Ticket[];
  activeTicket: Ticket | null;
  ticketHistory: Ticket[];
  bookTicket: (draft: TicketDraft) => Ticket | null;
  cancelTicket: (ticketId: string) => void;
  refreshTickets: () => void;
  loading: boolean;
  signUp: (name: string, email: string, password: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  logout: () => Promise<void>;
  getAllUsers: () => Promise<FirestoreUser[]>;
  updateUserRole: (
    userId: string,
    newRole: "user" | "admin" | "driver"
  ) => Promise<string | null>;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<"user" | "admin" | "driver" | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const syncStatuses = (list: Ticket[]) => {
    const now = new Date();
    let changed = false;

    const next = list.map((t) => {
      const status = resolveTicketStatus(t, now);
      if (status === t.status) return t;

      changed = true;
      return { ...t, status, updatedAt: now.toISOString() };
    });

    return changed ? next : list;
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (u) {
          setUser(u);

          // Fetch user role from Firestore
          const ref = doc(db, "users", u.uid);
          const snap = await getDoc(ref);

          if (snap.exists()) {
            const data = snap.data();
            const userRole = data.role || "user";
            setRole(userRole as "user" | "admin" | "driver");
            setProfile({
              name: data.name || u.displayName || "Passenger",
              email: data.email || u.email || "",
              notifications_enabled: data.notifications_enabled !== false,
            });
          } else {
            // User doc doesn't exist, default to 'user'
            setRole("user");
            setProfile({
              name: u.displayName || "Passenger",
              email: u.email || "",
              notifications_enabled: true,
            });
          }

          migrateLegacyTicket(u.uid, u.email || "");

          const stored = loadTickets(u.uid);
          const synced = syncStatuses(stored);

          if (synced !== stored) saveTickets(u.uid, synced);
          setTickets(synced);
        } else {
          setUser(null);
          setRole(null);
          setProfile(null);
          setTickets([]);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRole("user");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;

    const tick = () => {
      setTickets((prev) => {
        const next = syncStatuses(prev);
        if (next !== prev) saveTickets(user.uid, next);
        return next;
      });
    };

    const interval = setInterval(tick, 15000);

    return () => clearInterval(interval);
  }, [user]);

  const refreshTickets = () => {
    if (!user) return;

    const stored = loadTickets(user.uid);
    const synced = syncStatuses(stored);

    if (synced !== stored) saveTickets(user.uid, synced);
    setTickets(synced);
  };

  const bookTicket = (draft: TicketDraft): Ticket | null => {
    if (!user) return null;

    const now = new Date();
    const ticket = createTicket(draft, now);

    if (getDepartureAt(ticket) < now) return null;

    const conflict = findConflictingTicket(
      tickets,
      getDepartureAt(ticket),
      getArrivalAt(ticket)
    );

    if (conflict) return null;

    const next = addTicket(user.uid, ticket);
    if (!next) return null;

    setTickets(next);
    return ticket;
  };

  const cancelTicket = (ticketId: string) => {
    if (!user) return;

    const target = tickets.find((t) => t.ticketId === ticketId);
    if (!target || !isLiveStatus(target.status)) return;

    const next = replaceTicket(user.uid, {
      ...target,
      status: "CANCELLED",
      updatedAt: new Date().toISOString(),
    });

    if (next) setTickets(next);
  };

  const signUp = async (
    name: string,
    email: string,
    password: string
  ): Promise<string | null> => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(res.user, { displayName: name });

      // Create user document in Firestore with createdAt timestamp
      await setDoc(doc(db, "users", res.user.uid), {
        name,
        email,
        role: "user",
        createdAt: Timestamp.now(),
        photoURL: res.user.photoURL || null,
      });

      setUser(res.user);
      setRole("user");
      return null;
    } catch (error: any) {
      console.error("Sign up error:", error);
      return error.message || "Failed to sign up";
    }
  };

  const signIn = async (
  email: string,
  password: string
): Promise<string | null> => {
  try {
    const res = await signInWithEmailAndPassword(auth, email, password);
    setUser(res.user);

    // Fetch or CREATE user doc from Firestore
    const ref = doc(db, "users", res.user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      // ✅ Doc exists, use existing role
      setRole(snap.data().role || "user");
    } else {
      // ✅ Doc doesn't exist, CREATE it automatically
      const newUserData = {
        name: res.user.displayName || "User",
        email: res.user.email,
        role: "user", // Default role
        createdAt: Timestamp.now(),
        photoURL: res.user.photoURL || null,
      };

      await setDoc(ref, newUserData);
      console.log("✅ Auto-created Firestore doc for:", res.user.email);
      setRole("user");
    }
    return null;
  } catch (error: any) {
    console.error("Sign in error:", error);
    return error.message || "Failed to sign in";
  }
};

const signInWithGoogle = async (): Promise<string | null> => {
  try {
    const res = await signInWithPopup(auth, googleProvider);

    // Check if user exists in Firestore
    const ref = doc(db, "users", res.user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      // ✅ CREATE Firestore doc for Google users
      const newUserData = {
        name: res.user.displayName || "User",
        email: res.user.email,
        role: "user",
        createdAt: Timestamp.now(),
        photoURL: res.user.photoURL || null,
      };

      await setDoc(ref, newUserData);
      console.log("✅ Auto-created Firestore doc for Google user:", res.user.email);
    }

    setUser(res.user);
    setRole(snap.exists() ? snap.data().role : "user");
    return null;
  } catch (error: any) {
    console.error("Google sign in error:", error);
    return error.message || "Failed to sign in with Google";
  }
};

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setUser(null);
      setRole(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  // 🔥 FETCH ALL USERS FROM FIRESTORE (CLIENT-SIDE)
  // 🔥 FETCH ALL USERS FROM FIRESTORE
const getAllUsers = async (): Promise<FirestoreUser[]> => {
  try {
    // Check if current user is admin
    if (!user || role !== "admin") {
      throw new Error("Only admins can fetch all users");
    }

    // Fetch all users from Firestore collection
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    const users: FirestoreUser[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        uid: doc.id,
        name: data.name,
        email: data.email,
        role: data.role || "user",
        createdAt: data.createdAt,
        photoURL: data.photoURL,
      });
    });

    console.log(`✅ Fetched ${users.length} users from Firestore`);

    // Sort by creation date (newest first)
    return users.sort((a, b) => {
      const dateA =
        a.createdAt instanceof Timestamp
          ? a.createdAt.toDate().getTime()
          : new Date(a.createdAt || 0).getTime();
      const dateB =
        b.createdAt instanceof Timestamp
          ? b.createdAt.toDate().getTime()
          : new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    throw new Error("Failed to fetch users");
  }
};

  // 🔥 UPDATE USER ROLE
  const updateUserRole = async (
    userId: string,
    newRole: "user" | "admin" | "driver"
  ): Promise<string | null> => {
    try {
      // Check if current user is admin
      if (!user || role !== "admin") {
        return "Only admins can update user roles";
      }

      const userRef = doc(db, "users", userId);

      // Check if user document exists
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        // If doesn't exist, create it with the new role
        await setDoc(userRef, {
          role: newRole,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      } else {
        // Update existing user's role
        await updateDoc(userRef, {
          role: newRole,
          updatedAt: Timestamp.now(),
        });
      }

      // If updating current user's role, update local state
      if (user && user.uid === userId) {
        setRole(newRole);
      }

      return null;
    } catch (error: any) {
      console.error("Error updating user role:", error);
      return error.message || "Failed to update user role";
    }
  };

  const activeTicket =
    tickets
      .filter((t) => isLiveStatus(t.status))
      .sort((a, b) => getDepartureAt(a).getTime() - getDepartureAt(b).getTime())[0] || null;

  const ticketHistory = tickets.filter((t) => !isLiveStatus(t.status));

  return (
    <UserContext.Provider
      value={{
        user,
        role,
        profile,
        tickets,
        activeTicket,
        ticketHistory,
        bookTicket,
        cancelTicket,
        refreshTickets,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        logout,
        getAllUsers,
        updateUserRole,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
