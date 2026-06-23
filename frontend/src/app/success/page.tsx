"use client";
import React, { useEffect, useState } from "react";
import { CheckCircle2, Calendar, Clock, CreditCard } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Success() {
  const [bookingData, setBookingData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const data = localStorage.getItem("last_successful_booking");
    if (data) {
      setBookingData(JSON.parse(data));
      // Optional: Clear out the booking details if only meant to be viewed once
      // localStorage.removeItem("last_successful_booking");
    } else {
      router.push("/book");
    }
  }, [router]);

  if (!bookingData) return <div className="min-h-screen bg-gray-50"></div>;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 mt-10 overflow-hidden">
        
        {/* Details Section */}
        <div className="p-6 space-y-4">
          <h2 className="text-[#2A364E] font-bold text-lg border-b border-gray-100 pb-2">KALYAN cricket turf - Booking Summary</h2>
          
          <div className="space-y-3">
             <div className="flex items-center justify-between text-sm">
               <span className="text-gray-500 font-medium flex items-center gap-2"><Calendar size={16}/> Date</span>
               <span className="text-gray-800 font-bold">{bookingData.date}</span>
             </div>
             
             <div className="flex items-center justify-between text-sm">
               <span className="text-gray-500 font-medium flex items-center gap-2"><Clock size={16}/> Time</span>
               <span className="text-gray-800 font-bold">{bookingData.startTime} - {bookingData.duration} Hr{bookingData.duration > 1 ? 's' : ''}</span>
             </div>

             <div className="flex items-center justify-between text-sm">
               <span className="text-gray-500 font-medium flex items-center gap-2"><CreditCard size={16}/> Payment</span>
               <span className="text-gray-800 font-bold">{bookingData.paymentMethod}</span>
             </div>
          </div>

          <div className="mt-4 pt-4 border-t border-dashed border-gray-200 flex items-center justify-between">
             <span className="text-gray-600 font-semibold">Total Amount</span>
             <span className="text-2xl font-bold text-playoGreen">₹{bookingData.totalCost}</span>
          </div>
        </div>

        {/* Banner Section */}
        <div className="bg-playoGreen/10 flex flex-col items-center justify-center p-8 border-t border-playoGreen/20">
          <CheckCircle2 size={72} className="text-playoGreen mb-4" />
          <h1 className="text-2xl font-bold text-[#2A364E] text-center">Booking Successful!</h1>
          <p className="text-playoGreen text-center font-medium mt-1">Your slot is confirmed</p>
        </div>

      </div>

      <div className="mt-6 w-full max-w-md flex flex-col gap-3">
        <Link href="/">
          <button className="w-full bg-playoGreen text-white font-bold py-3.5 rounded-xl hover:bg-playoGreenHover active:scale-[0.98] transition">
            Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
}
