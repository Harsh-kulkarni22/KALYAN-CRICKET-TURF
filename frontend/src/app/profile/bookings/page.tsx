"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Calendar, Clock, Download, RefreshCw, XCircle, CreditCard, CheckCircle, User, LogOut } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

interface UserInfo {
  name: string;
  email?: string;
  phone?: string;
}

interface Booking {
  _id: string;
  userId: UserInfo;
  date: string;
  startTime: string;
  duration: number;
  totalAmount: number;
  paymentMethod: "cash" | "online";
  paymentStatus: string;
  bookingStatus: "locked" | "confirmed" | "cancelled" | "expired";
  createdAt: string;
}

export default function MyBookings() {
  const { user, logout, isLoading: authLoading, isLoggedIn } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed" | "cancelled">("upcoming");

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

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("turf_token");
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/bookings/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch bookings");
      }

      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/auth");
    } else if (isLoggedIn) {
      fetchBookings();
    }
  }, [authLoading, isLoggedIn, router]);

  const handleCancelBooking = async (bookingId: string) => {
    const confirmCancel = window.confirm("Are you sure you want to cancel this booking?");
    if (!confirmCancel) return;

    try {
      const token = localStorage.getItem("turf_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/bookings/my/${bookingId}/cancel`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to cancel booking");
      }

      toast.success("Booking cancelled successfully");
      fetchBookings(); // refresh list
    } catch (err: any) {
      toast.error(err.message || "Could not cancel booking");
    }
  };

  const isFutureBooking = (dateStr: string, timeStr: string) => {
    try {
      const bookingDateTime = new Date(`${dateStr}T${timeStr}:00`);
      return bookingDateTime > new Date();
    } catch (e) {
      return false;
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const isFuture = isFutureBooking(b.date, b.startTime);
    if (activeTab === "upcoming") {
      return b.bookingStatus === "confirmed" && isFuture;
    } else if (activeTab === "completed") {
      return b.bookingStatus === "confirmed" && !isFuture;
    } else {
      // cancelled or expired
      return b.bookingStatus === "cancelled" || b.bookingStatus === "expired";
    }
  });

  const generateReceiptPDF = (booking: Booking) => {
    try {
      const doc = new jsPDF();

      // Premium header block
      doc.setFillColor(42, 54, 78); // #2A364E deep navy
      doc.rect(0, 0, 210, 40, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("KALYAN CRICKET TURF", 15, 24);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Official Booking Confirmation Receipt", 15, 32);

      // Metainfo column
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.text("Receipt Date:", 15, 55);
      doc.setTextColor(50, 50, 50);
      doc.text(new Date(booking.createdAt).toLocaleDateString(), 45, 55);

      doc.setTextColor(100, 100, 100);
      doc.text("Receipt No:", 15, 62);
      doc.setTextColor(50, 50, 50);
      doc.text(`KCT-${booking._id.substring(booking._id.length - 8).toUpperCase()}`, 45, 62);

      // Customer section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(42, 54, 78);
      doc.text("Billed To:", 15, 76);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.text(booking.userId?.name || "Player", 15, 83);
      if (booking.userId?.email) doc.text(booking.userId.email, 15, 89);
      if (booking.userId?.phone) doc.text(booking.userId.phone, 15, 95);

      // Table layout
      const tableData = [
        ["Item Description", "Slot Date & Time", "Duration", "Amount"],
        [
          "Cricket Turf Rental Slot",
          `${booking.date} @ ${booking.startTime}`,
          `${booking.duration} Hour${booking.duration > 1 ? "s" : ""}`,
          `INR ${booking.totalAmount}.00`
        ]
      ];

      (doc as any).autoTable({
        startY: 105,
        head: [tableData[0]],
        body: [tableData[1]],
        theme: "striped",
        headStyles: { fillColor: [42, 54, 78] },
        styles: { fontSize: 10, cellPadding: 5 }
      });

      // Total and Status summary
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(42, 54, 78);
      doc.text(`Payment Status: ${booking.paymentStatus.toUpperCase()}`, 15, finalY);
      doc.text(`Payment Method: ${booking.paymentMethod.toUpperCase()}`, 15, finalY + 7);

      doc.setFontSize(14);
      doc.text(`Total Paid: INR ${booking.totalAmount}.00`, 120, finalY);

      // Divider
      doc.setDrawColor(220, 220, 220);
      doc.line(15, finalY + 22, 195, finalY + 22);

      // Footer
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(120, 120, 120);
      doc.text("Thank you for playing at KALYAN Cricket Turf!", 15, finalY + 30);
      doc.text("Please arrive 10 minutes prior to your slot. Bring shoes with rubber soles.", 15, finalY + 35);

      doc.save(`Receipt-${booking._id.substring(booking._id.length - 8).toUpperCase()}.pdf`);
      toast.success("Receipt downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF invoice");
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-playoGreen" size={40} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Sticky Header - Mobile Only */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10 lg:hidden">
        <div className="flex items-center">
          <button onClick={() => router.push("/profile")} className="p-2 -ml-2 mr-2">
            <ChevronLeft size={24} className="text-gray-700 hover:text-black transition" />
          </button>
          <span className="font-bold text-[#2A364E] text-lg tracking-tight">My Bookings</span>
        </div>
        <button
          onClick={fetchBookings}
          className="p-2 text-gray-500 hover:text-playoGreen transition"
          title="Refresh bookings"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="w-full px-4 lg:px-8 py-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
          
          {/* Desktop Left Sidebar (3 cols) */}
          <div className="hidden lg:block lg:col-span-3">
            {renderSidebar("bookings")}
          </div>

          {/* Right Content Column (7 cols on desktop, full width on mobile) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Desktop header block with refresh button */}
            <div className="hidden lg:flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h1 className="font-bold text-[#2A364E] text-xl tracking-tight">My Bookings</h1>
              <button
                onClick={fetchBookings}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-playoGreen bg-gray-50 hover:bg-gray-100 rounded-xl transition"
                title="Refresh bookings"
              >
                <RefreshCw size={16} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Bookings Card Container */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Tabs */}
              <div className="bg-white border-b border-gray-100 p-2 flex gap-1">
                <button
                  onClick={() => setActiveTab("upcoming")}
                  className={`flex-1 py-3 text-center text-sm font-semibold rounded-lg transition ${
                    activeTab === "upcoming"
                      ? "bg-[#2A364E] text-white shadow-sm"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setActiveTab("completed")}
                  className={`flex-1 py-3 text-center text-sm font-semibold rounded-lg transition ${
                    activeTab === "completed"
                      ? "bg-[#2A364E] text-white shadow-sm"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setActiveTab("cancelled")}
                  className={`flex-1 py-3 text-center text-sm font-semibold rounded-lg transition ${
                    activeTab === "cancelled"
                      ? "bg-[#2A364E] text-white shadow-sm"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Cancelled
                </button>
              </div>

              {/* List */}
              <div className="p-4">
                {loading ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="animate-spin text-playoGreen" size={30} />
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                    <Calendar size={48} className="text-gray-300 mb-3" />
                    <h3 className="font-bold text-gray-700 text-lg mb-1">No bookings found</h3>
                    <p className="text-sm text-gray-400 max-w-xs mb-6">
                      You do not have any {activeTab} slots booked at the moment.
                    </p>
                    {activeTab === "upcoming" && (
                      <Link
                        href="/book"
                        className="bg-playoGreen text-white font-bold px-6 py-3 rounded-xl hover:bg-emerald-600 transition active:scale-[0.98]"
                      >
                        Book a Slot Now
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBookings.map((b) => (
                      <div
                        key={b._id}
                        className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition duration-200 relative overflow-hidden"
                      >
                        {/* Visual Accent Badge */}
                        <div
                          className={`absolute top-0 left-0 w-1.5 h-full ${
                            b.bookingStatus === "confirmed" ? "bg-playoGreen" : "bg-red-400"
                          }`}
                        />

                        {/* Card Title/Location */}
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-[#2A364E] text-[16px]">KALYAN Cricket Turf</h4>
                            <p className="text-xs text-gray-400">Basavakalyan, Bidar, Karnataka</p>
                          </div>
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                              b.bookingStatus === "confirmed"
                                ? "bg-green-50 text-green-600 border border-green-100"
                                : b.bookingStatus === "cancelled"
                                ? "bg-red-50 text-red-600 border border-red-100"
                                : "bg-gray-100 text-gray-600 border border-gray-200"
                            }`}
                          >
                            {b.bookingStatus}
                          </span>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-t border-b border-gray-50 py-3 my-3 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={15} className="text-gray-400" />
                            <span>{new Date(b.date).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={15} className="text-gray-400" />
                            <span>
                              {b.startTime} ({b.duration} hr{b.duration > 1 ? "s" : ""})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard size={15} className="text-gray-400" />
                            <span className="capitalize">{b.paymentMethod} Payment</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle size={15} className="text-gray-400" />
                            <span className="capitalize text-xs font-semibold">{b.paymentStatus}</span>
                          </div>
                        </div>

                        {/* Footer values and Action buttons */}
                        <div className="flex items-center justify-between mt-4">
                          <div>
                            <span className="text-xs text-gray-400 block font-medium">Total Price</span>
                            <span className="font-bold text-[#2A364E] text-lg">₹{b.totalAmount}</span>
                          </div>
                          
                          <div className="flex gap-2">
                            {b.bookingStatus === "confirmed" && (
                              <button
                                onClick={() => generateReceiptPDF(b)}
                                className="flex items-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold px-3 py-2 rounded-xl text-xs border border-gray-200 transition"
                              >
                                <Download size={14} /> Invoice
                              </button>
                            )}
                            
                            {activeTab === "upcoming" && b.bookingStatus === "confirmed" && (
                              <button
                                onClick={() => handleCancelBooking(b._id)}
                                className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-2 rounded-xl text-xs border border-red-100 transition"
                              >
                                <XCircle size={14} /> Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
