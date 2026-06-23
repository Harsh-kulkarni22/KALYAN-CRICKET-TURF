"use client";

import { useState, useEffect } from "react";
import { 
  DollarSign, 
  Calendar, 
  Users, 
  Activity, 
  TrendingUp, 
  CreditCard,
  Clock,
  Award
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line
} from "recharts";

const COLORS = ["#00B156", "#3b82f6", "#f59e0b", "#ef4444"];

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("turf_token");
      if (!token) return router.push("/auth");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setData(await res.json());
      } else {
        toast.error("Failed to load dashboard data");
      }
    } catch (err) {
      toast.error("Network error while loading analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted) {
      fetchAnalytics();
    }
  }, [isMounted, router]);

  if (!isMounted) return null;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-800 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-slate-800 rounded-2xl lg:col-span-2"></div>
          <div className="h-80 bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const { revenue = {}, bookings = {}, topUsers = [], popularSlots = [], charts = {}, averageBookingValue = 0, averageOccupancyRate = 0 } = data || {};

  const paymentChartData = charts.payments?.map((p: any) => ({
    name: p.method === "online" ? "Online" : "Cash",
    value: p.count,
    revenue: p.revenue
  })) || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1 text-sm">Welcome to the KALYAN Cricket Turf management system.</p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <div className="bg-[#1e293b]/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Revenue</span>
            <h3 className="text-xl font-bold mt-1.5 text-white">₹{revenue.today}</h3>
            <span className="text-[11px] text-slate-500 font-medium mt-1.5 block">{bookings.today} booking(s) today</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-playoGreen/15 flex items-center justify-center text-playoGreen border border-playoGreen/10">
            <DollarSign size={20} />
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-[#1e293b]/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Revenue</span>
            <h3 className="text-xl font-bold mt-1.5 text-white">₹{revenue.monthly}</h3>
            <span className="text-[11px] text-slate-500 font-medium mt-1.5 block">{bookings.monthly} booking(s) this month</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400 border border-blue-500/10">
            <Calendar size={20} />
          </div>
        </div>

        {/* Yearly Revenue */}
        <div className="bg-[#1e293b]/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Yearly Revenue</span>
            <h3 className="text-xl font-bold mt-1.5 text-white">₹{revenue.yearly}</h3>
            <span className="text-[11px] text-slate-500 font-medium mt-1.5 block">Last 365 days</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400 border border-purple-500/10">
            <TrendingUp size={20} />
          </div>
        </div>

        {/* Avg Booking Value */}
        <div className="bg-[#1e293b]/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Booking Value</span>
            <h3 className="text-xl font-bold mt-1.5 text-white">₹{averageBookingValue}</h3>
            <span className="text-[11px] text-slate-500 font-medium mt-1.5 block">Overall average per slot</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 border border-amber-500/10">
            <DollarSign size={20} />
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="bg-[#1e293b]/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Occupancy Rate</span>
            <h3 className="text-xl font-bold mt-1.5 text-white">{averageOccupancyRate}%</h3>
            <span className="text-[11px] text-slate-500 font-medium mt-1.5 block">Last 30 days active hours</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-450 border border-rose-500/10">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* Row 1: Daily Revenue & Payment Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Revenue Area Chart */}
        <div className="bg-[#1e293b]/30 border border-slate-850 p-6 rounded-2xl lg:col-span-2 shadow-xl">
          <h3 className="text-lg font-bold text-slate-200 mb-6">Daily Revenue (Last 30 Days)</h3>
          <div className="h-72 w-full">
            {charts.daily?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">No revenue data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.daily}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00B156" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00B156" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tickFormatter={(v) => v.slice(-5)} />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} 
                    formatter={(value) => [`₹${value}`, "Revenue"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#00B156" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Payment Method Distribution (Pie Chart) */}
        <div className="bg-[#1e293b]/30 border border-slate-850 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <h3 className="text-lg font-bold text-slate-200 mb-4">Payment Methods</h3>
          <div className="h-60 w-full relative flex items-center justify-center">
            {paymentChartData.length === 0 ? (
              <div className="text-slate-500 text-sm">No payment data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentChartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }}
                    formatter={(val, name, props: any) => [`${val} bookings (₹${props.payload.revenue})`, name]}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Occupancy Trend Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#1e293b]/30 border border-slate-850 p-6 rounded-2xl lg:col-span-2 shadow-xl">
          <h3 className="text-lg font-bold text-slate-200 mb-6">Occupancy Trend (Last 30 Days)</h3>
          <div className="h-72 w-full">
            {!charts.occupancy || charts.occupancy.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">No occupancy data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.occupancy}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tickFormatter={(v) => v.slice(-5)} />
                  <YAxis stroke="#64748b" unit="%" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }}
                    formatter={(value) => [`${value}%`, "Occupancy"]}
                  />
                  <Line type="monotone" dataKey="occupancy" stroke="#f59e0b" strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Occupancy Summary KPI */}
        <div className="bg-[#1e293b]/30 border border-slate-850 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-200 mb-4">Occupancy Insights</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Occupancy rate is calculated by comparing hours booked against total operational hours (typically 17 hours/day based on settings).
            </p>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/25 border border-slate-800/40">
                <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider">Avg Occupancy (30d)</span>
                <span className="text-2xl font-extrabold text-amber-400">{averageOccupancyRate}%</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/25 border border-slate-800/40">
                <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider">Target Occupancy</span>
                <span className="text-2xl font-extrabold text-emerald-400">75.0%</span>
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Tip: Adjust price per hour in settings to optimize peak hours occupancy.
          </div>
        </div>
      </div>

      {/* Row 3: Monthly Chart, Top Users & Slots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <div className="bg-[#1e293b]/30 border border-slate-850 p-6 rounded-2xl shadow-xl">
          <h3 className="text-lg font-bold text-slate-200 mb-6">Monthly Revenue (Last 12 Months)</h3>
          <div className="h-72 w-full">
            {charts.monthly?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">No monthly data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }}
                    formatter={(value) => [`₹${value}`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top 5 Active Users */}
        <div className="bg-[#1e293b]/30 border border-slate-850 p-6 rounded-2xl shadow-xl">
          <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2"><Award size={20} className="text-playoGreen" /> Most Active Users</h3>
          <div className="space-y-4">
            {topUsers.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">No user activity yet.</div>
            ) : (
              topUsers.map((user: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/25 border border-slate-800/40">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs border border-slate-700 text-slate-200">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-200 text-sm">{user.name}</h4>
                      <p className="text-[11px] text-slate-500">{user.bookingsCount} confirmed bookings</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-playoGreen">₹{user.totalSpent}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Popular Slots */}
        <div className="bg-[#1e293b]/30 border border-slate-850 p-6 rounded-2xl shadow-xl">
          <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2"><Clock size={20} className="text-blue-400" /> Popular Time Slots</h3>
          <div className="space-y-3">
            {popularSlots.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">No slot details yet.</div>
            ) : (
              popularSlots.slice(0, 5).map((slot: any, idx: number) => {
                const [h, m] = slot.slot.split(":").map(Number);
                const ampm = h >= 12 ? "PM" : "AM";
                const displayH = h % 12 || 12;
                const endH = (h + 1) % 12 || 12;
                const endAmpm = (h + 1) >= 12 && (h + 1) < 24 ? "PM" : "AM";
                const timeLabel = `${displayH}:${m.toString().padStart(2, "0")} ${ampm} - ${endH}:${m.toString().padStart(2, "0")} ${endAmpm}`;

                return (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/25 border border-slate-800/40">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-playoGreen"></div>
                      <span className="text-sm font-medium text-slate-300">{timeLabel}</span>
                    </div>
                    <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full font-bold border border-slate-700">
                      {slot.count} times
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
