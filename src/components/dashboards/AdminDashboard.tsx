import { useCallback, useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { CheckCircle, Edit2, Loader, Search, Shield, TrendingUp, Users, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAllUsers, updateUserRole } from "@/services/userService";
import type { UserRecord, UserRole } from "@/types/user";

interface AdminDashboardProps {
  onError?: (error: string) => void;
}

const AdminDashboard = ({ onError }: AdminDashboardProps) => {
  const { user, role, actor, refreshUserRecord } = useAuth();
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<UserRole>("user");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && role !== "admin") {
      setError("You don't have permission to access this page");
      onError?.("Access Denied: Admin only");
    }
  }, [role, loading, onError]);

  const loadUsers = useCallback(async () => {
    setLoading(true);

    try {
      const users = await fetchAllUsers(actor);
      setAllUsers(users);
      setFilteredUsers(users);
      setError("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load users";
      console.error("Failed to load users:", err);
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  }, [actor, onError]);

  useEffect(() => {
    if (role === "admin") void loadUsers();
  }, [role, loadUsers]);

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

  const formatJoinedDate = (timestamp?: Timestamp): string => {
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

    setSaving(true);

    try {
      const err = await updateUserRole(actor, userId, editingRole);

      if (err) {
        setError(err);
        onError?.(err);
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
      const message = err instanceof Error ? err.message : "Failed to update role";
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

  // 🔥 Check admin access
  if (role !== "admin") {
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

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-12 text-center">
            <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Joined Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Action</th>
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
                          onChange={(e) => setEditingRole(e.target.value as UserRole)}
                          className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="user">👤 User (Passenger)</option>
                          <option value="driver">🚌 Driver</option>
                          <option value="admin">👨‍💼 Admin</option>
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
                              onClick={() => saveRoleChange(u.uid)}
                              disabled={saving}
                              className="px-4 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold disabled:opacity-50"
                            >
                              {saving ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={saving}
                              className="px-4 py-1 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors text-sm font-semibold disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEdit(u.uid, u.role)}
                            className="flex items-center gap-2 px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
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
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
