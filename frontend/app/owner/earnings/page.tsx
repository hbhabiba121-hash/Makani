"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Search, FileText } from "lucide-react";
import api from "@/lib/axios";

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

interface Property {
  id: number;
  name: string;
  monthly_rent?: string;
}

export default function OwnerEarningsPage() {
  const router = useRouter();
  const [financials, setFinancials] = useState<Financial[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) router.push("/login");
  }, [router]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/api/properties/");
      const propsData = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      setProperties(propsData);

      const allFinancials: Financial[] = [];
      for (const prop of propsData) {
        try {
          const finRes = await api.get(`/financials/summary/${prop.id}/?year=${currentYear}`);
          const finData = Array.isArray(finRes.data) ? finRes.data : [];
          allFinancials.push(...finData);
        } catch {}
      }
      allFinancials.sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return b.month - a.month;
      });
      setFinancials(allFinancials);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const res = await api.get(`/reports/earnings/export/?year=${currentYear}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Earnings_Report_${currentYear}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export PDF report");
    } finally {
      setExporting(false);
    }
  };

  const filtered = financials.filter(f =>
    f.property.name.toLowerCase().includes(search.toLowerCase()) ||
    f.month_display.toLowerCase().includes(search.toLowerCase())
  );

  const showProperties = !loading && financials.length === 0 && properties.length > 0;

  return (
    <div className="p-8 bg-[#f9fafb] min-h-screen">

      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-sm text-gray-400 mb-1">Home › Earnings</p>
          <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        <div className="p-6 flex justify-between items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search by property or date..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#581c87] bg-gray-50"
            />
          </div>

          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-2 bg-[#581c87] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#4c1d95] transition-all disabled:opacity-70"
          >
            {exporting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FileText size={16} />
            )}
            {exporting ? "Generating..." : "Export PDF"}
          </button>
        </div>

        <div className="px-6 pb-2">
          <h2 className="font-bold text-gray-900 text-lg mb-4">Earnings Ledger</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-t border-gray-100">
                <th className="px-6 py-3 text-sm font-semibold text-[#581c87]">Date</th>
                <th className="px-6 py-3 text-sm font-semibold text-[#581c87]">Property Name</th>
                <th className="px-6 py-3 text-sm font-semibold text-[#581c87]">Revenue (MAD)</th>
                <th className="px-6 py-3 text-sm font-semibold text-[#581c87]">Expenses (MAD)</th>
                <th className="px-6 py-3 text-sm font-semibold text-[#581c87]">Commission (15%)</th>
                <th className="px-6 py-3 text-sm font-semibold text-[#581c87]">Net to Owner (MAD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded w-24 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : showProperties ? (
                properties.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                    <td className="px-6 py-4 text-gray-700 font-semibold">
                      {Number(p.monthly_rent).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-red-500 font-semibold">
                      — MAD
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {Math.round(Number(p.monthly_rent) * 0.15).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#581c87]">
                      {Math.round(Number(p.monthly_rent) * 0.85).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No earnings found
                  </td>
                </tr>
              ) : (
                filtered.map((f, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {f.month_display} {f.year}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{f.property.name}</td>
                    <td className="px-6 py-4 text-gray-700 font-semibold">
                      {Number(f.revenue).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-red-500 font-semibold">
                      {Number(f.expenses).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {Number(f.commission).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#581c87]">
                      {Number(f.owner_payout).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}