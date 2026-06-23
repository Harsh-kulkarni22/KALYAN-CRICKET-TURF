"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  UserMinus, 
  Ban, 
  CheckCircle,
  Eye, 
  Clock, 
  DollarSign, 
  Phone, 
  Mail, 
  Calendar,
  X,
  UserCheck
} from "lucide-react";
import toast from "react-hot-toast";

interface UserItem {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  authType: string;
  role: string;
  isBlocked: boolean;
  totalBookings: number;
  totalSpent: number;
  createdAt: string;
  lastLogin?: string;
  lastBookingDate?: string;
  favoriteSlot?: string;
}

interface UserProfileData {
  user: UserItem;
  totalBookings: number;
  totalSpent: number;
  bookings: any[];
  favoriteSlot?: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Filters state
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  // Profile Details Drawer/Modal
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Actions confirmations
  const [blockUserId, setBlockUserId] = useState<string | null>(null);
  const [unblockUserId, setUnblockUserId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("turf_token");
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        sort,
      });

      if (search) queryParams.append("search", search);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/users?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotal(data.total);
        setPages(data.pages);
      } else {
        toast.error("Failed to load users");
      }
    } catch (err) {
      toast.error("Network error while loading users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, sort]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const viewUserProfile = async (userId: string) => {
    setProfileLoading(true);
    setIsProfileOpen(true);
    try {
      const token = localStorage.getItem("turf_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setProfileData(await res.json());
      } else {
        toast.error("Failed to load user profile");
        setIsProfileOpen(false);
      }
    } catch (err) {
      toast.error("Network error while fetching profile");
      setIsProfileOpen(false);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleBlockUser = async (id: string) => {
    try {
      const token = localStorage.getItem("turf_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/users/${id}/block`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("User blocked successfully");
        setBlockUserId(null);
        fetchUsers();
        if (profileData && profileData.user._id === id) {
          viewUserProfile(id);
        }
      } else {
        toast.error("Failed to block user");
      }
    } catch (err) {
      toast.error("Error blocking user");
    }
  };

  const handleUnblockUser = async (id: string) => {
    try {
      const token = localStorage.getItem("turf_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/users/${id}/unblock`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("User unblocked successfully");
        setUnblockUserId(null);
        fetchUsers();
        if (profileData && profileData.user._id === id) {
          viewUserProfile(id);
        }
      } else {
        toast.error("Failed to unblock user");
      }
    } catch (err) {
      toast.error("Error unblocking user");
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const token = localStorage.getItem("turf_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("User and bookings deleted permanently");
        setDeleteUserId(null);
        setIsProfileOpen(false);
        fetchUsers();
      } else {
        toast.error("Failed to delete user");
      }
    } catch (err) {
      toast.error("Error deleting user");
    }
  };

  const formatBookingTime = (timeStr: string) => {
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
          <h1 className="text-3xl font-extrabold tracking-tight text-white">User Management</h1>
          <p className="text-slate-400 mt-1 text-sm">Monitor system users, block malicious accounts, and inspect histories.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#1e293b]/40 border border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search users by name, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0f172a]/55 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-playoGreen focus:outline-none placeholder-slate-500 transition"
          />
        </div>

        {/* Sort */}
        <div className="sm:w-56">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full p-3 bg-[#0f172a]/55 border border-slate-800 rounded-xl text-slate-300 text-xs focus:border-playoGreen focus:outline-none font-semibold"
          >
            <option value="newest">Newest Joined</option>
            <option value="mostActive">Most Active (Bookings)</option>
            <option value="highestSpending">Highest Spending (INR)</option>
          </select>
        </div>
      </div>

      {/* Users List/Table */}
      <div className="bg-[#1e293b]/20 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/40 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Profile</th>
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6">Contact Details</th>
                <th className="py-4 px-6">Activity Logs</th>
                <th className="py-4 px-6 text-center">Bookings</th>
                <th className="py-4 px-6 text-right">Revenue</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6"><div className="w-9 h-9 bg-slate-800 rounded-full"></div></td>
                    <td className="py-4 px-6"><div className="h-4 w-28 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-6"><div className="h-4 w-36 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-6"><div className="h-4 w-10 bg-slate-800 mx-auto rounded"></div></td>
                    <td className="py-4 px-6"><div className="h-4 w-16 bg-slate-800 ml-auto rounded"></div></td>
                    <td className="py-4 px-6"><div className="h-5 w-16 bg-slate-800 mx-auto rounded-full"></div></td>
                    <td className="py-4 px-6"><div className="h-8 w-20 bg-slate-800 mx-auto rounded-lg"></div></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-500 font-medium">No customers found.</td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u._id} className="hover:bg-slate-800/10 transition">
                    {/* Circle */}
                    <td className="py-4 px-6">
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="py-4 px-6 font-semibold text-slate-200">
                      <div>
                        {u.name}
                        {u.role === 'admin' && <span className="ml-2 text-[9px] bg-playoGreen/20 text-playoGreen border border-playoGreen/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Admin</span>}
                      </div>
                    </td>

                    {/* Email/Phone */}
                    <td className="py-4 px-6 space-y-0.5 text-xs text-slate-400 font-medium">
                      {u.phone && <p>{u.phone}</p>}
                      {u.email && <p>{u.email}</p>}
                    </td>

                    {/* Last Login & Last Booking */}
                    <td className="py-4 px-6 space-y-0.5 text-xs text-slate-400 font-medium">
                      <p>Login: {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString("en-GB") : "Never"}</p>
                      <p>Booked: {u.lastBookingDate || "Never"}</p>
                    </td>

                    {/* Total Bookings */}
                    <td className="py-4 px-6 text-center font-semibold text-slate-300">
                      {u.totalBookings}
                    </td>

                    {/* Total Spent */}
                    <td className="py-4 px-6 text-right font-extrabold text-playoGreen">
                      ₹{u.totalSpent || 0}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6 text-center">
                      {u.isBlocked ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wide">Blocked</span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-wide">Active</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => viewUserProfile(u._id)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                          title="View Profile"
                        >
                          <Eye size={16} />
                        </button>
                        {u.role !== 'admin' && (
                          u.isBlocked ? (
                            <button
                              onClick={() => setUnblockUserId(u._id)}
                              className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-lg transition"
                              title="Unblock User"
                            >
                              <UserCheck size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => setBlockUserId(u._id)}
                              className="p-1.5 text-red-500/80 hover:bg-red-500/10 rounded-lg transition"
                              title="Block User"
                            >
                              <Ban size={16} />
                            </button>
                          )
                        )}
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => setDeleteUserId(u._id)}
                            className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-slate-800 rounded-lg transition"
                            title="Delete User"
                          >
                            <UserMinus size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2.5 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-850 rounded-xl text-slate-300 transition"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-slate-400 font-semibold text-xs tracking-wider">PAGE {page} OF {pages}</span>
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="p-2.5 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-850 rounded-xl text-slate-300 transition"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* User Profile Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-800">
              <h3 className="font-extrabold text-slate-100 text-lg">Customer Profile</h3>
              <button 
                onClick={() => { setIsProfileOpen(false); setProfileData(null); }} 
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            {profileLoading || !profileData ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-playoGreen"></div>
                <span className="text-xs font-semibold">Loading history...</span>
              </div>
            ) : (
              <div className="flex flex-col">
                {/* Meta details */}
                <div className="p-6 bg-slate-900/30 border-b border-slate-800/60 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-playoGreen/15 flex items-center justify-center text-playoGreen font-extrabold border border-playoGreen/10 text-lg">
                      {profileData.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200 text-base">{profileData.user.name}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 tracking-wider">Joined: {new Date(profileData.user.createdAt).toLocaleDateString("en-GB")}</p>
                    </div>
                  </div>

                  <div className="space-y-1 bg-[#0f172a]/20 p-3 rounded-xl border border-slate-850">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Total Bookings</span>
                    <p className="text-slate-200 font-bold text-sm flex items-center gap-1.5"><Calendar size={14} className="text-slate-400" /> {profileData.totalBookings} times</p>
                  </div>

                  <div className="space-y-1 bg-[#0f172a]/20 p-3 rounded-xl border border-slate-850">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Total Spent</span>
                    <p className="text-playoGreen font-extrabold text-sm flex items-center gap-1.5">₹{profileData.totalSpent}</p>
                  </div>

                  <div className="space-y-1 bg-[#0f172a]/20 p-3 rounded-xl border border-slate-850">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Favorite Slot</span>
                    <p className="text-amber-400 font-extrabold text-sm flex items-center gap-1.5">
                      <Clock size={14} className="text-slate-450" /> 
                      {profileData.favoriteSlot ? formatBookingTime(profileData.favoriteSlot) : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Booking History Table */}
                <div className="p-6">
                  <h4 className="font-bold text-slate-300 text-sm mb-4">Reservation History</h4>
                  <div className="max-h-[35vh] overflow-y-auto border border-slate-800/80 rounded-xl no-scrollbar">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-500 font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-4">Date</th>
                          <th className="py-2.5 px-4">Time</th>
                          <th className="py-2.5 px-4 text-center">Dur</th>
                          <th className="py-2.5 px-4 text-right">Paid</th>
                          <th className="py-2.5 px-4 text-center">Method</th>
                          <th className="py-2.5 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {profileData.bookings.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-slate-500">No booking records found.</td>
                          </tr>
                        ) : (
                          profileData.bookings.map(b => (
                            <tr key={b._id} className="hover:bg-slate-800/20 text-slate-300">
                              <td className="py-2.5 px-4 font-semibold">{new Date(b.date).toLocaleDateString("en-GB")}</td>
                              <td className="py-2.5 px-4">{formatBookingTime(b.startTime)}</td>
                              <td className="py-2.5 px-4 text-center">{b.duration} Hr</td>
                              <td className="py-2.5 px-4 text-right font-bold text-playoGreen">₹{b.totalAmount}</td>
                              <td className="py-2.5 px-4 text-center capitalize">{b.paymentMethod}</td>
                              <td className="py-2.5 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${
                                  b.bookingStatus === 'confirmed' ? 'bg-green-500/10 text-green-400' :
                                  b.bookingStatus === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                                  'bg-orange-500/10 text-orange-400'
                                }`}>
                                  {b.bookingStatus}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="p-4 bg-slate-900 flex justify-between items-center">
              <div>
                {profileData && profileData.user.role !== 'admin' && (
                  profileData.user.isBlocked ? (
                    <button 
                      onClick={() => handleUnblockUser(profileData.user._id)} 
                      className="px-4 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <UserCheck size={14} /> Unblock User
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleBlockUser(profileData.user._id)} 
                      className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Ban size={14} /> Block User
                    </button>
                  )
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setIsProfileOpen(false); setProfileData(null); }} 
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-bold transition"
                >
                  Close
                </button>
                {profileData && profileData.user.role !== 'admin' && (
                  <button 
                    onClick={() => setDeleteUserId(profileData.user._id)} 
                    className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <UserMinus size={14} /> Delete Permanent
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block Confirm Modal */}
      {blockUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            <h3 className="font-extrabold text-slate-100 text-lg flex items-center gap-2"><Ban size={20} className="text-red-500" /> Block Account</h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Are you sure you want to block this user? Once blocked, they will be disconnected immediately and prevented from logging in, booking slots, or making payments.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setBlockUserId(null)} className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-bold transition">Cancel</button>
              <button onClick={() => handleBlockUser(blockUserId)} className="px-4 py-2 rounded-xl bg-red-505 bg-red-500 text-white hover:bg-red-600 text-xs font-bold transition">Block User</button>
            </div>
          </div>
        </div>
      )}

      {/* Unblock Confirm Modal */}
      {unblockUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            <h3 className="font-extrabold text-slate-100 text-lg flex items-center gap-2"><UserCheck size={20} className="text-green-500" /> Restore Account</h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Are you sure you want to unblock this user? This will immediately restore their full login and booking privileges.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setUnblockUserId(null)} className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-bold transition">Cancel</button>
              <button onClick={() => handleUnblockUser(unblockUserId)} className="px-4 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 text-xs font-bold transition">Unblock User</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirm Modal */}
      {deleteUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            <h3 className="font-extrabold text-slate-100 text-lg flex items-center gap-2"><UserMinus size={20} className="text-red-500" /> Delete User</h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              This will permanently delete the user account and all their related booking records from the database. This action is irreversible. Proceed?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setDeleteUserId(null)} className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-bold transition">Cancel</button>
              <button onClick={() => handleDeleteUser(deleteUserId)} className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-xs font-bold transition">Delete Permanently</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
