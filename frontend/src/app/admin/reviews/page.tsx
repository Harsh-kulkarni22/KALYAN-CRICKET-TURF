"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Trash2, 
  Star, 
  User, 
  Calendar, 
  Loader2,
  Trash
} from "lucide-react";
import toast from "react-hot-toast";

interface ReviewItem {
  _id: string;
  userId: {
    _id: string;
    name: string;
  } | null;
  rating: number;
  review: string;
  createdAt: string;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [starFilter, setStarFilter] = useState<number | "all">("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      } else {
        toast.error("Failed to load reviews");
      }
    } catch (err) {
      toast.error("Network error while loading reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDeleteReview = async (id: string) => {
    try {
      const token = localStorage.getItem("turf_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/reviews/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        toast.success("Review deleted successfully");
        setDeleteConfirmId(null);
        fetchReviews(); // Refresh list
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete review");
      }
    } catch (err) {
      toast.error("Error deleting review");
    }
  };

  // Filter & Search logic
  const filteredReviews = reviews.filter((r) => {
    const userName = r.userId?.name?.toLowerCase() || "unknown";
    const matchesSearch = userName.includes(searchQuery.toLowerCase()) || 
                          r.review?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStar = starFilter === "all" || r.rating === starFilter;
    return matchesSearch && matchesStar;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Reviews Management</h1>
        <p className="text-slate-400 mt-1 text-sm">Monitor, search, filter, and moderate customer ratings & reviews.</p>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#1e293b]/40 backdrop-blur-md border border-slate-800/80 p-4 rounded-2xl shadow-lg flex flex-col md:flex-row gap-4 items-center">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search by customer name or review text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#0f172a]/55 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-playoGreen focus:outline-none placeholder-slate-500 transition"
          />
        </div>

        {/* Star Rating Filter */}
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStarFilter("all")}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition whitespace-nowrap ${
              starFilter === "all"
                ? "border-playoGreen text-playoGreen bg-playoGreen/5"
                : "border-slate-800 text-slate-400 hover:bg-slate-800/40"
            }`}
          >
            All Ratings
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              onClick={() => setStarFilter(star)}
              className={`px-3 py-2 text-xs font-bold rounded-xl border transition flex items-center gap-1 whitespace-nowrap ${
                starFilter === star
                  ? "border-playoGreen text-playoGreen bg-playoGreen/5"
                  : "border-slate-800 text-slate-400 hover:bg-slate-800/40"
              }`}
            >
              {star} <Star size={12} className="fill-current" />
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Content Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-playoGreen" size={40} />
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-[#1e293b]/20 border border-slate-800 p-16 rounded-2xl text-center shadow-lg">
          <p className="text-slate-500 font-medium">No ratings & reviews found matching criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReviews.map((r) => {
            const formattedDate = new Date(r.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric"
            });
            return (
              <div
                key={r._id}
                className="bg-[#1e293b]/30 border border-slate-800/70 p-5 rounded-2xl flex flex-col justify-between shadow-md relative group hover:border-slate-700 transition"
              >
                <div>
                  {/* Name and Rating */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-750 flex items-center justify-center font-bold text-xs text-slate-300">
                        {r.userId?.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-200 text-sm truncate max-w-[150px] md:max-w-[200px]">
                          {r.userId?.name || "Deleted User"}
                        </h4>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Calendar size={10} /> {formattedDate}
                        </span>
                      </div>
                    </div>

                    {/* Stars */}
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={13}
                          className={
                            star <= r.rating
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-slate-700 fill-slate-750"
                          }
                        />
                      ))}
                    </div>
                  </div>

                  {/* Review Text */}
                  <p className="text-slate-300 text-xs leading-relaxed font-semibold mt-4 bg-slate-900/10 p-3.5 rounded-xl border border-slate-850">
                    {r.review ? `"${r.review}"` : <span className="text-slate-500 italic">No review text provided</span>}
                  </p>
                </div>

                {/* Moderate Actions */}
                <div className="mt-5 flex justify-end border-t border-slate-800/40 pt-3">
                  <button
                    onClick={() => setDeleteConfirmId(r._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-[11px] font-bold text-red-400 transition"
                    title="Delete Review"
                  >
                    <Trash2 size={13} />
                    <span>Delete Review</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            <h3 className="font-extrabold text-slate-100 text-base">Confirm Action</h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              This action will permanently delete this review record from the database. It cannot be undone. Are you sure you want to proceed?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteConfirmId && handleDeleteReview(deleteConfirmId)}
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
