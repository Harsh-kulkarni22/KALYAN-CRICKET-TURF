"use client";
import { useState, useEffect } from "react";
import { ChevronLeft, Info, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Script from "next/script";

export default function Payment() {
  const router = useRouter();
  const [bookingData, setBookingData] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("online"); // 'online' | 'cash'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("pending_booking");
    if (data) setBookingData(JSON.parse(data));
    else router.push("/book");
  }, [router]);

  const handleProceed = async () => {
    if (!bookingData) return;
    setLoading(true);
    const token = localStorage.getItem("turf_token");

    try {
      // 1. Create Booking
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/bookings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          date: bookingData.date,
          startTime: bookingData.startTime,
          duration: bookingData.duration,
          paymentMethod
        })
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create booking. Slot might be locked.");
        setLoading(false);
        return;
      }

      // 2. Handle Cash
      if (paymentMethod === "cash") {
        toast.success("Booking Successful");
        localStorage.setItem("last_successful_booking", JSON.stringify({ ...bookingData, paymentMethod: "Pay at Venue" }));
        localStorage.removeItem("pending_booking");
        router.push("/success");
        return;
      }

      // 3. Handle Razorpay
      const options = {
        key: "rzp_test_SgC5jsuWbudaSa", // Replace with real key in frontend env
        amount: data.amount,
        currency: "INR",
        name: "KALYAN cricket turf",
        description: "Turf Booking",
        order_id: data.orderId,
        handler: async function (response: any) {
          // Verify payment
          const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/payments/verify-order`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingData: bookingData
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            toast.success("Payment Successful! Booking Confirmed.");
            localStorage.setItem("last_successful_booking", JSON.stringify({ ...bookingData, paymentMethod: "Online Payment" }));
            localStorage.removeItem("pending_booking");
            router.push("/success");
          } else {
            toast.error("Payment Verification Failed");
          }
        },
        prefill: {
          name: "User Name", // Ideally fetched from token/localstorage
          contact: "9999999999"
        },
        theme: {
          color: "#00B156"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast.error("Payment Failed");
        setLoading(false);
      });
      rzp.open();

    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      if (paymentMethod === 'cash') setLoading(false);
    }
  };

  if (!bookingData) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      {/* Header */}
      <div className="flex items-center p-4 bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <button onClick={() => router.back()} className="p-2 -ml-2 mr-2"><ChevronLeft size={24} className="text-gray-700" /></button>
        <span className="font-bold text-[#2A364E] text-lg">Checkout</span>
      </div>

      <div className="w-full px-4 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
          
          {/* Left Column (60% width) - Summary & Options */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Booking Summary */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="font-extrabold text-xl text-[#2A364E] border-b border-gray-100 pb-3.5 mb-3.5">KALYAN cricket turf</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Sport</span>
                  <span className="text-gray-800 font-bold">Box Cricket</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Date</span>
                  <span className="text-gray-800 font-bold">{bookingData.date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Time</span>
                  <span className="text-gray-800 font-bold">{bookingData.startTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Duration</span>
                  <span className="text-gray-800 font-bold">{bookingData.duration} Hr{bookingData.duration > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Payment Options */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="font-bold text-md text-[#2A364E] mb-3">Payment Options</h2>
              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${paymentMethod === 'online' ? 'border-playoGreen bg-green-50/40' : 'border-gray-200'}`}>
                  <input type="radio" name="payment" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} className="accent-playoGreen w-4 h-4" />
                  <div>
                    <div className="font-bold text-gray-800 text-sm">Online Payment</div>
                    <div className="text-xs text-gray-500 font-medium">Razorpay (UPI, Card, NetBanking)</div>
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${paymentMethod === 'cash' ? 'border-playoGreen bg-green-50/40' : 'border-gray-200'}`}>
                  <input type="radio" name="payment" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="accent-playoGreen w-4 h-4" />
                  <div>
                    <div className="font-bold text-gray-800 text-sm">Pay at Venue</div>
                    <div className="text-xs text-gray-500 font-medium">Cash Payment</div>
                  </div>
                </label>
              </div>
            </div>

          </div>

          {/* Right Column (40% width) - Desktop Price Card & Action Button */}
          <div className="hidden lg:block lg:col-span-4 bg-white border border-gray-100 shadow-xl rounded-2xl p-6 space-y-6 sticky top-24">
            <h3 className="font-extrabold text-[#2A364E] text-lg border-b border-gray-100 pb-3 mb-2">Billing Details</h3>

            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 flex items-center gap-1 font-medium">Base Price <Info size={14} className="text-gray-400" /></span>
                <span className="font-bold text-gray-800">₹{bookingData.totalCost}</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-100 pt-3.5 text-base font-extrabold text-[#2A364E]">
                <span>Total Amount</span>
                <span className="text-playoGreen">₹{bookingData.totalCost}</span>
              </div>
            </div>

            <button
              onClick={handleProceed}
              disabled={loading}
              className="w-full py-4 bg-playoGreen hover:bg-playoGreenHover text-white font-bold rounded-xl text-center shadow-lg shadow-green-600/10 hover:shadow-green-600/20 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Processing Payment..." : `Proceed & Pay ₹${bookingData.totalCost}`}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 p-4 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.08)] lg:hidden z-10">
        <button
          onClick={handleProceed}
          disabled={loading}
          className="w-full bg-playoGreen text-white font-bold py-3.5 rounded-xl active:scale-95 transition flex justify-center items-center gap-2 disabled:opacity-50"
        >
          {loading ? "Processing..." : `Proceed & Pay ₹${bookingData.totalCost}`}
        </button>
      </div>

    </div>
  );
}
