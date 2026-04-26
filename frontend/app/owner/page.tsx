"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  DollarSign, 
  Home, 
  Wallet, 
  Download, 
  MessageCircle,
  ChevronRight 
} from "lucide-react";
import api from "@/lib/axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Property {
  id: number;
  name: string;
  location: string;
  status: string;
  status_display: string;
  monthly_rent: string;
}

interface Financial {
  property: { id: number; name: string };
  month: number;
  month_display: string;
  year: number;
  revenue: string;
  expenses: string;
  commission: string;
  owner_payout: string;
}

export default function OwnerDashboardPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [financials, setFinancials] = useState<Financial[]>([]);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) router.push("/login");
  }, [router]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const propsRes = await api.get("/api/properties/");
      const propsData = Array.isArray(propsRes.data) ? propsRes.data : propsRes.data.results ?? [];
      setProperties(propsData);

      const allFinancials: Financial[] = [];
      for (const prop of propsData) {
        try {
          const finRes = await api.get(`/financials/summary/${prop.id}/?year=${currentYear}&month=${new Date().getMonth() + 1}`);
          const finData = Array.isArray(finRes.data) ? finRes.data : [];
          allFinancials.push(...finData);
        } catch (e) {}
      }
      setFinancials(allFinancials);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- حسابات الأرباح ---
  const totalRevenue = financials.length > 0 
    ? financials.reduce((sum, f) => sum + Number(f.revenue), 0)
    : properties.reduce((sum, p) => sum + Number(p.monthly_rent), 0);

  const totalPayout = financials.length > 0 
    ? financials.reduce((sum, f) => sum + Number(f.owner_payout), 0)
    : properties.reduce((sum, p) => sum + (Number(p.monthly_rent) * 0.85), 0);

  const activeProperties = properties.filter(p => p.status === "available" || p.status === "rented").length;

  // --- وظيفة تحميل التقرير PDF ---
  const downloadPDFReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Financial Report - ${currentMonth} ${currentYear}`, 14, 22);
    
    const tableData = financials.length > 0 
      ? financials.map(f => [f.property.name, f.month_display, `${f.revenue} MAD`, `-${f.commission} MAD`, `${f.owner_payout} MAD`])
      : properties.map(p => [p.name, "Current", `${p.monthly_rent} MAD`, `-${Math.round(Number(p.monthly_rent)*0.15)} MAD`, `${Math.round(Number(p.monthly_rent)*0.85)} MAD`]);

    autoTable(doc, {
      startY: 30,
      head: [['Property', 'Period', 'Gross Revenue', 'Commission (15%)', 'Net Payout']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [88, 28, 135] }
    });

    doc.save(`Report_${currentMonth}_${currentYear}.pdf`);
  };

  // --- وظيفة الواتساب ---
  const contactSupport = () => {
    const phoneNumber = "212600000000"; 
    const message = encodeURIComponent(`Hello Makani Support, I am an owner and I have a question regarding my dashboard for ${currentMonth}.`);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case "available": return "bg-green-50 text-green-600";
      case "rented": return "bg-orange-50 text-orange-600";
      case "maintenance": return "bg-red-50 text-red-500";
      default: return "bg-gray-50 text-gray-500";
    }
  };

  return (
    <div className="p-8 bg-[#f9fafb] min-h-screen">
      {/* Header الداخلي - خاص بالـ Dashboard فقط */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <span>Home</span>
            <ChevronRight size={14} />
            <span className="text-gray-600 font-medium">Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={contactSupport}
            className="flex items-center gap-2 px-4 py-2.5 border border-purple-200 text-[#581c87] rounded-xl text-sm font-semibold hover:bg-purple-50 transition-all"
          >
            <MessageCircle size={18} />
            Contact Support
          </button>

          <button 
            onClick={downloadPDFReport}
            className="flex items-center gap-2 bg-[#581c87] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#4c1d95] transition-all shadow-md shadow-purple-100"
          >
            <Download size={16} />
            Download {currentMonth} Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-2">Total Monthly Earnings</p>
              {loading ? <div className="h-8 bg-gray-100 rounded w-32 animate-pulse" /> : <h3 className="text-2xl font-bold text-gray-900">{Math.round(totalRevenue).toLocaleString()} MAD</h3>}
            </div>
            <div className="p-2 bg-purple-50 rounded-lg"><DollarSign size={20} className="text-[#581c87]" /></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-2">My Properties Status</p>
              {loading ? <div className="h-8 bg-gray-100 rounded w-24 animate-pulse" /> : <h3 className="text-2xl font-bold text-green-600">{activeProperties} Active</h3>}
            </div>
            <div className="p-2 bg-green-50 rounded-lg"><Home size={20} className="text-green-600" /></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-2">Net Payout (to receive)</p>
              {loading ? <div className="h-8 bg-gray-100 rounded w-32 animate-pulse" /> : (
                <>
                  <h3 className="text-2xl font-bold text-gray-900">{Math.round(totalPayout).toLocaleString()} MAD</h3>
                  <p className="text-xs text-gray-400 mt-1">After 15% agency commission</p>
                </>
              )}
            </div>
            <div className="p-2 bg-blue-50 rounded-lg"><Wallet size={20} className="text-blue-600" /></div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-gray-900 text-lg">Recent Earnings Detail</h2>
          <button onClick={() => router.push("/owner/earnings")} className="text-sm font-semibold text-[#581c87] hover:underline">View All</button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-400 text-[12px] uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold">Property Name</th>
              <th className="px-6 py-4 font-semibold">Status / Date</th>
              <th className="px-6 py-4 font-semibold">Gross Revenue</th>
              <th className="px-6 py-4 font-semibold">Commission (15%)</th>
              <th className="px-6 py-4 font-semibold">Net Payout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {financials.length > 0 ? financials.map((f, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-semibold text-gray-900">{f.property.name}</td>
                <td className="px-6 py-4 text-gray-500">{f.month_display} {f.year}</td>
                <td className="px-6 py-4 font-semibold text-gray-700">{Number(f.revenue).toLocaleString()} MAD</td>
                <td className="px-6 py-4 text-gray-500">-{Number(f.commission).toLocaleString()} MAD</td>
                <td className="px-6 py-4 font-bold text-[#581c87]">{Number(f.owner_payout).toLocaleString()} MAD</td>
              </tr>
            )) : properties.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4"><div className="font-semibold text-gray-900">{p.name}</div><div className="text-xs text-gray-400">{p.location}</div></td>
                <td className="px-6 py-4"><span className={`text-xs font-bold px-2 py-1 rounded-full ${statusStyle(p.status)}`}>{p.status_display}</span></td>
                <td className="px-6 py-4 font-semibold text-gray-700">{Number(p.monthly_rent).toLocaleString()} MAD</td>
                <td className="px-6 py-4 text-gray-500">-{Math.round(Number(p.monthly_rent) * 0.15).toLocaleString()} MAD</td>
                <td className="px-6 py-4 font-bold text-[#581c87]">{Math.round(Number(p.monthly_rent) * 0.85).toLocaleString()} MAD</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}