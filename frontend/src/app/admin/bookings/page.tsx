"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Filter, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  XCircle,
  Calendar,
  Clock,
  DollarSign,
  User,
  Phone,
  Mail,
  CreditCard,
  CalendarDays,
  X
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
  createdAt: string;
}

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Filters state
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [bookingStatus, setBookingStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Detail Modal
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Delete Confirmation Modal
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("turf_token");
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "8",
        sort,
      });

      if (search) queryParams.append("search", search);
      if (date) queryParams.append("date", date);
      else {
        if (startDate) queryParams.append("startDate", startDate);
        if (endDate) queryParams.append("endDate", endDate);
      }
      if (paymentMethod) queryParams.append("paymentMethod", paymentMethod);
      if (bookingStatus) queryParams.append("bookingStatus", bookingStatus);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/bookings?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings);
        setTotal(data.total);
        setPages(data.pages);
      } else {
        toast.error("Failed to load bookings");
      }
    } catch (err) {
      toast.error("Network error while loading bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, sort, date, startDate, endDate, paymentMethod, bookingStatus]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setPage(1);
      fetchBookings();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleCancelBooking = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const token = localStorage.getItem("turf_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/bookings/${id}/cancel`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Booking cancelled successfully");
        fetchBookings();
        if (selectedBooking && selectedBooking._id === id) {
          setIsDetailOpen(false);
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to cancel booking");
      }
    } catch (err) {
      toast.error("Error cancelling booking");
    }
  };

  const handleDeleteBooking = async (id: string) => {
    try {
      const token = localStorage.getItem("turf_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/bookings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Booking deleted permanently");
        setDeleteId(null);
        setIsDetailOpen(false);
        fetchBookings();
      } else {
        toast.error("Failed to delete booking");
      }
    } catch (err) {
      toast.error("Error deleting booking");
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    return method === "online" 
      ? "bg-blue-500/15 text-blue-400 border border-blue-500/20" 
      : "bg-amber-500/15 text-amber-400 border border-amber-500/20";
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'confirmed': return 'bg-green-500/15 text-green-400 border border-green-500/20';
      case 'cancelled': return 'bg-red-500/15 text-red-400 border border-red-500/20';
      case 'pending': return 'bg-orange-500/15 text-orange-400 border border-orange-500/20';
      default: return 'bg-slate-500/15 text-slate-400 border border-slate-500/20';
    }
  };

  const clearFilters = () => {
    setDate("");
    setStartDate("");
    setEndDate("");
    setPaymentMethod("");
    setBookingStatus("");
    setSort("newest");
    setSearch("");
  };

  // Helper to format slot into standard AM/PM (e.g. 14:00 -> 02:00 PM)
  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 || 12;
    return `${displayH}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">Bookings Management</h1>
          <p className="text-slate-400 mt-1 text-sm">Review, filter, cancel, and delete user reservations.</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-[#1e293b]/40 backdrop-blur-md border border-slate-800/80 p-4 rounded-2xl shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by customer name, email or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0f172a]/55 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-playoGreen focus:outline-none placeholder-slate-500 transition"
            />
          </div>

          {/* Toggle Filter Options */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-semibold transition ${
              showFilters 
                ? "border-playoGreen text-playoGreen bg-playoGreen/5" 
                : "border-slate-800 text-slate-300 hover:bg-slate-800/40"
            }`}
          >
            <SlidersHorizontal size={16} />
            <span>Filters</span>
          </button>
        </div>

        {/* Extended Filter Panel */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-800/50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Date Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Single Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); setStartDate(""); setEndDate(""); }}
                className="w-full p-2 bg-[#0f172a]/55 border border-slate-800 rounded-lg text-slate-300 text-xs focus:border-playoGreen focus:outline-none"
              />
            </div>

            {/* Date Range Start */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                disabled={!!date}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 bg-[#0f172a]/55 border border-slate-800 rounded-lg text-slate-300 text-xs focus:border-playoGreen focus:outline-none disabled:opacity-40"
              />
            </div>

            {/* Date Range End */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                disabled={!!date}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 bg-[#0f172a]/55 border border-slate-800 rounded-lg text-slate-300 text-xs focus:border-playoGreen focus:outline-none disabled:opacity-40"
              />
            </div>

            {/* Sort Order */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Sort By</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full p-2 bg-[#0f172a]/55 border border-slate-800 rounded-lg text-slate-300 text-xs focus:border-playoGreen focus:outline-none font-medium"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 bg-[#0f172a]/55 border border-slate-800 rounded-lg text-slate-300 text-xs focus:border-playoGreen focus:outline-none font-medium"
              >
                <option value="">All Methods</option>
                <option value="online">Online</option>
                <option value="cash">Cash</option>
              </select>
            </div>

            {/* Booking Status */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Booking Status</label>
              <select
                value={bookingStatus}
                onChange={(e) => setBookingStatus(e.target.value)}
                className="w-full p-2 bg-[#0f172a]/55 border border-slate-800 rounded-lg text-slate-300 text-xs focus:border-playoGreen focus:outline-none font-medium"
              >
                <option value="">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Clear Button */}
            <div className="flex items-end sm:col-span-2">
              <button
                onClick={clearFilters}
                className="w-full py-2 border border-slate-800 text-slate-400 text-xs font-semibold rounded-lg hover:bg-slate-800/20 hover:text-white transition"
              >
                Clear All Filter Settings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bookings Card Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-[#1e293b]/20 border border-slate-800 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-[#1e293b]/20 border border-slate-800 p-16 rounded-2xl text-center shadow-lg">
          <p className="text-slate-500 font-medium">No bookings match the filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {bookings.map((booking) => {
            const formattedDate = new Date(booking.date).toLocaleDateString("en-GB");
            return (
              <div 
                key={booking._id} 
                className="bg-[#1e293b]/30 border border-slate-800/70 p-5 rounded-2xl hover:border-slate-700 transition flex flex-col justify-between shadow-md"
              >
                <div>
                  {/* Name and Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-200 text-base truncate">{booking.userId?.name || "Unknown"}</h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPaymentMethodBadge(booking.paymentMethod)}`}>
                        {booking.paymentMethod}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(booking.bookingStatus)}`}>
                        {booking.bookingStatus}
                      </span>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-400 font-medium">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={14} className="text-slate-500" />
                      <span>{formattedDate}</span>
                      <span>•</span>
                      <Clock size={14} className="text-slate-500" />
                      <span>{formatTime(booking.startTime)}</span>
                      <span>•</span>
                      <span>{booking.duration} Hr{booking.duration > 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>

                {/* Amount and Action Buttons */}
                <div className="mt-6 flex items-center justify-between border-t border-slate-800/40 pt-4">
                  <span className="text-lg font-bold text-playoGreen">₹{booking.totalAmount}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setSelectedBooking(booking); setIsDetailOpen(true); }}
                      className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    {booking.bookingStatus !== 'cancelled' && (
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        className="p-2 text-red-500/80 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition"
                        title="Cancel Booking"
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteId(booking._id)}
                      className="p-2 text-slate-500 hover:text-red-500 rounded-lg hover:bg-slate-800/60 transition"
                      title="Delete Booking"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 rounded-xl text-slate-300 transition"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-slate-400 font-semibold text-xs tracking-wider">PAGE {page} OF {pages}</span>
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 rounded-xl text-slate-300 transition"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* 1. Detail Modal */}
      {isDetailOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-800">
              <h3 className="font-extrabold text-slate-100 text-lg">Booking Details</h3>
              <button 
                onClick={() => setIsDetailOpen(false)} 
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 p-3 bg-[#0f172a]/30 border border-slate-800 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-playoGreen/15 flex items-center justify-center text-playoGreen font-bold border border-playoGreen/10">
                    {selectedBooking.userId?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200 text-sm">{selectedBooking.userId?.name || "Unknown"}</h4>
                    <p className="text-[11px] text-slate-500">Customer</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Phone Number</span>
                  <p className="text-slate-300 font-semibold text-xs flex items-center gap-1.5"><Phone size={13} className="text-slate-500" /> {selectedBooking.userId?.phone || "N/A"}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Email Address</span>
                  <p className="text-slate-300 font-semibold text-xs flex items-center gap-1.5 truncate"><Mail size={13} className="text-slate-500" /> {selectedBooking.userId?.email || "N/A"}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Booking Date</span>
                  <p className="text-slate-300 font-semibold text-xs flex items-center gap-1.5"><Calendar size={13} className="text-slate-500" /> {new Date(selectedBooking.date).toLocaleDateString("en-GB")}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Start Time</span>
                  <p className="text-slate-300 font-semibold text-xs flex items-center gap-1.5"><Clock size={13} className="text-slate-500" /> {formatTime(selectedBooking.startTime)}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Duration</span>
                  <p className="text-slate-300 font-semibold text-xs">{selectedBooking.duration} Hour(s)</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Paid</span>
                  <p className="text-slate-200 font-extrabold text-sm">₹{selectedBooking.totalAmount}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Payment Method</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase mt-1 ${getPaymentMethodBadge(selectedBooking.paymentMethod)}`}>
                    {selectedBooking.paymentMethod}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Booking Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase mt-1 ${getStatusBadge(selectedBooking.bookingStatus)}`}>
                    {selectedBooking.bookingStatus}
                  </span>
                </div>

                <div className="col-span-2 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Created Date</span>
                  <p className="text-slate-400 text-xs font-semibold">{new Date(selectedBooking.createdAt).toLocaleString("en-GB")}</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-900 flex justify-end gap-2.5">
              <button 
                onClick={() => setIsDetailOpen(false)} 
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800/40 text-xs font-bold transition"
              >
                Close
              </button>
              {selectedBooking.bookingStatus !== 'cancelled' && (
                <button 
                  onClick={() => handleCancelBooking(selectedBooking._id)} 
                  className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold transition"
                >
                  Cancel Booking
                </button>
              )}
              <button 
                onClick={() => setDeleteId(selectedBooking._id)} 
                className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-xs font-bold transition"
              >
                Delete Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Permanent Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            <h3 className="font-extrabold text-slate-100 text-lg">Confirm Action</h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              This action will permanently delete this booking record from the database. It cannot be undone. Are you sure you want to proceed?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setDeleteId(null)} 
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteBooking(deleteId)} 
                className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-xs font-bold transition"
              >
                Yes, Delete Permanent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
