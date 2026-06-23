"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <div className="bg-[#0f172a] min-h-screen text-slate-100 antialiased">
        {children}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="w-full max-w-md md:max-w-3xl lg:max-w-7xl mx-auto bg-white min-h-screen shadow-md relative">
        {children}
      </div>
    </div>
  );
}
