import React, { useState, useEffect } from 'react';
import { 
  LogOut, 
  User, 
  ChevronDown,
  Menu
} from 'lucide-react';
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const Header = ({ onMenuClick }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Fetch user
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
    };
    getUser();
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-dropdown') && !event.target.closest('.profile-button')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Optionally, redirect to login page or update app state
    window.location.href = '/login'; // Adjust based on your routing
  };

  const name = user?.user_metadata?.name || 'User';
  const initials = name.split(' ').map(word => word[0]).join('').toUpperCase();
  const role = user?.user_metadata?.role === 'admin' ? 'Administrator' : 'User';

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors lg:hidden"
          >
            <Menu size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Right Section - Profile Only */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="profile-button flex items-center gap-2 p-2 hover:bg-gray-100 rounded-xl transition-colors group"
          >
            {/* UPDATED PROFILE BUBBLE GRADIENT */}
            <div className="w-8 h-8 bg-gradient-to-r from-[#2563eb] to-[#800000] rounded-lg flex items-center justify-center text-white text-sm font-semibold shadow-lg">
              {initials}
            </div>
            <ChevronDown size={14} className="text-gray-500 group-hover:text-gray-700 transition-colors" />
          </button>

          {/* Profile Menu */}
          {showProfileMenu && (
            <div className="profile-dropdown absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-semibold text-gray-900">{name}</p>
                <p className="text-xs text-gray-500">{role}</p>
              </div>
              <div className="py-1">
                <button
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50/70 transition-colors"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate("/profile");
                  }}
                >
                  <User size={16} />
                  Profile
                </button>
              </div>
              <div className="border-t border-gray-100 py-1">
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50/70 transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;