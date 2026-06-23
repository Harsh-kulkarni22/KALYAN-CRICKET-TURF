"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, LogOut, ChevronDown, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, isLoggedIn, logout, isLoading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
  };

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="w-full max-w-md md:max-w-3xl lg:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Brand/Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-playoGreen text-white flex items-center justify-center font-bold text-lg">
            K
          </div>
          <span className="font-bold text-[#2A364E] text-lg tracking-tight">KALYAN</span>
        </Link>

        {/* Navigation Center Links - Desktop Only */}
        <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-[#2A364E]/80">
          <Link href="/" className="hover:text-playoGreen transition-colors">Home</Link>
          <Link href="/book" className="hover:text-playoGreen transition-colors">Book Turf</Link>
          {isLoggedIn && (
            <Link href="/profile/bookings" className="hover:text-playoGreen transition-colors">My Bookings</Link>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center">
          {!isLoading && (
            <>
              {!isLoggedIn ? (
                <Link
                  href="/auth"
                  className="bg-playoGreen text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-green-600 transition-colors shadow-sm"
                >
                  Login
                </Link>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 hover:bg-gray-50 p-1 pr-2 rounded-full border border-gray-200 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#2A364E] text-white flex items-center justify-center text-sm font-bold shadow-inner">
                      {user?.name?.charAt(0).toUpperCase() || <User size={16} />}
                    </div>
                    <ChevronDown size={16} className={`text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 overflow-hidden transform origin-top-right transition-all">
                      <div className="px-4 py-2 border-b border-gray-50">
                        <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email || user?.phone}</p>
                      </div>

                      {user?.role === "admin" && (
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            router.push("/admin");
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm font-semibold text-playoGreen hover:bg-green-50 flex items-center gap-2 transition-colors border-b border-gray-100"
                        >
                          <Settings size={16} className="text-playoGreen" />
                          Admin Panel
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          router.push("/profile");
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <User size={16} className="text-gray-400" />
                        My Profile
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                      >
                        <LogOut size={16} className="text-red-400" />
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
