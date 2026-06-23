"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  Star, 
  Loader2, 
  X 
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

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

export default function ReviewsPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  
  // Reviews state
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [displayRating, setDisplayRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [distribution, setDistribution] = useState<{ [key: number]: number }>({
    5: 0, 4: 0, 3: 0, 2: 0, 1: 0
  });
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 20;

  // Rate Modal state
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [myReviewId, setMyReviewId] = useState<string | null>(null);

  const turfName = "KALYAN CRICKET TURF";

  const fetchReviewsData = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/reviews`);
      if (res.ok) {
        const data = await res.json();
        setDisplayRating(data.averageRating || 0);
        setRatingCount(data.totalReviews || 0);
        setReviews(data.reviews || []);
        if (data.distribution) {
          setDistribution(data.distribution);
        } else {
          const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          (data.reviews || []).forEach((r: any) => {
            if (r.rating >= 1 && r.rating <= 5) {
              dist[r.rating as 1|2|3|4|5] += 1;
            }
          });
          setDistribution(dist);
        }
      } else {
        toast.error("Failed to load reviews");
      }
    } catch (err) {
      toast.error("Network error while loading reviews");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReview = async () => {
    try {
      const token = localStorage.getItem("turf_token");
      if (!token) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/reviews/my-review`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const myReview = await res.json();
        if (myReview) {
          setMyReviewId(myReview._id);
          setRating(myReview.rating);
          setFeedback(myReview.review || "");
        } else {
          setMyReviewId(null);
          setRating(0);
          setFeedback("");
        }
      }
    } catch (err) {
      console.error("Error loading my review:", err);
    }
  };

  useEffect(() => {
    fetchReviewsData();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchMyReview();
    } else {
      setMyReviewId(null);
      setRating(0);
      setFeedback("");
    }
  }, [isLoggedIn]);

  const handleOpenRateModal = () => {
    if (!isLoggedIn) {
      toast.error("Please log in to rate the venue");
      return;
    }
    setIsRateModalOpen(true);
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    
    try {
      const token = localStorage.getItem("turf_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rating,
          review: feedback
        })
      });

      if (res.ok) {
        toast.success("Review submitted successfully");
        setIsRateModalOpen(false);
        fetchReviewsData();
        fetchMyReview();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to submit review");
      }
    } catch (err) {
      toast.error("Network error while submitting review");
    }
  };

  // Pagination Logic
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Sticky Header with Back Button */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="flex items-center">
          <button onClick={() => router.push("/")} className="p-2 -ml-2 mr-2">
            <ChevronLeft size={24} className="text-gray-700 hover:text-black transition" />
          </button>
          <span className="font-bold text-[#2A364E] text-lg tracking-tight">Customer Reviews</span>
        </div>
        
        {isLoggedIn && myReviewId && (
          <button
            onClick={handleOpenRateModal}
            className="text-xs font-bold bg-playoGreen text-white px-4 py-2 rounded-xl hover:bg-emerald-600 transition"
          >
            Edit My Review
          </button>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-playoGreen" size={40} />
          </div>
        ) : (
          <>
            {/* Reviews Statistics Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-[#2A364E] text-md mb-4 uppercase tracking-wide">
                Review Summary
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-10 gap-6 items-center">
                {/* Score Summary */}
                <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold text-[#2A364E]">{displayRating}</span>
                    <span className="text-sm text-gray-400 font-medium">★</span>
                  </div>
                  <div className="flex gap-0.5 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        className={
                          star <= Math.round(displayRating)
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-gray-300 fill-gray-300"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 font-bold mt-2.5">
                    Based on {ratingCount} review{ratingCount !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Rating Distribution Breakdown */}
                <div className="md:col-span-6 space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = distribution[star] || 0;
                    const percent = ratingCount > 0 ? (count / ratingCount) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-3 text-xs font-semibold text-gray-600">
                        <span className="w-5 shrink-0 flex items-center gap-0.5">
                          {star} <Star size={10} className="fill-current text-gray-400" />
                        </span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-playoGreen rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-8 text-right shrink-0 text-gray-400">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Reviews Listing */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
              <h3 className="font-bold text-[#2A364E] text-md border-b border-gray-100 pb-3">
                All Reviews ({reviews.length})
              </h3>

              {reviews.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  No reviews available yet.
                </div>
              ) : (
                <div className="space-y-6">
                  {currentReviews.map((r, idx) => {
                    const formattedDate = new Date(r.createdAt).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    });
                    return (
                      <div key={r._id || idx} className="space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          {/* User Meta */}
                          <div className="flex items-center gap-3">
                            {/* Circle Avatar */}
                            <div className="w-9 h-9 rounded-full bg-playoGreen/15 flex items-center justify-center font-bold text-sm text-playoGreen shrink-0 border border-playoGreen/10 uppercase">
                              {r.userId?.name?.charAt(0) || "?"}
                            </div>
                            <div>
                              <h4 className="font-bold text-[#2A364E] text-sm">
                                {r.userId?.name || "Deleted User"}
                              </h4>
                              <span className="text-[10px] text-gray-400 font-semibold">{formattedDate}</span>
                            </div>
                          </div>

                          {/* Review Stars */}
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={12}
                                className={
                                  star <= r.rating
                                    ? "text-yellow-500 fill-yellow-500"
                                    : "text-gray-300 fill-gray-300"
                                }
                              />
                            ))}
                          </div>
                        </div>

                        {/* Review text */}
                        {r.review && (
                          <p className="text-gray-700 text-xs font-semibold leading-relaxed pl-1">
                            "{r.review}"
                          </p>
                        )}

                        {idx < currentReviews.length - 1 && (
                          <hr className="border-gray-100/80 mt-4" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-semibold text-gray-500">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Edit/Rate Modal in Reviews Page */}
      {isRateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-[#2A364E] text-lg">
                {myReviewId ? `Edit Review for ${turfName}` : `Rate ${turfName}`}
              </h3>
              <button onClick={() => setIsRateModalOpen(false)} className="text-gray-550 hover:bg-gray-250 p-1.5 rounded-full text-[#1b2641] transition">
                <X size={20} strokeWidth={3} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex flex-col items-center">
              <div className="flex gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={32}
                    className={`cursor-pointer transition ${star <= (hoverRating || rating) ? 'text-yellow-500 fill-yellow-500 scale-110' : 'text-gray-300 fill-gray-300'}`}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Please share your detailed feedback..."
                className="w-full border border-gray-200 rounded-xl p-3.5 text-sm outline-none resize-none h-28 focus:border-playoGreen text-gray-700 transition"
              ></textarea>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-gray-100 bg-gray-50/50">
              <button onClick={() => setIsRateModalOpen(false)} className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-100 transition">
                Cancel
              </button>
              <button onClick={handleSubmitRating} className="px-5 py-2 rounded-xl bg-playoGreen text-white font-bold text-sm hover:bg-playoGreenHover hover:shadow-md hover:shadow-green-600/10 active:scale-[0.98] transition">
                {myReviewId ? "Update Review" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
