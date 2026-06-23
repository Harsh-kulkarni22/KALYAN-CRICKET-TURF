"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminSidebar from "@/components/AdminSidebar";
import toast from "react-hot-toast";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoggedIn, isLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn) {
        toast.error("Please log in to access the admin panel.");
        router.push("/auth");
      } else if (user?.role !== "admin") {
        toast.error("Access Denied: Admin privileges required.");
        router.push("/");
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, isLoggedIn, isLoading, router]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a] text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-playoGreen"></div>
          <span className="text-sm font-medium tracking-wide">Securing connection...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0f172a] text-slate-100">
      {/* Sidebar Panel */}
      <AdminSidebar />

      {/* Main Administrative Views Panel */}
      <main className="flex-1 lg:pl-64 min-h-screen flex flex-col w-full overflow-x-hidden">
        <div className="p-4 lg:p-8 w-full max-w-7xl mx-auto flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
