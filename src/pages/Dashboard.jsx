import React, { useState, useEffect } from 'react';
import { supabase } from "../supabaseClient"; // Import your supabase client
import { Link as RouterLink } from 'react-router-dom';
import {
  UserCheck,
  UserPlus,
  Users,
  UserRoundPlus,
  ArrowRight
} from 'lucide-react';

// --- Helper Data ---

// 1. Quick Access Menu Items
const quickAccessItems = [
  {
    icon: UserCheck,
    title: 'Applications',
    description: 'Manage applications',
    path: '/applied'
  },
  {
    icon: UserPlus,
    title: 'Add Members',
    description: 'Add new members',
    path: '/add'
  },
  {
    icon: Users,
    title: 'Members',
    description: 'Manage members',
    path: '/ex'
  },
  {
    icon: UserRoundPlus,
    title: 'Users',
    description: 'Manage users',
    path: '/manage'
  }
];

// 2. Today's Date Formatter
const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

// --- Main Component ---

export default function GNOADashboard() {
  const [userName, setUserName] = useState('User');

  // Fetch user data from Supabase on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Attempt to get the user's full name from metadata
          const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name;
          
          if (name) {
            setUserName(name.split(' ')[0]); // Use first name
          } else {
            // Fallback to the first part of their email
            setUserName(session.user.email.split('@')[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching user session:", error);
      }
    };

    fetchUser();
  }, []);

  return (
    // ✅ FIX: Removed the "bg-[#f4f7f8]" class from this div
    <div className="flex-grow p-2 md:p-3">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header - UPDATED GRADIENT */}
        <div
          className="bg-gradient-to-r from-[#2563eb] to-[#800000] text-white p-3 md:p-4 mb-4 rounded-xl relative overflow-hidden shadow-[0_8px_24px_rgba(128,0,0,0.18)]"
        >
          {/* Decorative Circles */}
          <div className="absolute -top-[50px] -right-[70px] w-[200px] h-[200px] bg-white/[0.08] rounded-full" />
          <div className="absolute -bottom-[60px] right-10 w-[150px] h-[150px] bg-white/[0.05] rounded-full" />
          
          <h1 
            className="text-3xl font-bold relative"
          >
            Good Morning, {userName}!
          </h1>
          <p 
            className="opacity-90 mt-1 relative"
          >
            Welcome to your GNOA Management Portal. Everything you need to
            manage the organiztional member information is right here.
          </p>
          <p 
            className="opacity-80 mt-2 font-medium relative"
          >
            Today is {today}
          </p>
        </div>

        {/* Quick Access Section */}
        <h2 
          className="text-2xl font-bold mb-3 text-[#333]" // Matches Template Text #333333
        >
          Quick Access
        </h2>

        {/* Grid of Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {quickAccessItems.map((item) => {
            const Icon = item.icon; // Get the icon component
            return (
              <div key={item.title} className="h-full flex flex-col rounded-xl bg-white shadow-[0_4px_12px_rgba(79,70,229,0.04)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(79,70,229,0.08)]">
                <div className="text-center p-3 flex-grow">
                  {/* Icon (Matches Template Accent #4F46E5) */}
                  <div className="bg-[#eef2ff] text-[#4f46e5] w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">
                    {item.description}
                  </p>
                </div>
                <div className="flex justify-center p-2 pt-0">
                  <RouterLink
                    to={item.path}
                    className="font-semibold no-underline text-[#4f46e5] flex items-center" // Matches Template Accent #4F46E5
                  >
                    Access
                    <ArrowRight size={16} className="ml-1" />
                  </RouterLink>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}