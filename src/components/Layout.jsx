import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Adjust path as needed
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Auth context
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Optionally show error toast/notification
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="flex">
        {/* Desktop Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={handleSidebarToggle}
          user={user} // Pass user info to sidebar
          onLogout={handleLogout} // Pass logout handler
          isMobile={false}
        />
        
        {/* Mobile Sidebar */}
        <Sidebar
          isOpen={mobileMenuOpen}
          onToggle={handleMobileMenuToggle}
          onClose={handleMobileMenuClose}
          user={user} // Pass user info to mobile sidebar
          onLogout={handleLogout} // Pass logout handler
          isMobile={true}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          <Header 
            onMenuClick={handleMobileMenuToggle} 
            user={user} // Pass user info to header
            onLogout={handleLogout} // Pass logout handler
          />
          
          {/* Page Content - This is where routed components will be injected */}
          <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50/50 via-white to-blue-50/30">
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="max-w-7xl mx-auto">
                {/* Outlet renders the matched route component */}
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;