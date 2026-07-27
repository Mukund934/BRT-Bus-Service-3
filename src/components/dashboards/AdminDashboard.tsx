import { useCallback, useEffect, useId, useState } from "react";
import { CheckCircle, Edit2, Loader, Search, Shield, TrendingUp, Users, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toSafeMessage } from "@/domain/auth/errors";
import { PERMISSIONS, can } from "@/domain/auth/permissions";
import {
  MAX_USERS_PER_READ,
  fetchAllUsers,
  updateUserRole,
} from "@/services/userService";
import {
  USER_ROLES,
  type TimestampLike,
  type UserRecord,
  type UserRole,
} from "@/types/user";

interface AdminDashboardProps {
  onError?: (error: string) => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  user: "👤 User (Passenger)",
  driver: "🚌 Driver",
  admin: "👨‍💼 Admin",
};

const AdminDashboard = ({ onError }: AdminDashboardProps) => {
  const { user, actor, refreshUserRecord } = useAuth();

  const mayViewPanel = can(actor, PERMISSIONS.VIEW_ADMIN_PANEL);
  const mayAssignRoles = can(actor, PERMISSIONS.ASSIGN_ROLES);
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<UserRole>("user");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [truncated, setTruncated] = useState(false);

  const searchId = useId();

  const loadUsers = useCallback(async () => {
    setLoading(true);

    try {
      const roster = await fetchAllUsers(actor);
      setAllUsers(roster.users);
      setFilteredUsers(roster.users);
      setTruncated(roster.truncated);
      setError("");
    } catch (err) {
      const message = toSafeMessage(err, "Could not load users.");
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  }, [actor, onError]);

  useEffect(() => {
    if (!mayViewPanel) {
      setLoading(false);
      return;
    }

    void loadUsers();
  }, [mayViewPanel, loadUsers]);

  // Search functionality
  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(allUsers);
    } else {
      const filtered = allUsers.filter(
        (u) =>
          (u.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, allUsers]);

  const formatJoinedDate = (timestamp?: TimestampLike): string => {
    if (!timestamp) return "N/A";

    try {
      return timestamp.toDate().toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  const startEdit = (userId: string, currentRole: UserRole) => {
    setEditingUserId(userId);
    setEditingRole(currentRole);
    setError("");
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingUserId(null);
    setEditingRole("user");
    setError("");
  };

  // Save role change
  const saveRoleChange = async (userId: string) => {
    if (!editingRole) {
      setError("Please select a role");
      return;
    }

    if (!mayAssignRoles) {
      setError("You do not have permission to change roles.");
      return;
    }

    setSaving(true);

    try {
      const result = await updateUserRole(actor, userId, editingRole);

      if (!result.ok) {
        setError(result.message);
        onError?.(result.message);
        return;
      }

      const updatedUsers = allUsers.map((entry) =>
        entry.uid === userId ? { ...entry, role: editingRole } : entry
      );

      setAllUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
      setSuccess("Role updated successfully!");
      setEditingUserId(null);
      setEditingRole("user");

      setTimeout(() => setSuccess(""), 3000);

      // Demoting yourself must take effect immediately: a Firestore write
      // does not fire the auth listener, so the session would otherwise keep
      // the admin panel and admin privileges until a full reload.
      if (userId === user?.uid) await refreshUserRecord();
    } catch (err) {
      const message = toSafeMessage(err, "Could not update that role.");
      setError(message);
      onError?.(message);
    } finally {
      setSaving(false);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-300";
      case "driver":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-purple-100 text-purple-800 border-purple-300";
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "👨‍💼";
      case "driver":
        return "🚌";
      default:
        return "👤";
    }
  };

  // Calculate stats
  const stats = {
    total: allUsers.length,
    admins: allUsers.filter((u) => u.role === "admin").length,
    drivers: allUsers.filter((u) => u.role === "driver").length,
    users: allUsers.filter((u) => u.role === "user").length,
  };

  if (!mayViewPanel) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
          <Shield className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-700">Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Administrator Panel</h1>
        </div>
        <p className="text-gray-600">
          Welcome, {user?.displayName || "Admin"}. Manage all users and their roles.
        </p>
      </div>

      {/* Admin Info Card */}
      <div className="bg-white rounded-xl p-6 shadow-lg mb-8 border-l-4 border-blue-600">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Full Name</p>
            <p className="text-lg font-semibold text-gray-900">{user?.displayName || "Admin"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Email</p>
            <p className="text-lg font-semibold text-gray-900">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Role</p>
            <p className="text-lg font-semibold text-red-600">Administrator</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-lg border-t-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="w-12 h-12 text-purple-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-t-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Drivers</p>
              <p className="text-3xl font-bold text-gray-900">{stats.drivers}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-t-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Admins</p>
              <p className="text-3xl font-bold text-gray-900">{stats.admins}</p>
            </div>
            <Shield className="w-12 h-12 text-red-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-t-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Passengers</p>
              <p className="text-3xl font-bold text-gray-900">{stats.users}</p>
            </div>
            <Users className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <span className="text-red-600">{error}</span>
          <button onClick={() => setError("")} className="text-red-600 hover:text-red-700">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-600">{success}</span>
        </div>
      )}

      {/* User Management Section */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            <button
              onClick={() => void loadUsers()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>

          <div className="relative">
            <label htmlFor={searchId} className="sr-only">
              Search users by name or email
            </label>
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
              aria-hidden="true"
            />
            <input
              id={searchId}
              type="search"
              placeholder="Search by name or email…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Result count, announced as the search narrows. */}
          <p className="sr-only" role="status" aria-live="polite">
            {filteredUsers.length} of {allUsers.length} users shown
          </p>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-12 text-center" role="status" aria-live="polite">
            <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" aria-hidden="true" />
            <p className="text-gray-600">Loading users…</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" aria-hidden="true" />
            <p className="text-gray-600 font-medium">
              {searchTerm ? `No users match "${searchTerm}"` : "No users yet"}
            </p>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="mt-3 text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <caption className="sr-only">
                Registered users and their roles
              </caption>
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Joined date</th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                  <th scope="col" className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, index) => (
                  <tr key={u.uid} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold">
                          {getRoleIcon(u.role)}
                        </div>
                        <span className="text-gray-900 font-medium">
                          {u.name || u.email?.split("@")[0] || "Unknown"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-gray-600">{u.email || "N/A"}</td>

                    <td className="px-6 py-4 text-gray-600">
                      {formatJoinedDate(u.createdAt)}
                    </td>

                    <td className="px-6 py-4">
                      {editingUserId === u.uid ? (
                        <select
                          value={editingRole}
                          aria-label={`Role for ${u.name || u.email || "this user"}`}
                          onChange={(e) => {
                            // Narrowed against the registry rather than cast,
                            // so a tampered DOM cannot inject a role value.
                            const next = USER_ROLES.find(
                              (candidate) => candidate === e.target.value
                            );
                            if (next) setEditingRole(next);
                          }}
                          className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {USER_ROLES.map((option) => (
                            <option key={option} value={option}>
                              {ROLE_LABELS[option]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border ${getRoleColor(
                            u.role
                          )}`}
                        >
                          {getRoleIcon(u.role)}{" "}
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {editingUserId === u.uid ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveRoleChange(u.uid)}
                              disabled={saving}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold disabled:opacity-50"
                            >
                              {saving ? "Saving…" : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={saving}
                              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-semibold disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEdit(u.uid, u.role)}
                            disabled={!mayAssignRoles}
                            className="flex items-center gap-2 px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Edit2 className="w-4 h-4" aria-hidden="true" />
                            Edit
                            {/* Every row's button would otherwise read as "Edit". */}
                            <span className="sr-only">
                              {" "}
                              role for {u.name || u.email || "this user"}
                            </span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {!loading && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-center text-gray-700">
            Showing <span className="font-bold">{filteredUsers.length}</span> of{" "}
            <span className="font-bold">{allUsers.length}</span> users
          </p>

          {/*
            A truncated roster must never look complete: the counts above and
            the statistics cards describe only what was loaded.
          */}
          {truncated && (
            <p className="text-center text-amber-700 text-sm mt-2">
              Only the first {MAX_USERS_PER_READ} accounts were loaded. Counts and
              search cover this subset only.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
