"use client";

import { useState, useEffect } from "react";
import { 
  FileSpreadsheet, 
  FileText, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Activity,
  ArrowRight,
  Info,
  CalendarDays
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface BookingReportItem {
  name: string;
  phone: string;
  date: string;
  time: string;
  duration: string;
  amount: number;
  paymentMethod: string;
  status: string;
}

export default function AdminReports() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Set default dates to current month
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    setStartDate(firstDay.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
  }, []);

  const fetchReportPreview = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("turf_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/bookings?startDate=${startDate}&endDate=${endDate}&limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        calculateMetrics(data.bookings);
      } else {
        toast.error("Failed to fetch report details");
      }
    } catch (err) {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportPreview();
  }, [startDate, endDate]);

  const calculateMetrics = (bookingsList: any[]) => {
    const confirmed = bookingsList.filter(b => b.bookingStatus === "confirmed");
    const totalRevenue = confirmed.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalBookings = confirmed.length;

    const onlineBookings = confirmed.filter(b => b.paymentMethod === "online");
    const onlineRevenue = onlineBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    
    const cashBookings = confirmed.filter(b => b.paymentMethod === "cash");
    const cashRevenue = cashBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    setPreviewData({
      bookings: bookingsList,
      totalRevenue,
      totalBookings,
      onlinePayments: onlineRevenue,
      onlineCount: onlineBookings.length,
      cashPayments: cashRevenue,
      cashCount: cashBookings.length
    });
  };

  const applyPreset = (days: number) => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - days);

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
  };

  const getReportData = (): BookingReportItem[] => {
    if (!previewData || !previewData.bookings) return [];
    return previewData.bookings.map((b: any) => ({
      name: b.userId?.name || "Unknown",
      phone: b.userId?.phone || "N/A",
      date: new Date(b.date).toLocaleDateString("en-GB"),
      time: b.startTime,
      duration: `${b.duration} Hr(s)`,
      amount: b.totalAmount,
      paymentMethod: b.paymentMethod === "online" ? "Online" : "Cash",
      status: b.bookingStatus.toUpperCase()
    }));
  };

  const exportToExcel = () => {
    const data = getReportData();
    if (data.length === 0) {
      toast.error("No data available to export");
      return;
    }

    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");
      
      // Auto-size columns
      const maxLen = data.reduce((acc, row) => {
        return {
          name: Math.max(acc.name, row.name.length),
          phone: Math.max(acc.phone, row.phone.length),
          date: Math.max(acc.date, row.date.length),
          time: Math.max(acc.time, row.time.length),
          duration: Math.max(acc.duration, row.duration.length),
          amount: Math.max(acc.amount, row.amount.toString().length),
          paymentMethod: Math.max(acc.paymentMethod, row.paymentMethod.length),
          status: Math.max(acc.status, row.status.length)
        };
      }, { name: 10, phone: 10, date: 10, time: 10, duration: 10, amount: 10, paymentMethod: 10, status: 10 });

      worksheet["!cols"] = Object.values(maxLen).map(w => ({ wch: w + 3 }));

      XLSX.writeFile(workbook, `Kalyan_Turf_Report_${startDate}_to_${endDate}.xlsx`);
      toast.success("Excel report exported successfully");
    } catch (err) {
      toast.error("Excel generation failed");
    }
  };

  const exportToPDF = () => {
    const data = getReportData();
    if (data.length === 0) {
      toast.error("No data available to export");
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(22);
      doc.setTextColor(0, 177, 86); // playoGreen
      doc.setFont("helvetica", "bold");
      doc.text("KALYAN CRICKET TURF", 14, 20);
      
      doc.setFontSize(14);
      doc.setTextColor(51, 65, 85); // darkText
      doc.text("Booking Summary Report", 14, 28);
      
      // Dates
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.text(`Period: ${new Date(startDate).toLocaleDateString("en-GB")} to ${new Date(endDate).toLocaleDateString("en-GB")}`, 14, 34);
      doc.text(`Generated at: ${new Date().toLocaleString("en-GB")}`, 14, 39);

      // Summary Boxes Background
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, 45, 182, 25, 3, 3, "F");

      // Summary details
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL BOOKINGS", 20, 52);
      doc.text("TOTAL REVENUE", 65, 52);
      doc.text("ONLINE PAYMENTS", 110, 52);
      doc.text("CASH PAYMENTS", 155, 52);

      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`${previewData?.totalBookings || 0}`, 20, 60);
      doc.text(`INR ${previewData?.totalRevenue || 0}`, 65, 60);
      doc.text(`INR ${previewData?.onlinePayments || 0} (${previewData?.onlineCount || 0})`, 110, 60);
      doc.text(`INR ${previewData?.cashPayments || 0} (${previewData?.cashCount || 0})`, 155, 60);

      // Table mapping
      const tableRows = data.map(row => [
        row.name,
        row.phone,
        row.date,
        row.time,
        row.duration,
        `INR ${row.amount}`,
        row.paymentMethod,
        row.status
      ]);

      autoTable(doc, {
        head: [['Name', 'Phone', 'Date', 'Time', 'Duration', 'Amount', 'Payment', 'Status']],
        body: tableRows,
        startY: 78,
        theme: 'striped',
        headStyles: { fillColor: [0, 177, 86], textColor: [255, 255, 255] },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20 },
          3: { cellWidth: 15 },
          4: { cellWidth: 15 },
          5: { cellWidth: 20 },
          6: { cellWidth: 20 },
          7: { cellWidth: 20 }
        }
      });

      doc.save(`Kalyan_Turf_Report_${startDate}_to_${endDate}.pdf`);
      toast.success("PDF report exported successfully");
    } catch (err) {
      console.error(err);
      toast.error("PDF generation failed");
    }
  };

  const exportToCSV = () => {
    const data = getReportData();
    if (data.length === 0) {
      toast.error("No data available to export");
      return;
    }

    try {
      const headers = ["Customer Name", "Phone", "Slot Date", "Slot Time", "Duration", "Amount Paid", "Payment Method", "Status"];
      const rows = data.map(row => [
        `"${row.name.replace(/"/g, '""')}"`,
        `"${row.phone}"`,
        `"${row.date}"`,
        `"${row.time}"`,
        `"${row.duration}"`,
        row.amount,
        `"${row.paymentMethod}"`,
        `"${row.status}"`
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(e => e.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Kalyan_Turf_Report_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV report exported successfully");
    } catch (err) {
      toast.error("CSV generation failed");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Export Reports</h1>
        <p className="text-slate-400 mt-1 text-sm">Download booking worksheets and audit reports in Excel or PDF formats.</p>
      </div>

      {/* Date Ranges Panel */}
      <div className="bg-[#1e293b]/40 border border-slate-800 p-6 rounded-2xl shadow-lg space-y-6">
        <h3 className="font-bold text-slate-200 text-base flex items-center gap-2"><CalendarDays size={18} className="text-playoGreen" /> Select Report Range</h3>
        
        {/* Preset Buttons */}
        <div className="flex flex-wrap gap-2.5">
          <button onClick={() => applyPreset(0)} className="px-3.5 py-1.5 bg-[#0f172a]/50 border border-slate-800 hover:border-playoGreen text-slate-300 text-xs font-semibold rounded-xl transition">Today</button>
          <button onClick={() => applyPreset(7)} className="px-3.5 py-1.5 bg-[#0f172a]/50 border border-slate-800 hover:border-playoGreen text-slate-300 text-xs font-semibold rounded-xl transition">Last 7 Days</button>
          <button onClick={() => applyPreset(30)} className="px-3.5 py-1.5 bg-[#0f172a]/50 border border-slate-800 hover:border-playoGreen text-slate-300 text-xs font-semibold rounded-xl transition">Last 30 Days</button>
          <button onClick={() => {
            const today = new Date();
            const start = new Date(today.getFullYear(), 0, 1);
            setStartDate(start.toISOString().split("T")[0]);
            setEndDate(today.toISOString().split("T")[0]);
          }} className="px-3.5 py-1.5 bg-[#0f172a]/50 border border-slate-800 hover:border-playoGreen text-slate-300 text-xs font-semibold rounded-xl transition">Year to Date</button>
        </div>

        {/* Date Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-3 bg-[#0f172a]/55 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-playoGreen focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 bg-[#0f172a]/55 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-playoGreen focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview Stats Panel */}
      {previewData && (
        <div className="bg-[#1e293b]/20 border border-slate-800 rounded-2xl p-6 shadow-xl grid grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-200">
          
          {/* Confirmed Bookings */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Confirmed Bookings</span>
            <div className="text-xl font-extrabold text-white flex items-center gap-2">
              <Activity size={18} className="text-blue-400" />
              <span>{previewData.totalBookings}</span>
            </div>
          </div>

          {/* Revenue */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Revenue</span>
            <div className="text-xl font-extrabold text-playoGreen flex items-center gap-2">
              <DollarSign size={18} />
              <span>₹{previewData.totalRevenue}</span>
            </div>
          </div>

          {/* Online Payments */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Online Payments</span>
            <div className="text-base font-bold text-slate-200 flex flex-col mt-0.5">
              <span>₹{previewData.onlinePayments}</span>
              <span className="text-[10px] text-slate-500 font-medium">{previewData.onlineCount} booking(s)</span>
            </div>
          </div>

          {/* Cash Payments */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cash Payments</span>
            <div className="text-base font-bold text-slate-200 flex flex-col mt-0.5">
              <span>₹{previewData.cashPayments}</span>
              <span className="text-[10px] text-slate-500 font-medium">{previewData.cashCount} booking(s)</span>
            </div>
          </div>

        </div>
      )}

      {/* Export Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Excel */}
        <button
          onClick={exportToExcel}
          disabled={loading || !previewData || previewData.bookings?.length === 0}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition shadow-lg shadow-green-600/10 disabled:opacity-40 disabled:hover:bg-green-600"
        >
          <FileSpreadsheet size={20} />
          <span>Export to Excel</span>
        </button>

        {/* CSV */}
        <button
          onClick={exportToCSV}
          disabled={loading || !previewData || previewData.bookings?.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition shadow-lg shadow-blue-600/10 disabled:opacity-40 disabled:hover:bg-blue-600"
        >
          <FileSpreadsheet size={20} />
          <span>Export to CSV</span>
        </button>

        {/* PDF */}
        <button
          onClick={exportToPDF}
          disabled={loading || !previewData || previewData.bookings?.length === 0}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition shadow-lg shadow-red-500/10 disabled:opacity-40 disabled:hover:bg-red-500"
        >
          <FileText size={20} />
          <span>Export to PDF</span>
        </button>
      </div>
    </div>
  );
}
