"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "@/lib/axios";

interface Financial {
  property: { id: number; name: string };
  month: number;
  month_display: string;
  year: number;
  owner_payout: string;
}

interface Property {
  id: number;
  name: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function OwnerReportsPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [financials, setFinancials] = useState<Financial[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

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
        } catch {
        }
      }
      setFinancials(allFinancials);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };


  const getLast6Months = () => {
    const result = [];
    for (let i = 5; i >= 0; i--) {
      let month = currentMonth - i;
      let year = currentYear;
      if (month <= 0) {
        month += 12;
        year -= 1;
      }
      const monthFins = financials.filter(f => f.month === month && f.year === year);
      const total = monthFins.reduce((sum, f) => sum + Number(f.owner_payout), 0);
      result.push({
        month: MONTHS[month - 1],
        payout: total,
      });
    }
    return result;
  };

  const chartData = getLast6Months();

  const getReportMonths = () => {
    const months = [...new Set(financials.map(f => `${f.year}-${f.month}`))];
    months.sort((a, b) => b.localeCompare(a));
    return months.map(key => {
      const [year, month] = key.split("-").map(Number);
      const monthFins = financials.filter(f => f.month === month && f.year === year);
      return {
        key,
        year,
        month,
        monthDisplay: MONTHS[month - 1],
        totalPayout: monthFins.reduce((sum, f) => sum + Number(f.owner_payout), 0),
        propertyIds: monthFins.map(f => f.property.id),
      };
    });
  };

  const reportMonths = getReportMonths();

  // Download PDF
  const handleDownload = async (propertyId: number, year: number, month: number, label: string) => {
    setDownloading(label);
    try {
      const res = await api.get(`/reports/monthly/${propertyId}/?year=${year}&month=${month}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${label}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download report");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="p-8 bg-[#f9fafb] min-h-screen">

      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-sm text-gray-400 mb-1">Home › Reports</p>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-bold text-gray-900 text-lg mb-1">Financial Analytics</h2>
        <p className="text-sm text-gray-400 mb-6">Monthly Net Income (Last 6 Months)</p>
        {loading ? (
          <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} barSize={60}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `${v.toLocaleString()} MAD`}
              />
              <Tooltip
                formatter={(value) => [`${Number(value).toLocaleString()} MAD`]}
                cursor={{ fill: "#f3e8ff" }}
              />
              <Bar dataKey="payout" fill="#581c87" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 text-lg mb-6">Annual Statements</h2>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : reportMonths.length === 0 ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => {
              let month = currentMonth - i;
              let year = currentYear;
              if (month <= 0) { month += 12; year -= 1; }
              const label = `${MONTHS[month - 1]} ${year}`;
              return (
                <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${i === 0 ? "border-[#581c87]/20 bg-purple-50" : "border-gray-100"}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${i === 0 ? "bg-[#581c87]" : "bg-purple-100"}`}>
                      <FileText size={18} className={i === 0 ? "text-white" : "text-[#581c87]"} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{label} Financial Statement</p>
                      <p className="text-xs text-gray-400">Generated on {label}</p>
                    </div>
                  </div>
                  {properties[0] && (
                    <button
                      onClick={() => handleDownload(properties[0].id, year, month, label)}
                      disabled={downloading === label}
                      className="flex items-center gap-2 bg-[#581c87] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#4c1d95] transition-all disabled:opacity-50"
                    >
                      <Download size={15} />
                      {downloading === label ? "..." : "Download"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {reportMonths.map((report) => {
              const label = `${report.monthDisplay} ${report.year}`;
              return (
                <div key={report.key} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-purple-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                      <FileText size={18} className="text-[#581c87]" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{label} Financial Statement</p>
                      <p className="text-xs text-gray-400">Generated on {label}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(report.propertyIds[0], report.year, report.month, label)}
                    disabled={downloading === label}
                    className="flex items-center gap-2 bg-[#581c87] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#4c1d95] transition-all disabled:opacity-50"
                  >
                    <Download size={15} />
                    {downloading === label ? "..." : "Download"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}