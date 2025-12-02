import React, { useEffect } from "react"; // 1. Added useEffect
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { supabase } from "./supabaseClient"; // 2. Ensure Supabase is imported
import Auth from "./components/Auth";
// import Account from "./components/Account";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import AppliedMembers from "./pages/AppliedMembers";
import AddAppliedMembers from "./pages/AddMembers";
import ExMember from "./pages/ExMembers";
import UserManagement from "./pages/AddUser";
import ProfilePage from "./components/ProfilePage";
import Form from "./pages/ExternalMembers";
// import Profile from "./pages/Profile";

export default function App() {
  const { loading, isAuthenticated, user } = useAuth();

  // --- NEW: LOCK ENFORCEMENT LISTENER ---
  useEffect(() => {
    // This listener runs whenever Auth state changes (login, refresh, navigation)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      
      if (session?.user) {
        // Check if the administrator has set the 'is_locked' flag
        const isLocked = session.user.user_metadata?.is_locked;

        if (isLocked) {
          // 1. Force Sign Out
          await supabase.auth.signOut();
          
          // 2. Alert the user
          alert("Administrator has locked this account. Please contact support.");
          
          // 3. Force redirect to Auth page (using window.location because we are outside Router)
          window.location.href = "/auth"; 
        }
      }
    });

    // Cleanup listener on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  // ---------------------------------------

  // Show loading state while auth is being checked
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
      <Routes>
        {/* Public route */}
        <Route path="/" element={<Auth />} />
        <Route path="/form" element={<Form />} />
        
        {/* Auth route */}
        <Route 
          path="/auth" 
          element={!isAuthenticated ? <Auth /> : <Navigate to="/dashboard" />} 
        />

        {/* Protected routes with layout */}
        <Route element={isAuthenticated ? <Layout /> : <Navigate to="/auth" />}>
          <Route path="/dashboard" element={<Dashboard />} />
          {/* <Route path="/profile" element={<Account />} /> */}
          <Route path="/applied" element={<AppliedMembers />} />
          <Route path="/add" element={<AddAppliedMembers />} />
          <Route path="/ex" element={<ExMember/>} />
          <Route path="/profile" element={<ProfilePage/>} />
          
          {/* Admin-only route */}
          <Route 
            path="/manage" 
            element={
              // Check if the user's role is 'admin'
              user?.user_metadata?.role === 'admin' 
                ? <UserManagement /> 
                : <Navigate to="/dashboard" replace />
            } 
          />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/auth"} />} />
      </Routes>
    </Router>
  );
}