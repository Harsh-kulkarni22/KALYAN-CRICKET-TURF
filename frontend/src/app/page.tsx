"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Share2,
  MapPin,
  Star,
  Droplets,
  Car,
  BriefcaseMedical,
  Store,
  ChevronRight,
  ChevronLeft,
  X,
  AlignCenter,
  Loader2
} from "lucide-react";

import { FaInstagram } from "react-icons/fa";
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

export default function Home() {
  const { isLoggedIn } = useAuth();
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [displayRating, setDisplayRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  // Reviews additions
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [distribution, setDistribution] = useState<{ [key: number]: number }>({
    5: 0, 4: 0, 3: 0, 2: 0, 1: 0
  });
  const [myReviewId, setMyReviewId] = useState<string | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const turfName = "KALYAN CRICKET TURF";
  const images = [
    "/images/turf1.jpeg",
    "/images/turf2.jpeg",
    "/images/turf3.jpeg",
    "/images/turf4.jpeg",
  ];

  const [currentImage, setCurrentImage] = useState(0);
  const [settings, setSettings] = useState<any>({
    pricePerHour: 600,
    openTime: "06:30",
    closeTime: "23:30",
    instagramLink: "",
    googleMapsLink: "",
    maxBookingDuration: 2
  });

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
          // Fallback manual count if distribution not computed
          const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          (data.reviews || []).forEach((r: any) => {
            if (r.rating >= 1 && r.rating <= 5) {
              dist[r.rating as 1 | 2 | 3 | 4 | 5] += 1;
            }
          });
          setDistribution(dist);
        }
      }
    } catch (err) {
      console.error("Error loading reviews:", err);
    } finally {
      setLoadingReviews(false);
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
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 3000); // changes every 3 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/settings`)
      .then(res => res.json())
      .then(data => {
        if (data) setSettings(data);
      })
      .catch(err => console.error("Error fetching settings:", err));

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

  return (
    <main className="pb-24 px-4 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">

        {/* Left Side (60% width) */}
        <div className="lg:col-span-6 space-y-6">

          {/* Hero Carousel Section */}
          <div className="relative w-full h-[250px] lg:h-[450px] overflow-hidden rounded-2xl shadow-sm">
            <Image
              src={images[currentImage]}
              alt="Kalyan Turf"
              fill
              priority
              className="object-cover transition-all duration-700"
            />

            {/* Left Button */}
            <div className="absolute inset-y-0 left-0 flex items-center px-2">
              <button
                onClick={() =>
                  setCurrentImage(
                    currentImage === 0 ? images.length - 1 : currentImage - 1
                  )
                }
                className="bg-black/30 p-1.5 rounded-full text-white hover:bg-black/50 transition"
              >
                <ChevronLeft size={24} />
              </button>
            </div>

            {/* Right Button */}
            <div className="absolute inset-y-0 right-0 flex items-center px-2">
              <button
                onClick={() =>
                  setCurrentImage((currentImage + 1) % images.length)
                }
                className="bg-black/30 p-1.5 rounded-full text-white hover:bg-black/50 transition"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Dots */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
              {images.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${currentImage === index
                    ? "bg-playoGreen"
                    : "bg-white opacity-60"
                    }`}
                />
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-[#2A364E]">{turfName}</h1>
              <p className="text-gray-500 text-sm mt-1.5 font-medium">Pratapur Basavakalyan Road, Basavakalyan, Bidar, Karnataka</p>

              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-sm font-semibold text-gray-700">
                  <Star size={16} className={displayRating > 0 ? "text-yellow-500 fill-yellow-500 mr-1" : "text-gray-300 fill-gray-300 mr-1"} />
                  {displayRating} <span className="text-gray-500 font-normal ml-1">({ratingCount} rating{ratingCount !== 1 ? 's' : ''})</span>
                </div>
                <button onClick={handleOpenRateModal} className="text-playoGreen font-semibold text-sm underline underline-offset-2 hover:text-playoGreenHover transition">
                  {myReviewId ? "Edit My Review" : "Rate Venue"}
                </button>
              </div>
            </div>

            {/* Repositioned Reviews Section directly below rating row & above Timing */}
            <div className="border border-gray-100 shadow-sm rounded-2xl p-5 bg-white space-y-4">
              {loadingReviews ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="animate-spin text-playoGreen" size={24} />
                </div>
              ) : reviews.length === 0 ? (
                // Empty State
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="flex gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={24} className="text-gray-300 fill-gray-300" />
                    ))}
                  </div>
                  <h3 className="font-bold text-gray-700 text-sm mb-1">No reviews yet.</h3>
                  <p className="text-xs text-gray-400 max-w-xs mb-4">
                    Be the first customer to rate KALYAN Cricket Turf!
                  </p>
                  <button
                    onClick={handleOpenRateModal}
                    className="bg-playoGreen text-white font-bold px-5 py-2.5 rounded-xl text-xs hover:bg-emerald-600 transition"
                  >
                    Rate Venue
                  </button>
                </div>
              ) : (
                // Reviews Listing (Latest 3)
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={
                            star <= Math.round(displayRating)
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-gray-300 fill-gray-300"
                          }
                        />
                      ))}
                    </div>
                    <span>
                      {displayRating} ({ratingCount} review{ratingCount !== 1 ? 's' : ''})
                    </span>
                  </div>

                  {/* Scrollable container for up to 3 reviews */}
                  <div className="max-h-[420px] overflow-y-auto pr-1 space-y-3.5 no-scrollbar">
                    {reviews.slice(0, 3).map((r, idx) => {
                      const formattedDate = new Date(r.createdAt).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      });
                      return (
                        <div
                          key={r._id || idx}
                          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-3 items-start"
                        >
                          {/* Circular User Avatar */}
                          <div className="w-8 h-8 rounded-full bg-playoGreen/15 flex items-center justify-center font-bold text-xs text-playoGreen shrink-0 border border-playoGreen/10 uppercase">
                            {r.userId?.name?.charAt(0) || "?"}
                          </div>

                          {/* Card Content */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex justify-between items-baseline gap-2">
                              <span className="font-semibold text-gray-800 text-sm truncate">
                                {r.userId?.name || "Deleted User"}
                              </span>
                              <span className="text-gray-400 text-[10px] shrink-0">
                                {formattedDate}
                              </span>
                            </div>

                            {/* Stars */}
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={11}
                                  className={
                                    star <= r.rating
                                      ? "text-yellow-500 fill-yellow-500"
                                      : "text-gray-200 fill-gray-200"
                                  }
                                />
                              ))}
                            </div>

                            {/* Review Content */}
                            {r.review && (
                              <p className="text-gray-700 text-xs font-semibold leading-relaxed mt-1">
                                "{r.review}"
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* See All Reviews link */}
                  <div className="pt-1">
                    <Link
                      href="/reviews"
                      className="text-playoGreen font-semibold hover:underline text-sm inline-block transition"
                    >
                      See All Reviews →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Actions: Sticky card replacement on mobile */}
            <div className="lg:hidden mt-5 grid grid-cols-2 gap-3">
              <Link href="/book" className="col-span-2">
                <button className="w-full bg-playoGreen text-white font-semibold py-3.5 rounded-xl text-center shadow-lg shadow-green-600/10 hover:bg-playoGreenHover transition active:scale-[0.98]">
                  Book Now
                </button>
              </Link>
            </div>

            {/* Timing Section */}
            <div className="border border-gray-100 shadow-sm rounded-2xl p-5 bg-white">
              <h2 className="font-bold text-[#2A364E] text-md mb-2">Timing</h2>
              <p className="text-gray-600 text-sm font-medium">Open Daily: {settings.openTime} to {settings.closeTime}</p>
            </div>

            {/* Location Section */}
            <div className="border border-gray-100 shadow-sm rounded-2xl p-5 bg-white">
              <h2 className="font-bold text-[#2A364E] text-md">Location</h2>
              <p className="text-gray-600 mt-2 text-sm leading-relaxed">
                Pratapur Basavakalyan Road, Basavakalyan, Bidar, Karnataka
              </p>
              <div className="mt-4 w-full h-[250px] bg-gray-200 rounded-2xl relative overflow-hidden shadow-inner border border-gray-50">
                <iframe src={settings.googleMapsLink || "https://www.google.com/maps/embed?pb=!1m13!1m8!1m3!1d949.2950158414587!2d76.934256!3d17.877032!3m2!1i1024!2i768!4f13.1!3m2!1m1!2s!5e0!3m2!1sen!2sin!4v1782214393851!5m2!1sen!2sin"} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
              </div>
            </div>

            {/* Amenities Section */}
            <div className="border border-gray-100 shadow-sm rounded-2xl p-5 bg-white">
              <h2 className="font-bold text-[#2A364E] text-md mb-4">Amenities</h2>
              <div className="grid grid-cols-2 gap-y-4 text-sm text-gray-700 font-medium">
                <div className="flex items-center gap-2.5"><div className="bg-playoGreen rounded-full p-1"><Car size={14} className="text-white" /></div> Parking</div>
                <div className="flex items-center gap-2.5"><div className="bg-playoGreen rounded-full p-1"><BriefcaseMedical size={14} className="text-white" /></div> First Aid</div>
                <div className="flex items-center gap-2.5"><div className="bg-playoGreen rounded-full p-1"><Droplets size={14} className="text-white" /></div> Drinking Water</div>
                <div className="flex items-center gap-2.5"><div className="bg-playoGreen rounded-full p-1"><Store size={14} className="text-white" /></div> Shop / General Store</div>
              </div>
            </div>

            {/* About Venue */}
            <div className="border border-gray-100 shadow-sm rounded-2xl p-5 bg-white">
              <h2 className="font-bold text-[#2A364E] text-md mb-3">About Venue</h2>
              <div className="text-sm text-gray-600 space-y-2.5 leading-relaxed">
                <p className="font-bold text-center border-b border-gray-100 pb-2">Venue Rules & Policy</p>
                <p>• Eatables are not allowed inside the premises.</p>
                <p>• Consumption of food, alcohol, and smoking inside the premises is strictly prohibited.</p>
                <p>• Yelling, shouting, or offensive language will result in removal from the facility.</p>
                <p>• The booked slot timings must be followed strictly. Please report to the venue 5 minutes prior.</p>
                <p>• Management is not responsible for the loss of personal belongings or injuries caused during matches.</p>
                <p>• Please keep the facility clean. Littering may result in a permanent ban.</p>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side (40% width) - Desktop Sticky Booking Card */}
        <div className="hidden lg:block lg:col-span-4 sticky top-24 bg-white border border-gray-100 shadow-xl rounded-2xl p-6 space-y-6">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Base Price</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-[#2A364E]">₹{settings.pricePerHour}</span>
              <span className="text-sm text-gray-500 font-medium">/ Hour</span>
            </div>
          </div>

          <Link href="/book" className="block">
            <button className="w-full py-4 bg-playoGreen text-white font-bold rounded-xl text-center shadow-lg shadow-green-600/10 hover:bg-playoGreenHover hover:shadow-green-600/20 active:scale-[0.98] transition">
              Book Now
            </button>
          </Link>

          <div className="border-t border-gray-100 pt-4 space-y-3.5">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-gray-500 font-medium">Availability</span>
              <span className="text-emerald-600 font-bold bg-green-50 px-2.5 py-0.5 rounded-full text-xs">Open Daily</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Operating Hours</span>
              <span className="text-gray-800 font-semibold">{settings.openTime} - {settings.closeTime}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Max Duration</span>
              <span className="text-gray-800 font-semibold">{settings.maxBookingDuration} Hour(s)</span>
            </div>
          </div>

          {settings.instagramLink && (
            <a
              href={settings.instagramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-95 text-white rounded-xl text-xs font-bold transition shadow-md"
            >
              <FaInstagram size={16} />
              <span>Follow us on Instagram</span>
            </a>
          )}
        </div>

      </div>

      {/* Footer */}
      <footer className="mt-12 bg-gray-50 p-6 text-center text-sm text-gray-500 border-t border-gray-200/60 rounded-2xl">
        <div className="flex justify-center gap-4 mb-4">
          {settings.instagramLink && (
            <a
              href={settings.instagramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center hover:scale-105 transition"
            >
              <FaInstagram className="text-white text-lg" />
            </a>
          )}
          <a
            href="https://www.instagram.com/kalyan_dresses_since_2016"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center hover:scale-105 transition"
          >
            <FaInstagram className="text-white text-lg" />
          </a>
        </div>
        <p>© 2026 KALYAN CRICKET TURF Booking. All rights reserved.</p>
      </footer>

      {/* Rate Venue Modal */}
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
    </main>
  );
}
