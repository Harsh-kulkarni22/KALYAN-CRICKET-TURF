"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ChevronLeft, LogOut, User, MapPin, Loader2, Phone, Mail, Calendar, ChevronRight } from "lucide-react";

export default function Profile() {
  const { user, logout, isLoading, isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push("/auth");
    }
  }, [isLoading, isLoggedIn, router]);

  if (isLoading || !isLoggedIn) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-playoGreen" size={40} />
      </div>
    );
  }

  const renderSidebar = (active: "profile" | "bookings") => {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-playoGreen to-emerald-400 flex items-center justify-center text-white text-2xl font-bold shadow-md ring-4 ring-green-50">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h2 className="font-bold text-lg text-[#2A364E] mt-3">{user?.name}</h2>
          <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mt-1.5">Player</span>
        </div>

        <div className="space-y-1">
          <button
            onClick={() => router.push("/profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
              active === "profile" 
                ? "bg-[#2A364E] text-white shadow-sm" 
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <User size={16} />
            <span>Account Details</span>
          </button>
          <button
            onClick={() => router.push("/profile/bookings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
              active === "bookings" 
                ? "bg-[#2A364E] text-white shadow-sm" 
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Calendar size={16} />
            <span>My Bookings</span>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition"
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="flex items-center p-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10 lg:hidden">
        <button onClick={() => router.back()} className="p-2 -ml-2 mr-2">
          <ChevronLeft size={24} className="text-gray-700 hover:text-black transition" />
        </button>
        <span className="font-bold text-[#2A364E] text-lg tracking-tight">My Profile</span>
      </div>

      <div className="w-full px-4 lg:px-8 py-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
          
          {/* Desktop Left Sidebar (3 cols) */}
          <div className="hidden lg:block lg:col-span-3">
            {renderSidebar("profile")}
          </div>

          {/* Right Content Column (7 cols on desktop, full width on mobile) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Mobile Profile Card Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-center lg:hidden">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-playoGreen to-emerald-400 flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4 ring-4 ring-green-50">
                {user?.name?.charAt(0).toUpperCase() || <User size={40} />}
              </div>
              <h2 className="font-bold text-2xl text-[#2A364E] mb-1">{user?.name}</h2>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">
                <MapPin size={14} /> KALYAN cricket turf Player
              </div>
            </div>

            {/* Mobile Navigation Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-2 lg:hidden">
              <button
                onClick={() => router.push("/profile/bookings")}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition duration-150"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-800">My Turf Bookings</p>
                    <p className="text-xs text-gray-400 font-medium">View receipt invoices & cancel bookings</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Detailed Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h3 className="font-bold text-[#2A364E] text-[15px]">Account Details</h3>
              </div>
              <div className="divide-y divide-gray-50">
                <div className="p-5 flex items-center gap-4 hover:bg-gray-50 transition">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                    <Mail size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 font-medium mb-0.5">Email Address</p>
                    <p className="text-sm font-semibold text-gray-800">{user?.email || "Not Provided"}</p>
                  </div>
                </div>

                <div className="p-5 flex items-center gap-4 hover:bg-gray-50 transition">
                  <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                    <Phone size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 font-medium mb-0.5">Mobile Number</p>
                    <p className="text-sm font-semibold text-gray-800">{user?.phone || "Not Provided"}</p>
                  </div>
                </div>
                
                 <div className="p-5 flex items-center gap-4 hover:bg-gray-50 transition">
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
                     <User size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 font-medium mb-0.5">Authentication Provider</p>
                    <p className="text-sm font-semibold text-gray-800 capitalize">{user?.authType}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Log Out button */}
            <button
              onClick={logout}
              className="w-full lg:hidden mt-4 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-4 rounded-xl border border-red-100 transition active:scale-[0.98]"
            >
              <LogOut size={18} /> Log Out Securely
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
