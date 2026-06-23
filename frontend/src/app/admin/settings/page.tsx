"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  DollarSign, 
  Clock, 
  Save,
  MessageCircle
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSettings() {
  const [settings, setSettings] = useState<any>({
    pricePerHour: 600,
    openTime: "06:30",
    closeTime: "23:30",
    instagramLink: "",
    googleMapsLink: "",
    maxBookingDuration: 2,
    cashPaymentEnabled: true,
    onlinePaymentEnabled: true,
    emailNotificationsEnabled: false,
    smtpSenderEmail: ""
  });
  const [testEmail, setTestEmail] = useState("");
  const [testingEmail, setTestingEmail] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("turf_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSettings(await res.json());
      } else {
        toast.error("Failed to load settings");
      }
    } catch (err) {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("turf_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/settings`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        toast.success("Global settings updated successfully");
        fetchSettings();
      } else {
        toast.error("Failed to update settings");
      }
    } catch (err) {
      toast.error("Error saving settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!testEmail) {
      toast.error("Please enter an email address for the test");
      return;
    }
    setTestingEmail(true);
    try {
      const token = localStorage.getItem("turf_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/settings/test-email`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ email: testEmail })
      });
      if (res.ok) {
        toast.success("Test email dispatched! Check simulation or Email logs.");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to send test email");
      }
    } catch (err) {
      toast.error("Error sending test email");
    } finally {
      setTestingEmail(false);
    }
  };

  if (loading && !settings._id) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-800 rounded"></div>
        <div className="h-96 bg-slate-800 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Global Settings</h1>
        <p className="text-slate-400 mt-1 text-sm">Configure operating hours, pricing rules, social links, and payment methods.</p>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-[#1e293b]/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-6">
        
        {/* Section 1: Operating Rules */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-200 text-sm border-b border-slate-800 pb-2.5 flex items-center gap-2">
            <Clock size={16} className="text-playoGreen" /> Operating Hours & Rules
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Price Per Hour */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Price Per Hour (INR)</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-500 font-bold text-sm">₹</span>
                <input
                  type="number"
                  required
                  value={settings.pricePerHour}
                  onChange={(e) => setSettings({ ...settings, pricePerHour: Number(e.target.value) })}
                  className="w-full pl-8 pr-4 py-2.5 bg-[#0f172a]/55 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-playoGreen focus:outline-none transition"
                />
              </div>
            </div>

            {/* Opening Time */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Opening Hour</label>
              <input
                type="text"
                placeholder="e.g. 06:30"
                required
                value={settings.openTime}
                onChange={(e) => setSettings({ ...settings, openTime: e.target.value })}
                className="w-full p-2.5 bg-[#0f172a]/55 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-playoGreen focus:outline-none transition"
              />
            </div>

            {/* Closing Time */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Closing Hour</label>
              <input
                type="text"
                placeholder="e.g. 23:30"
                required
                value={settings.closeTime}
                onChange={(e) => setSettings({ ...settings, closeTime: e.target.value })}
                className="w-full p-2.5 bg-[#0f172a]/55 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-playoGreen focus:outline-none transition"
              />
            </div>

            {/* Maximum Booking Duration */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Max Booking Duration (Hrs)</label>
              <input
                type="number"
                required
                min={1}
                max={24}
                value={settings.maxBookingDuration}
                onChange={(e) => setSettings({ ...settings, maxBookingDuration: Number(e.target.value) })}
                className="w-full p-2.5 bg-[#0f172a]/55 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-playoGreen focus:outline-none transition"
              />
            </div>

          </div>
        </div>

        {/* Section 2: Payment Enablement */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-slate-200 text-sm border-b border-slate-800 pb-2.5 flex items-center gap-2">
            <DollarSign size={16} className="text-playoGreen" /> Payment System Toggles
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Cash Toggle */}
            <label className="flex items-center justify-between p-4 bg-[#0f172a]/30 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition">
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-slate-200 block">Cash Payment (Pay at Venue)</span>
                <span className="text-[11px] text-slate-500 font-medium">Allow customers to lock slots and pay cash on arrival</span>
              </div>
              <input
                type="checkbox"
                checked={settings.cashPaymentEnabled}
                onChange={(e) => setSettings({ ...settings, cashPaymentEnabled: e.target.checked })}
                className="accent-playoGreen w-5 h-5 cursor-pointer shrink-0"
              />
            </label>

            {/* Online Toggle */}
            <label className="flex items-center justify-between p-4 bg-[#0f172a]/30 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition">
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-slate-200 block">Online Payment (Razorpay)</span>
                <span className="text-[11px] text-slate-500 font-medium">Require customer checkout via Razorpay card/UPI gateway</span>
              </div>
              <input
                type="checkbox"
                checked={settings.onlinePaymentEnabled}
                onChange={(e) => setSettings({ ...settings, onlinePaymentEnabled: e.target.checked })}
                className="accent-playoGreen w-5 h-5 cursor-pointer shrink-0"
              />
            </label>

          </div>
        </div>

        {/* Section 3: Social Contacts & Embeds */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-slate-200 text-sm border-b border-slate-800 pb-2.5 flex items-center gap-2">
            <MessageCircle size={16} className="text-playoGreen" /> Support & Social Link Contacts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Instagram Contact */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Instagram Profile Link</label>
              <input
                type="text"
                placeholder="https://instagram.com/..."
                value={settings.instagramLink}
                onChange={(e) => setSettings({ ...settings, instagramLink: e.target.value })}
                className="w-full p-2.5 bg-[#0f172a]/55 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-playoGreen focus:outline-none transition"
              />
            </div>

            {/* Google Maps link */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-sans">Google Maps Embed URI</label>
              <input
                type="text"
                placeholder="https://google.com/maps/embed/..."
                value={settings.googleMapsLink}
                onChange={(e) => setSettings({ ...settings, googleMapsLink: e.target.value })}
                className="w-full p-2.5 bg-[#0f172a]/55 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-playoGreen focus:outline-none transition"
              />
            </div>

          </div>
        </div>

        {/* Section 4: Email Notification Settings */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-slate-200 text-sm border-b border-slate-800 pb-2.5 flex items-center gap-2">
            <MessageCircle size={16} className="text-playoGreen" /> Email Notification Configurations
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Enable/Disable Toggle */}
            <label className="flex items-center justify-between p-4 bg-[#0f172a]/30 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition col-span-2">
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-slate-200 block">Email Notifications Enabled</span>
                <span className="text-[11px] text-slate-500 font-medium">Toggle automatic email booking confirmations and pre-match reminders</span>
              </div>
              <input
                type="checkbox"
                checked={settings.emailNotificationsEnabled || false}
                onChange={(e) => setSettings({ ...settings, emailNotificationsEnabled: e.target.checked })}
                className="accent-playoGreen w-5 h-5 cursor-pointer shrink-0"
              />
            </label>

            {/* SMTP Sender Email */}
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">SMTP Sender Email (From Address)</label>
              <input
                type="email"
                placeholder="e.g. kalyan-turf-bookings@gmail.com (defaults to credentials user if empty)"
                value={settings.smtpSenderEmail || ""}
                onChange={(e) => setSettings({ ...settings, smtpSenderEmail: e.target.value })}
                className="w-full p-2.5 bg-[#0f172a]/55 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-playoGreen focus:outline-none transition"
              />
            </div>

            {/* Test Email action */}
            <div className="col-span-2 bg-[#0f172a]/15 p-4 rounded-xl border border-slate-800/60 flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1 w-full">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Send Test Email Message</label>
                <input
                  type="email"
                  placeholder="Enter email address (e.g., test-recipient@gmail.com)"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full p-2.5 bg-[#0f172a]/55 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-playoGreen focus:outline-none transition"
                />
              </div>
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={testingEmail || !testEmail}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition disabled:opacity-40 w-full sm:w-auto shrink-0"
              >
                {testingEmail ? "Sending..." : "Send Test Notification"}
              </button>
            </div>

          </div>
        </div>

        {/* Submit Actions */}
        <div className="border-t border-slate-850 pt-6 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-playoGreen hover:bg-playoGreenHover text-white font-bold text-sm rounded-xl flex items-center gap-2 transition disabled:opacity-40"
          >
            <Save size={18} />
            <span>Save Settings Changes</span>
          </button>
        </div>

      </form>
    </div>
  );
}
