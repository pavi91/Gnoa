import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Search, UserPlus, Trash2, AlertCircle, CheckCircle } from "lucide-react";

const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/getUsers`;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [token, setToken] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Get JWT for requests
  useEffect(() => {
    const getToken = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        setToken(data.session.access_token);
      } else {
        setError("Please log in to manage users.");
      }
    };
    getToken();
  }, []);

  // Fetch users
  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch users");
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  // Delete user
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${BASE_URL}?userId=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setSuccess("User deleted successfully.");
    } catch (err) {
      setError(err.message);
    }
  };

  // Create user
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newEmail || !newPassword) {
      setError("Email and password are required.");
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          user_metadata: { name: newName, role: newRole },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      setUsers((prev) => [...prev, data.user]);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("user");
      setSuccess("User created successfully.");
      setShowCreateForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  // Update user role
  const handleRoleChange = async (id, role) => {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(BASE_URL, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: id, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update role failed");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, user_metadata: { ...u.user_metadata, role } } : u
        )
      );
      setSuccess("User role updated successfully.");
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.user_metadata?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    // ✅ FIX: Removed bg-[#F4F7F8]
    <div className="min-h-screen p-6 font-sans">
      <div className="">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#333]">User Management</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 bg-[#800000] text-white px-4 py-2 rounded-lg hover:bg-[#600000] transition"
          >
            <UserPlus size={20} />
            {showCreateForm ? "Close Form" : "Add User"}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
            <CheckCircle size={20} />
            {success}
          </div>
        )}

        {/* Create User Form */}
        {showCreateForm && (
          <div className="bg-white p-6 rounded-xl shadow-lg mb-6 transition-all duration-300"> {/* Professional Touch: Softer shadow-xl */}
            <h2 className="text-xl font-semibold text-[#333] mb-4">Add New User</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <label htmlFor="newName" className="text-sm font-medium text-gray-600 mb-1">Name</label>
                <input
                  id="newName"
                  type="text"
                  placeholder="Enter name (optional)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="border border-gray-200 p-2 rounded-lg focus:ring-2 focus:ring-[#800000] focus:outline-none" /* Professional Touch: Lighter border */
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="newEmail" className="text-sm font-medium text-gray-600 mb-1">Email</label>
                <input
                  id="newEmail"
                  type="email"
                  placeholder="Enter email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="border border-gray-200 p-2 rounded-lg focus:ring-2 focus:ring-[#800000] focus:outline-none" /* Professional Touch: Lighter border */
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="newPassword" className="text-sm font-medium text-gray-600 mb-1">Password</label>
                <input
                  id="newPassword"
                  type="password"
                  placeholder="Enter password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="border border-gray-200 p-2 rounded-lg focus:ring-2 focus:ring-[#800000] focus:outline-none" /* Professional Touch: Lighter border */
                />
              </div>
              <div className="flex flex-col md:flex-row items-end gap-2">
                <div className="flex flex-col w-full md:w-auto">
                  <label htmlFor="newRole" className="text-sm font-medium text-gray-600 mb-1">Role</label>
                  <select
                    id="newRole"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="border border-gray-200 p-2 rounded-lg focus:ring-2 focus:ring-[#800000] focus:outline-none" /* Professional Touch: Lighter border */
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-[#800000] text-white px-4 py-2 rounded-lg hover:bg-[#600000] transition w-full md:w-auto"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search Bar */}
        <div className="flex items-center mb-6 bg-white p-4 rounded-xl shadow-lg"> {/* Professional Touch: Softer shadow-xl */}
          <Search className="text-gray-400 mr-2" size={20} />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-grow p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#800000] focus:outline-none" /* Professional Touch: Lighter border */
          />
          <button
            onClick={fetchUsers}
            className="ml-4 bg-[#800000] text-white px-4 py-2 rounded-lg hover:bg-[#600000] transition"
          >
            Refresh
          </button>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="text-center text-gray-500 py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#800000] mx-auto"></div>
            <p className="mt-2">Loading users...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden"> {/* Professional Touch: Softer shadow-xl */}
            <table className="w-full">
              <thead>
                <tr className="bg-[#800000]/10 text-[#333] text-left text-sm uppercase tracking-wider">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Created At</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`border-t ${index % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-[#800000]/5 transition`}
                  >
                    <td className="p-4">{user.user_metadata?.name || "—"}</td>
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">
                      <select
                        value={user.user_metadata?.role || "user"}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="border border-gray-200 p-1 rounded-lg bg-white focus:ring-2 focus:ring-[#800000] focus:outline-none" /* Professional Touch: Lighter border */
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-4">
                      {new Date(user.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;