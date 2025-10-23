import React, { useState, useEffect } from 'react';
import { supabase } from "../supabaseClient";
import { CheckCircle, AlertCircle, Edit3, Save, X, User } from "lucide-react";

const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/getUsers`;

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setToken(session.access_token);
        setUser(session.user);
        setNewName(session.user.user_metadata?.name || "");
      }
      setLoading(false);
    };
    init();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        window.location.href = '/login';
      } else if (session) {
        setToken(session.access_token);
        setUser(session.user);
        setNewName(session.user.user_metadata?.name || "");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateViaEdge = async (body) => {
    const res = await fetch(BASE_URL, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Update failed");
    return data;
  };

  const handleNameUpdate = async () => {
    if (!newName.trim()) {
      setError("Name is required.");
      return;
    }
    setUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      await updateViaEdge({
        userId: user.id,
        user_metadata: { name: newName }
      });
      setSuccess("Name updated successfully!");
      setEditingName(false);
      // Update local user (full refresh could be done via getUser, but for simplicity)
      setUser((prev) => ({ ...prev, user_metadata: { ...prev.user_metadata, name: newName } }));
      // Refresh session to persist
      const { data: { session } } = await supabase.auth.refreshSession();
      if (session) setToken(session.access_token);
    } catch (err) {
      setError(err.message || "Failed to update name.");
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      // Use edge function for consistency (admin set; user may need to re-login)
      await updateViaEdge({
        userId: user.id,
        password: newPassword
      });
      setSuccess("Password changed successfully! You may need to log in again.");
      setChangingPassword(false);
      setNewPassword("");
      setConfirmPassword("");
      // Optionally sign out to enforce re-login
      // await supabase.auth.signOut();
    } catch (err) {
      setError(err.message || "Failed to change password.");
    } finally {
      setUpdating(false);
    }
  };

  const role = user?.user_metadata?.role || "user";
  const displayRole = role.charAt(0).toUpperCase() + role.slice(1);
  const joinedDate = user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }) : "Unknown";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} className="text-red-500" />
            <span className="text-red-700">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
              <X size={16} />
            </button>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle size={20} className="text-green-500" />
            <span className="text-green-700">{success}</span>
            <button onClick={() => setSuccess(null)} className="ml-auto text-green-500 hover:text-green-700">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Profile Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User size={20} />
            Account Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg capitalize">{displayRole}</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Joined</label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{joinedDate}</p>
            </div>
          </div>
        </div>

        {/* Update Name Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Edit3 size={20} />
            Update Display Name
          </h2>
          <div className="space-y-4">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter your display name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
              disabled={!editingName || updating}
            />
            <div className="flex gap-3">
              {editingName ? (
                <>
                  <button
                    onClick={handleNameUpdate}
                    disabled={!newName.trim() || updating}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Save size={16} />
                    {updating ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setError(null);
                    }}
                    disabled={updating}
                    className="flex items-center gap-2 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50 transition"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditingName(true)}
                  disabled={updating}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  <Edit3 size={16} />
                  Edit Name
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Edit3 size={20} />
            Change Password
          </h2>
          {changingPassword ? (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                  disabled={updating}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                  disabled={updating}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={updating || newPassword !== confirmPassword || newPassword.length < 6}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Save size={16} />
                  {updating ? "Changing..." : "Change Password"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChangingPassword(false);
                    setNewPassword("");
                    setConfirmPassword("");
                    setError(null);
                  }}
                  disabled={updating}
                  className="flex items-center gap-2 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50 transition"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setChangingPassword(true)}
              disabled={updating}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              <Edit3 size={16} />
              Change Password
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;