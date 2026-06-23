"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Plus, Minus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import dayjs, { Dayjs } from "dayjs";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
// import { MobileTimePicker } from "@mui/x-date-pickers/MobileTimePicker";
import dynamic from "next/dynamic";

const MobileTimePicker = dynamic(
  () =>
    import("@mui/x-date-pickers/MobileTimePicker").then(
      (mod) => mod.MobileTimePicker
    ),
  {
    ssr: false,
  }
);

export default function Book() {
  const router = useRouter();

  const todayStr = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState<Dayjs>(dayjs());
  const [duration, setDuration] = useState(1);
  const [pricePerHour, setPricePerHour] = useState(600);
  const [totalCost, setTotalCost] = useState(600);

  // Set current time rounded to next 30 min
  useEffect(() => {
    const now = dayjs();

    let hour = now.hour();
    let minute = now.minute();

    if (minute < 30) {
      minute = 30;
    } else {
      hour += 1;
      minute = 0;
    }

    setStartTime(
      dayjs()
        .hour(hour)
        .minute(minute)
        .second(0)
    );

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/settings`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.pricePerHour) {
          setPricePerHour(data.pricePerHour);
        }
      })
      .catch((err) => console.error("Failed to fetch settings:", err));
  }, []);

  // Update total cost
  useEffect(() => {
    setTotalCost(duration * pricePerHour);
  }, [duration, pricePerHour]);

  const handleProceed = () => {
    if (!date || !startTime) {
      toast.error("Please select date and time");
      return;
    }

    if (date < todayStr) {
      toast.error("You cannot book a turf in the past!");
      return;
    }

    const token = localStorage.getItem("turf_token");

    if (!token) {
      toast("Please login to continue", {
        icon: "🔒",
      });

      router.push("/auth");
      return;
    }

    const bookingData = {
      date,
      startTime: startTime.format("HH:mm"),
      duration,
      totalCost,
    };

    localStorage.setItem(
      "pending_booking",
      JSON.stringify(bookingData)
    );

    router.push("/payment");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <Link href="/" className="p-2">
          <ChevronLeft size={24} className="text-gray-700" />
        </Link>
        <span className="font-bold text-[#2A364E] text-base lg:text-lg">Select Slot & Book</span>
        <div className="w-8"></div>
      </div>

      <div className="w-full px-4 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
          
          {/* Left Column (60% width) - Inputs */}
          <div className="lg:col-span-6 space-y-4">
            {/* Venue Info */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 overflow-hidden">
              <h2 className="font-extrabold text-xl text-[#2A364E] mb-1">
                KALYAN cricket turf
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Pratapur Basavakalyan Road, Basavakalyan, Bidar, Karnataka
              </p>
            </div>

            {/* Selection Form */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-5">
              {/* Date */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none font-semibold text-gray-700 focus:border-playoGreen transition"
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Start Time
                </label>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <MobileTimePicker
                    value={startTime}
                    onChange={(newValue) => {
                      if (newValue) setStartTime(newValue);
                    }}
                    ampm
                    minutesStep={30}
                    disablePast={date === todayStr}
                    minTime={dayjs().hour(6).minute(0)}
                    maxTime={dayjs().hour(23).minute(0)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "medium",
                        className: "rounded-xl"
                      },
                    }}
                    sx={{
                      width: "100%",
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                      }
                    }}
                  />
                </LocalizationProvider>
              </div>

              {/* Duration */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">
                  Duration (Hours)
                </label>
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
                  <button
                    onClick={() => setDuration(Math.max(1, duration - 1))}
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition shrink-0"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="font-bold text-gray-800 text-base">
                    {duration} Hr{duration > 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={() => setDuration(duration + 1)}
                    className="w-10 h-10 rounded-full bg-playoGreen flex items-center justify-center text-white hover:bg-playoGreenHover transition shrink-0"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column (40% width) - Desktop Checkout summary card */}
          <div className="hidden lg:block lg:col-span-4 bg-white border border-gray-100 shadow-xl rounded-2xl p-6 space-y-6 sticky top-24">
            <h3 className="font-extrabold text-[#2A364E] text-lg border-b border-gray-100 pb-3 mb-2">Booking Summary</h3>
            
            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Selected Date</span>
                <span className="text-gray-800 font-bold">{date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Start Time</span>
                <span className="text-gray-800 font-bold">{startTime.format("hh:mm A")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Duration</span>
                <span className="text-gray-800 font-bold">{duration} Hour(s)</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-3.5 font-semibold">
                <span className="text-gray-500 font-medium">Rate / Hour</span>
                <span className="text-[#2A364E]">₹{pricePerHour}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-3.5 text-base font-extrabold">
                <span className="text-[#2A364E]">Total Amount</span>
                <span className="text-playoGreen">₹{totalCost}</span>
              </div>
            </div>

            <button
              onClick={handleProceed}
              className="w-full py-4 bg-playoGreen hover:bg-playoGreenHover text-white font-bold rounded-xl text-center shadow-lg shadow-green-600/10 hover:shadow-green-600/20 active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </button>
          </div>

        </div>
      </div>

      {/* Mobile-only Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 p-4 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] lg:hidden">
        <div className="text-gray-800 font-bold text-sm">
          Total Cost
          <span className="text-playoGreen ml-2 text-base">
            ₹{totalCost}
          </span>
        </div>

        <button
          onClick={handleProceed}
          className="bg-playoGreen text-white w-10 h-10 flex items-center justify-center rounded-full hover:bg-playoGreenHover transition"
        >
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}

