import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { 
  Search, 
  UserPlus, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  FileText, 
  X, 
  Lock,   // Import Lock
  Unlock  // Import Unlock
} from "lucide-react";

const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/getUsers`;

const UserManagement = () => {
  // ... existing state ...
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Create User State
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Auth Token
  const [token, setToken] = useState("");

  // Logs State
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userLogs, setUserLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

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

  const handleViewLogs = async (user) => {
    setSelectedUser(user);
    setShowLogModal(true);
    setLogsLoading(true);
    
    const { data, error } = await supabase
      .from('user_logs') 
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching logs:", error);
    } else {
      setUserLogs(data || []);
    }
    setLogsLoading(false);
  };

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
          user_metadata: { name: newName, role: newRole, is_locked: false }, // Default not locked
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

  // --- NEW: HANDLE LOCK TOGGLE ---
  const handleLockToggle = async (user) => {
    const isLocked = user.user_metadata?.is_locked || false;
    const newLockStatus = !isLocked;
    const confirmMessage = newLockStatus 
      ? "Are you sure you want to LOCK this account? The user will be signed out immediately." 
      : "Are you sure you want to UNLOCK this account?";

    if (!window.confirm(confirmMessage)) return;

    setError(null);
    setSuccess(null);

    try {
      // Note: We are sending 'user_metadata' to the PATCH endpoint.
      // Your Edge Function must support updating 'user_metadata'.
      const res = await fetch(BASE_URL, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          userId: user.id, 
          // We merge existing metadata with the new lock status
          user_metadata: { ...user.user_metadata, is_locked: newLockStatus } 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update lock status failed");

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id 
            ? { ...u, user_metadata: { ...u.user_metadata, is_locked: newLockStatus } } 
            : u
        )
      );
      
      setSuccess(newLockStatus ? "Account locked successfully." : "Account unlocked successfully.");
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
    <div className="min-h-screen p-6 font-sans relative">
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
          <div className="bg-white p-6 rounded-xl shadow-lg mb-6 transition-all duration-300">
             {/* ... Form Code remains same ... */}
             <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
               {/* ... Inputs ... */}
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-600 mb-1">Name</label>
                    <input
                    type="text"
                    placeholder="Enter name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="border border-gray-200 p-2 rounded-lg focus:ring-2 focus:ring-[#800000] focus:outline-none"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-600 mb-1">Email</label>
                    <input
                    type="email"
                    placeholder="Enter email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="border border-gray-200 p-2 rounded-lg focus:ring-2 focus:ring-[#800000] focus:outline-none"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-600 mb-1">Password</label>
                    <input
                    type="password"
                    placeholder="Enter password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="border border-gray-200 p-2 rounded-lg focus:ring-2 focus:ring-[#800000] focus:outline-none"
                    />
                </div>
                <div className="flex flex-col md:flex-row items-end gap-2">
                    <div className="flex flex-col w-full md:w-auto">
                    <label className="text-sm font-medium text-gray-600 mb-1">Role</label>
                    <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="border border-gray-200 p-2 rounded-lg focus:ring-2 focus:ring-[#800000] focus:outline-none"
                    >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                    </div>
                    <button
                    type="submit"
                    className="bg-[#800000] text-white px-4 py-2 rounded-lg hover:bg-[#600000] transition w-full md:w-auto"
                    >
                    Create
                    </button>
                </div>
            </form>
          </div>
        )}

        {/* Search Bar */}
        <div className="flex items-center mb-6 bg-white p-4 rounded-xl shadow-lg">
          <Search className="text-gray-400 mr-2" size={20} />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-grow p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#800000] focus:outline-none"
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
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#800000]/10 text-[#333] text-left text-sm uppercase tracking-wider">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th> {/* New Column */}
                  <th className="p-4">Created At</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => {
                  const isLocked = user.user_metadata?.is_locked;

                  return (
                    <tr
                      key={user.id}
                      className={`border-t ${index % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-[#800000]/5 transition ${isLocked ? "bg-red-50" : ""}`}
                    >
                      <td className="p-4">
                        <div className="flex flex-col">
                            <span>{user.user_metadata?.name || "—"}</span>
                            {isLocked && <span className="text-xs text-red-600 font-bold">LOCKED</span>}
                        </div>
                      </td>
                      <td className="p-4">{user.email}</td>
                      <td className="p-4">
                        <select
                          value={user.user_metadata?.role || "user"}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="border border-gray-200 p-1 rounded-lg bg-white focus:ring-2 focus:ring-[#800000] focus:outline-none"
                          disabled={isLocked} // Optional: Disable role change if locked
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      {/* Status Column */}
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isLocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {isLocked ? 'Locked' : 'Active'}
                        </span>
                      </td>
                      <td className="p-4">
                        {new Date(user.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                           {/* --- NEW: LOCK BUTTON --- */}
                           <button
                            onClick={() => handleLockToggle(user)}
                            title={isLocked ? "Unlock Account" : "Lock Account"}
                            className={`px-3 py-1 rounded-lg transition flex items-center gap-2 border ${
                              isLocked 
                                ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100" 
                                : "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                            }`}
                          >
                            {isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                          </button>

                          <button
                            onClick={() => handleViewLogs(user)}
                            className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-200 transition flex items-center gap-2 border border-gray-300"
                          >
                            <FileText size={16} />
                            Logs
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100 transition flex items-center gap-2 border border-red-200"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Logs Modal (Existing Code) */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            {/* ... Modal content same as before ... */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-[#800000]/5">
              <div>
                <h2 className="text-xl font-bold text-[#333]">Activity Logs</h2>
                <p className="text-sm text-gray-600">
                  History for <span className="font-semibold">{selectedUser?.email}</span>
                </p>
              </div>
              <button onClick={() => setShowLogModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-grow">
              {logsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#800000] mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading history...</p>
                </div>
              ) : userLogs.length > 0 ? (
                <div className="space-y-4">
                  {userLogs.map((log) => (
                    <div key={log.id} className="border-l-4 border-[#800000] pl-4 py-2 bg-gray-50 rounded-r-lg">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-gray-800">{log.action}</h4>
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{log.details || "No details provided"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <FileText size={48} className="mx-auto mb-2 opacity-20" />
                  <p>No activity logs found for this user.</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end">
              <button onClick={() => setShowLogModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;