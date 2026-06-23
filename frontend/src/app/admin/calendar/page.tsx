"use client";

import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { 
  X, 
  User, 
  Clock, 
  DollarSign, 
  CreditCard,
  CalendarDays,
  XCircle,
  Eye,
  CheckCircle,
  AlertTriangle,
  Phone,
  Mail
} from "lucide-react";
import toast from "react-hot-toast";

interface BookingItem {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  date: string;
  startTime: string;
  duration: number;
  totalAmount: number;
  paymentMethod: 'online' | 'cash';
  paymentStatus: string;
  bookingStatus: 'locked' | 'confirmed' | 'cancelled';
}

interface UserProfileData {
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    createdAt: string;
  };
  totalBookings: number;
  totalSpent: number;
  bookings: any[];
}

export default function AdminCalendar() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Side Panel State
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [dayBookings, setDayBookings] = useState<BookingItem[]>([]);
  
  // User Profile Modal inside Calendar
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [userLoading, setUserLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("turf_token");
      const [bookingsRes, settingsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/calendar`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/settings`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (bookingsRes.ok) {
        const bData = await bookingsRes.json();
        setBookings(bData.bookings);
      }
      if (settingsRes.ok) {
        setSettings(await settingsRes.json());
      }
    } catch (err) {
      toast.error("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update day bookings when selectedDate or bookings list changes
  useEffect(() => {
    if (selectedDate) {
      const filtered = bookings.filter(b => b.date === selectedDate && b.bookingStatus !== 'cancelled');
      setDayBookings(filtered);
    }
  }, [selectedDate, bookings]);

  const fetchUserProfile = async (userId: string) => {
    setUserLoading(true);
    setSelectedUserId(userId);
    try {
      const token = localStorage.getItem("turf_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUserProfile(await res.json());
      } else {
        toast.error("Failed to load customer profile");
        setSelectedUserId(null);
      }
    } catch (err) {
      toast.error("Error fetching user details");
      setSelectedUserId(null);
    } finally {
      setUserLoading(false);
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const token = localStorage.getItem("turf_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/bookings/${id}/cancel`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Booking cancelled");
        fetchData();
      } else {
        toast.error("Failed to cancel booking");
      }
    } catch (err) {
      toast.error("Error cancelling booking");
    }
  };

  const toMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const checkSlotOverlap = (slotStart: string, slotDur: number, bookStart: string, bookDur: number) => {
    const s1 = toMinutes(slotStart);
    const e1 = s1 + slotDur * 60;
    const s2 = toMinutes(bookStart);
    const e2 = s2 + bookDur * 60;
    return s1 < e2 && s2 < e1;
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 || 12;
    return `${displayH}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  // Generate background events for coloring dates
  const getBackgroundEvents = () => {
    const events: any[] = [];
    const openTime = settings?.openTime || "06:30";
    const closeTime = settings?.closeTime || "23:30";
    const totalOpHours = (toMinutes(closeTime) - toMinutes(openTime)) / 60;

    // Group bookings by date
    const dateMap: { [key: string]: number } = {};
    bookings.forEach(b => {
      if (b.bookingStatus === 'cancelled') return;
      dateMap[b.date] = (dateMap[b.date] || 0) + b.duration;
    });

    // Populate events
    Object.keys(dateMap).forEach(date => {
      const bookedHours = dateMap[date];
      let color = "#10b981"; // Green (default available)
      if (bookedHours >= totalOpHours) {
        color = "#ef4444"; // Red (Fully Booked)
      } else if (bookedHours > 0) {
        color = "#eab308"; // Yellow (Partially Booked)
      }

      events.push({
        start: date,
        display: "background",
        backgroundColor: color + "33", // add opacity
      });
    });

    return events;
  };

  // Generate standard events to show actual reservations in the monthly view
  const getBookingEvents = () => {
    return bookings
      .filter(b => b.bookingStatus !== 'cancelled')
      .map(b => ({
        id: b._id,
        title: `${b.userId?.name || 'Unknown'} (${b.startTime})`,
        start: `${b.date}T${b.startTime}:00`,
        backgroundColor: b.paymentMethod === 'online' ? '#3b82f6' : '#f59e0b',
        borderColor: b.paymentMethod === 'online' ? '#2563eb' : '#d97706',
        textColor: '#ffffff',
        extendedProps: b
      }));
  };

  // Generate the timeline for visual slots
  const renderTimeTimeline = () => {
    if (!settings) return null;
    const startHour = parseInt(settings.openTime.split(":")[0]);
    const endHour = parseInt(settings.closeTime.split(":")[0]);
    const timeline = [];

    for (let hr = startHour; hr <= endHour; hr++) {
      const hourStr = `${hr.toString().padStart(2, "0")}:00`;
      const matchingBooking = dayBookings.find(b => 
        checkSlotOverlap(hourStr, 1, b.startTime, b.duration)
      );

      timeline.push({
        time: hourStr,
        booking: matchingBooking
      });
    }

    return (
      <div className="space-y-2.5 mt-4">
        <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wider mb-2">Hourly Occupancy</h4>
        {timeline.map((item, idx) => {
          // Format slot name
          const [h, m] = item.time.split(":").map(Number);
          const ampm = h >= 12 ? "PM" : "AM";
          const displayH = h % 12 || 12;
          const displayLabel = `${displayH}:00 ${ampm}`;

          return (
            <div 
              key={idx} 
              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition duration-150 ${
                item.booking 
                  ? "bg-red-500/10 border-red-500/20 text-red-300" 
                  : "bg-green-500/10 border-green-500/20 text-green-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${item.booking ? 'bg-red-500' : 'bg-green-500'}`}></div>
                <span className="font-bold">{displayLabel}</span>
              </div>
              <span className="font-semibold max-w-[150px] truncate">
                {item.booking ? `Booked: ${item.booking.userId?.name || 'Unknown'}` : "Available"}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const handleDateClick = (arg: any) => {
    setSelectedDate(arg.dateStr);
    setIsSidePanelOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Calendar</h1>
        <p className="text-slate-400 mt-1 text-sm">Monitor turf occupancy and manage bookings from a monthly visual calendar.</p>
      </div>

      {/* Main Grid: Calendar & Side panel */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        {/* Full Calendar widget */}
        <div className="bg-[#1e293b]/40 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-xl xl:col-span-3 text-slate-200">
          {loading ? (
            <div className="h-96 flex items-center justify-center text-slate-500 text-sm">Loading Calendar...</div>
          ) : (
            <div className="admin-calendar-wrapper">
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: ""
                }}
                events={[...getBackgroundEvents(), ...getBookingEvents()]}
                dateClick={handleDateClick}
                eventClick={(info) => {
                  const b = info.event.extendedProps;
                  setSelectedDate(b.date);
                  setIsSidePanelOpen(true);
                }}
                height="auto"
              />
            </div>
          )}
        </div>

        {/* Legend Panel & Quick Actions */}
        <div className="space-y-6">
          <div className="bg-[#1e293b]/30 border border-slate-850 p-5 rounded-2xl shadow-lg">
            <h3 className="font-bold text-slate-200 text-sm mb-4">Calendar Guide</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400">G</div>
                <span className="text-slate-400 font-medium">Green: Slots Available</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-400">Y</div>
                <span className="text-slate-400 font-medium">Yellow: Partially Occupied</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">R</div>
                <span className="text-slate-400 font-medium">Red: Fully Booked</span>
              </div>
            </div>
          </div>

          <div className="bg-[#1e293b]/30 border border-slate-850 p-5 rounded-2xl shadow-lg text-xs space-y-1.5 text-slate-400">
            <h4 className="font-bold text-slate-300 mb-2">Instructions</h4>
            <p>1. Click any day on the calendar to open the schedule drawer.</p>
            <p>2. Select a booking inside the drawer to view details, cancel bookings, or look up customer details.</p>
          </div>
        </div>
      </div>

      {/* Side Panel Drawer */}
      {isSidePanelOpen && (
        <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-[#1e293b] border-l border-slate-800 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-250">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-[#0f172a]/30">
            <div className="flex items-center gap-2">
              <CalendarDays className="text-playoGreen" size={20} />
              <span className="font-bold text-slate-200 text-base">
                Schedule: {new Date(selectedDate).toLocaleDateString("en-GB", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <button 
              onClick={() => setIsSidePanelOpen(false)}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Bookings Lists & Timeline */}
          <div className="p-6 flex-1 overflow-y-auto no-scrollbar space-y-6">
            <div>
              <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wider mb-3">Booked Slots ({dayBookings.length})</h4>
              {dayBookings.length === 0 ? (
                <div className="text-center py-8 bg-[#0f172a]/10 border border-slate-850 rounded-xl text-slate-500 text-xs font-semibold">
                  No confirmed bookings for this day.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {dayBookings.map(b => (
                    <div key={b._id} className="p-4 bg-slate-900/35 border border-slate-800/80 rounded-xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-bold text-slate-200 text-sm">{b.userId?.name || "Unknown"}</h5>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5"><Clock size={12} /> {formatTime(b.startTime)} • {b.duration} Hr(s)</p>
                        </div>
                        <span className="text-xs font-bold text-playoGreen">₹{b.totalAmount}</span>
                      </div>

                      {/* Detail row */}
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold border-t border-slate-800/40 pt-2.5">
                        <span className="capitalize bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{b.paymentMethod} Payment</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => fetchUserProfile(b.userId?._id)}
                            className="text-playoGreen hover:underline flex items-center gap-0.5"
                          >
                            <Eye size={12} /> View Customer
                          </button>
                          <button
                            onClick={() => handleCancelBooking(b._id)}
                            className="text-red-400 hover:underline flex items-center gap-0.5"
                          >
                            <XCircle size={12} /> Cancel Booking
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Visual occupied slots */}
            {renderTimeTimeline()}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
            <button 
              onClick={() => setIsSidePanelOpen(false)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
            >
              Close Drawer
            </button>
          </div>
        </div>
      )}

      {/* User Profile Modal inside Calendar Page */}
      {selectedUserId && userProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-200 text-base">Customer Details</h3>
              <button 
                onClick={() => { setSelectedUserId(null); setUserProfile(null); }}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>
            
            {userLoading ? (
              <div className="py-8 text-center text-xs text-slate-500 font-semibold">Loading details...</div>
            ) : (
              <div className="space-y-4 text-xs font-semibold text-slate-400">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-playoGreen/20 text-playoGreen flex items-center justify-center font-bold text-sm">
                    {userProfile.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200 text-sm">{userProfile.user.name}</h4>
                    <p className="text-[10px] text-slate-500">Joined: {new Date(userProfile.user.createdAt).toLocaleDateString("en-GB")}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <p className="flex items-center gap-1.5"><Phone size={13} className="text-slate-500" /> {userProfile.user.phone || "N/A"}</p>
                  <p className="flex items-center gap-1.5 truncate"><Mail size={13} className="text-slate-500" /> {userProfile.user.email || "N/A"}</p>
                  <p className="bg-slate-900/40 p-2 rounded-lg border border-slate-800">Total Bookings: {userProfile.totalBookings}</p>
                  <p className="bg-slate-900/40 p-2 rounded-lg border border-slate-800">Total Revenue: <span className="text-playoGreen font-bold">₹{userProfile.totalSpent}</span></p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end pt-2">
              <button 
                onClick={() => { setSelectedUserId(null); setUserProfile(null); }}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
