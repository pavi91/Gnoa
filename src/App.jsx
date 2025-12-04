import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { supabase } from "./supabaseClient";
import Modal from "./components/Modal"; 

import Auth from "./components/Auth";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import AppliedMembers from "./pages/AppliedMembers";
import AddAppliedMembers from "./pages/AddMembers";
import ExMember from "./pages/ExMembers";
import UserManagement from "./pages/AddUser";
import ProfilePage from "./components/ProfilePage";
import Form from "./pages/ExternalMembers";

export default function App() {
  const { loading, isAuthenticated, user } = useAuth();
  const [showLockModal, setShowLockModal] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const isLocked = session.user.user_metadata?.is_locked;
        if (isLocked) {
          await supabase.auth.signOut();
          setShowLockModal(true); 
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLockAcknowledgment = () => {
    setShowLockModal(false);
    window.location.href = "/auth"; 
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Modal
        isOpen={showLockModal}
        onClose={handleLockAcknowledgment} 
        title="Account Locked"
        actions={
          <button
            onClick={handleLockAcknowledgment}
            className="px-6 py-2 bg-[#800000] text-white rounded-lg hover:bg-[#600000] transition font-medium shadow-md"
          >
            Okay, I Understand
          </button>
        }
      >
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-red-600">Access Denied</p>
          <p>Your account has been locked by an administrator. You have been signed out for security reasons.</p>
          <p className="text-sm text-gray-500 mt-2">Please contact the system administrator if you believe this is an error.</p>
        </div>
      </Modal>

      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/form" element={<Form />} />
        
        <Route 
          path="/auth" 
          element={!isAuthenticated ? <Auth /> : <Navigate to="/dashboard" />} 
        />

        {/* Protected routes with layout */}
        <Route element={isAuthenticated ? <Layout /> : <Navigate to="/auth" />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/applied" element={<AppliedMembers />} />
          <Route path="/add" element={<AddAppliedMembers />} />
          <Route path="/ex" element={<ExMember/>} />
          
          {/* Admin-only: User Management */}
          <Route 
            path="/manage" 
            element={
              user?.user_metadata?.role === 'admin' 
                ? <UserManagement /> 
                : <Navigate to="/dashboard" replace />
            } 
          />

          {/* Admin-only: Profile (MOVED HERE & FIXED SYNTAX) */}
          <Route
            path="/profile"
            element={
              user?.user_metadata?.role === 'admin'
                ? <ProfilePage />
                : <Navigate to="/dashboard" replace />
            }
          />
        </Route>

        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/auth"} />} />
      </Routes>
    </Router>
  );
}