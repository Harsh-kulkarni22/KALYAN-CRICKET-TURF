"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  Users, 
  TrendingUp, 
  FileText, 
  Settings, 
  Bell, 
  Menu, 
  X, 
  LogOut,
  ChevronLeft,
  Check,
  Star
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

interface NotificationItem {
  _id: string;
  type: 'new_booking' | 'cancelled_booking' | 'payment_received';
  message: string;
  read: boolean;
  createdAt: string;
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [groups, setGroups] = useState<{ today: NotificationItem[], yesterday: NotificationItem[], older: NotificationItem[] }>({
    today: [],
    yesterday: [],
    older: []
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Bookings", href: "/admin/bookings", icon: BookOpen },
    { name: "Calendar", href: "/admin/calendar", icon: Calendar },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Reviews", href: "/admin/reviews", icon: Star },
    { name: "Analytics", href: "/admin/analytics", icon: TrendingUp },
    { name: "Reports", href: "/admin/reports", icon: FileText },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("turf_token");
      if (!token) return;

      const [listRes, countRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/notifications`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/notifications/unread-count`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (listRes.ok) {
        const data = await listRes.json();
        if (Array.isArray(data)) {
          setNotifications(data);
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const tList: NotificationItem[] = [];
          const yList: NotificationItem[] = [];
          const oList: NotificationItem[] = [];
          data.forEach(n => {
            const c = new Date(n.createdAt);
            if (c >= today) tList.push(n);
            else if (c >= yesterday) yList.push(n);
            else oList.push(n);
          });
          setGroups({ today: tList, yesterday: yList, older: oList });
        } else {
          setNotifications(data.notifications || []);
          setGroups(data.groups || { today: [], yesterday: [], older: [] });
        }
      }
      if (countRes.ok) {
        const countData = await countRes.json();
        setUnreadCount(countData.count);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  // Handle outside clicks to close notifications dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("turf_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setGroups(prev => ({
          today: prev.today.map(n => ({ ...n, read: true })),
          yesterday: prev.yesterday.map(n => ({ ...n, read: true })),
          older: prev.older.map(n => ({ ...n, read: true }))
        }));
        toast.success("All notifications marked as read");
      }
    } catch (err) {
      toast.error("Failed to mark notifications as read");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/auth");
  };

  const getBadgeColor = (type: string) => {
    switch(type) {
      case 'new_booking': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'cancelled_booking': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'payment_received': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const renderNotificationGroup = (title: string, list: NotificationItem[]) => {
    if (!list || list.length === 0) return null;
    return (
      <div className="space-y-1 mb-3">
        <h5 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{title}</h5>
        {list.map(n => (
          <div key={n._id} className={`p-3 border-b border-slate-800/35 hover:bg-slate-800/40 transition text-xs ${!n.read ? 'bg-slate-800/20' : ''}`}>
            <div className="flex justify-between items-center mb-1">
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold border ${getBadgeColor(n.type)}`}>
                {n.type.replace('_', ' ')}
              </span>
              <span className="text-[10px] text-slate-500">{new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <p className="text-slate-300 font-medium leading-relaxed">{n.message}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Top Mobile Nav Bar */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-[#1e293b] border-b border-slate-800 sticky top-0 z-30 w-full">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <span className="font-bold text-white text-lg tracking-wide">KALYAN ADMIN</span>
        </div>

        {/* Bell Icon for Mobile */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 relative transition"
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          
          {/* Notifications Dropdown for Mobile */}
          {notifDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[#1e293b] border border-slate-800 rounded-xl shadow-2xl z-40 py-2">
              <div className="px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                <span className="font-semibold text-sm text-slate-200">Admin Alerts</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead} 
                    className="text-xs text-playoGreen hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto no-scrollbar py-2">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs">No alerts yet.</div>
                ) : (
                  <>
                    {renderNotificationGroup("Today", groups.today)}
                    {renderNotificationGroup("Yesterday", groups.yesterday)}
                    {renderNotificationGroup("Older", groups.older)}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Sidebar Container */}
      <aside className={`fixed inset-y-0 left-0 bg-[#0f172a] lg:bg-[#1e293b]/55 lg:backdrop-blur-md border-r border-slate-800 w-64 z-40 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col justify-between`}>
        <div>
          {/* Logo Section */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-playoGreen text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-playoGreen/20">
                K
              </div>
              <span className="font-black text-white text-xl tracking-wider">KALYAN</span>
            </Link>
            <button 
              className="lg:hidden p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              onClick={() => setIsOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive 
                      ? "bg-playoGreen text-white shadow-lg shadow-playoGreen/25 translate-x-1" 
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
                  }`}
                >
                  <Icon size={19} className={isActive ? "text-white" : "text-slate-400"} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Panel (Notifications dropdown & logout) */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          
          {/* Desktop Notifications Bell (Hidden on Mobile) */}
          <div className="hidden lg:block relative" ref={dropdownRef}>
            <button 
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 transition duration-200"
            >
              <div className="flex items-center gap-3.5">
                <Bell size={19} />
                <span>Alerts</span>
              </div>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Desktop Notifications Dropdown */}
            {notifDropdownOpen && (
              <div className="absolute left-full bottom-0 ml-2 w-80 bg-[#1e293b] border border-slate-850 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-left-2 duration-250">
                <div className="px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                  <span className="font-semibold text-sm text-slate-200">Admin Alerts</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead} 
                      className="text-xs text-playoGreen hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto no-scrollbar py-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">No alerts yet.</div>
                  ) : (
                    <>
                      {renderNotificationGroup("Today", groups.today)}
                      {renderNotificationGroup("Yesterday", groups.yesterday)}
                      {renderNotificationGroup("Older", groups.older)}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Go Back to Client Area */}
          <Link 
            href="/"
            className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 transition"
          >
            <ChevronLeft size={19} />
            <span>Customer View</span>
          </Link>

          {/* Logout */}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
          >
            <LogOut size={19} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 lg:hidden z-30 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
