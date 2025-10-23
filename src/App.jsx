import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
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
// import Profile from "./pages/Profile";

export default function App() {
  const { loading, isAuthenticated } = useAuth();

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
          <Route path="/manage" element={<UserManagement/>} />
          <Route path="/profile" element={<ProfilePage/>} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/auth"} />} />
      </Routes>
    </Router>
  );
}