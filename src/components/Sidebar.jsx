import React, { useState, useMemo } from 'react'; // <--- CHANGE 1: Import useMemo
import { Link, useLocation } from 'react-router-dom';
import gnoaLogo from '../assets/gnoa_logo.jpg';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  X,
  UserRoundPlus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; // <--- CHANGE 2: Import useAuth

/**
 * A modern, professional sidebar component for navigation.
 * * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Whether the sidebar is open or collapsed (for mobile).
 * @param {boolean} props.isMobile - Whether the view is mobile.
 * @param {function} props.onClose - Function to close the sidebar (mobile).
 */
const Sidebar = ({ isOpen, isMobile, onClose }) => {
  const location = useLocation();
  const [isDesktopOpen, setIsDesktopOpen] = useState(false);
  
  // <--- CHANGE 3: Get user and determine if admin ---
  const { user } = useAuth();
  const isAdmin = user?.user_metadata?.role === 'admin';
  // --------------------------------------------------

  // <--- CHANGE 4: Use useMemo to build the menu items list ---
  const menuItems = useMemo(() => {
    // Start with the items everyone can see
    const items = [
      {
        icon: LayoutDashboard,
        label: 'Dashboard',
        path: '/dashboard',
      },
      {
        icon: UserCheck,
        label: 'Applications',
        path: '/applied',
        // badge: 126
      },
      {
        icon: UserPlus,
        label: 'Add Members',
        path: '/add',
      },
      {
        icon: Users,
        label: 'Members',
        path: '/ex',
      },
    ];

    // Conditionally add the admin-only item
    if (isAdmin) {
      items.push({
        icon: UserRoundPlus,
        label: 'Users',
        path: '/manage',
      });
    }

    return items;
  }, [isAdmin]); // This list will only recalculate when isAdmin changes
  // ------------------------------------------------------------

  const sidebarContent = (
    <div className="h-full flex flex-col bg-white border-r border-slate-200">
      
      {/* Header */}
      <div className={`flex items-center ${isMobile ? (isOpen ? 'justify-between px-6' : 'justify-center px-4') : (isDesktopOpen ? 'justify-between px-6' : 'justify-center px-4')} py-6 border-b border-slate-200`}>
        {(isMobile ? isOpen : isDesktopOpen) && (
          <div className="flex items-center gap-3">
            <img 
              src={gnoaLogo} 
              alt="GNOA Logo" 
              className="h-10 w-auto"
            />
            <div>
              {/* UPDATED LOGO GRADIENT */}
              <h2 className="text-xl font-bold bg-gradient-to-r from-[#2563eb] to-[#800000] bg-clip-text text-transparent">
                GNOA
              </h2>
              <p className="text-xs text-slate-500 font-medium">Management Portal</p>
            </div>
          </div>
        )}

        {!(isMobile ? isOpen : isDesktopOpen) && (
          <img 
            src={gnoaLogo} 
            alt="GNOA Logo" 
            className="w-8 h-8 object-contain"
          />
        )}

        {isMobile && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-600" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${isMobile ? (isOpen ? 'px-4' : 'px-3') : (isDesktopOpen ? 'px-4' : 'px-3')} py-6 space-y-2 overflow-y-auto`}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={isMobile ? onClose : undefined}
              className={`
                group relative flex items-center w-full rounded-xl transition-all duration-200 no-underline
                ${isMobile ? (isOpen ? 'px-3 py-2.5' : 'p-3 justify-center') : (isDesktopOpen ? 'px-3 py-2.5' : 'p-3 justify-center')}
                ${isActive
                  ? 'bg-[#800000]/10 text-[#800000] font-semibold' // UPDATED Active state
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                }
              `}
            >
              {/* Active indicator - UPDATED */}
              {isActive && (isMobile ? isOpen : isDesktopOpen) && (
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-[#800000] rounded-r-full"></div>
              )}

              <div className={`flex items-center ${isMobile ? (isOpen ? 'gap-3' : '') : (isDesktopOpen ? 'gap-3' : '')}`}>
                <Icon
                  size={20}
                  className={`flex-shrink-0 transition-colors ${
                    isActive
                      ? 'text-[#800000]' // UPDATED Active icon
                      : 'text-slate-400 group-hover:text-slate-500' // More subtle default icon
                  }`}
                />

                {(isMobile ? isOpen : isDesktopOpen) && (
                  <div className="flex-1 text-left">
                    <div className="text-sm">{item.label}</div>
                  </div>
                )}
              </div>

              {/* Badge */}
              {(isMobile ? isOpen : isDesktopOpen) && item.badge && (
                <div className={`
                  px-2 py-0.5 rounded-full text-xs font-semibold transition-colors
                  ${isActive
                    ? 'bg-[#800000]/20 text-[#800000]' // UPDATED Active badge
                    : 'bg-red-100 text-red-700' // Keep red for non-active alerts
                  }
                `}>
                  {item.badge}
                </div>
              )}

              {/* Tooltip for collapsed state - updated colors */}
              {!(isMobile ? isOpen : isDesktopOpen) && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                  {item.label}
                  <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-slate-80s00"></div>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`border-t border-slate-200 ${isMobile ? (isOpen ? 'px-4' : 'px-3') : (isDesktopOpen ? 'px-4' : 'px-3')} py-4`}>
        {(isMobile ? isOpen : isDesktopOpen) && (
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400">v2.1.0 • © 2025 GNOA</p>
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}

        {/* Mobile Sidebar */}
        <div className={`
          fixed left-0 top-0 h-full w-80 transform transition-transform duration-300 z-50 lg:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* Add a subtle shadow for elevation on mobile */}
          <div className="h-full shadow-xl">
            {sidebarContent}
          </div>
        </div>
      </>
    );
  }

  return (
    // Desktop sidebar
    <div
      className={`
      relative transition-all duration-300 ease-in-out hidden lg:block
      ${isDesktopOpen ? 'w-64' : 'w-20'}
    `}
      onMouseEnter={() => setIsDesktopOpen(true)}
      onMouseLeave={() => setIsDesktopOpen(false)}
    >
      {sidebarContent}
    </div>
  );
};

export default Sidebar;