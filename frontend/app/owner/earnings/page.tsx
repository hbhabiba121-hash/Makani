"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Search, FileText, TrendingUp, TrendingDown, Wallet, DollarSign, Receipt, Calendar, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import api from "@/lib/axios";

interface Financial {
  id: number;
  property: { id: number; name: string };
  month: number;
  month_display: string;
  year: number;
  revenue: string;
  expenses: string;
  commission?: string;
  owner_payout?: string;
  net_profit?: string;
}

interface Expense {
  id: number;
  property: number;
  property_name: string;
  category: string;
  description: string;
  date: string;
  amount: string;
  has_receipt: boolean;
}

interface Property {
  id: number;
  name: string;
  monthly_rent?: string;
}

const MONTHS = [
  { value: 0, label: "All Months" },
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export default function OwnerEarningsPage() {
  const router = useRouter();
  const [financials, setFinancials] = useState<Financial[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = All Months
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) router.push("/login");
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const propsRes = await api.get("/api/properties/");
      const propsData = Array.isArray(propsRes.data) ? propsRes.data : propsRes.data.results ?? [];
      setProperties(propsData);

      const allFinancials: Financial[] = [];
      for (const prop of propsData) {
        try {
          const finRes = await api.get(`/api/financials/monthly-summary/${prop.id}/?year=${selectedYear}`);
          let finData = Array.isArray(finRes.data) ? finRes.data : [];
          
          // Filter by month if selected
          if (selectedMonth !== 0) {
            finData = finData.filter((item: any) => item.month === selectedMonth);
          }
          
          const processedData = finData.map((item: any) => ({
            ...item,
            revenue: item.revenue || 0,
            expenses: item.expenses || 0,
            commission: item.commission || (Number(item.revenue) * 0.15),
            owner_payout: item.net_profit || (Number(item.revenue) * 0.85),
          }));
          
          allFinancials.push(...processedData);
        } catch (err) {
          console.warn(`No financial data for property ${prop.id}:`, err);
        }
      }
      
      allFinancials.sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return b.month - a.month;
      });
      setFinancials(allFinancials);

      // Fetch expenses with month filtering
      const allExpensesData: Expense[] = [];
      for (const prop of propsData) {
        try {
          const expRes = await api.get(`/api/financials/expenses/?property_id=${prop.id}`);
          let expData = expRes.data || [];
          
          // Filter expenses by selected month and year
          if (selectedMonth !== 0) {
            expData = expData.filter((exp: Expense) => {
              const expDate = new Date(exp.date);
              return expDate.getMonth() + 1 === selectedMonth && expDate.getFullYear() === selectedYear;
            });
          } else {
            // Filter by year only
            expData = expData.filter((exp: Expense) => {
              const expDate = new Date(exp.date);
              return expDate.getFullYear() === selectedYear;
            });
          }
          
          allExpensesData.push(...expData);
        } catch (err) {
          console.warn(`No expenses for property ${prop.id}:`, err);
        }
      }
      setAllExpenses(allExpensesData);

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Refetch when month changes
  useEffect(() => {
    if (!loading) {
      fetchData();
    }
  }, [selectedMonth]);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const res = await api.get(`/reports/earnings/export/?year=${selectedYear}&month=${selectedMonth}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Earnings_Report_${selectedYear}${selectedMonth ? `_${MONTHS.find(m => m.value === selectedMonth)?.label}` : ''}.pdf`);
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

  // Calculate totals from filtered data
  const totalRevenue = financials.reduce((sum, f) => sum + Number(f.revenue || 0), 0);
  const totalExpenses = allExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalCommission = financials.reduce((sum, f) => sum + Number(f.commission || 0), 0);
  const totalNetProfit = financials.reduce((sum, f) => sum + Number(f.owner_payout || f.net_profit || 0), 0);

  // Monthly data for chart (only when viewing all months)
  const monthlyChartData = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map((month, idx) => ({
      month,
      revenue: 0,
      commission: 0,
      expenses: 0,
      netProfit: 0
    }));
    
    financials.forEach(f => {
      const monthIdx = (f.month || 1) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        data[monthIdx].revenue += Number(f.revenue || 0);
        data[monthIdx].commission += Number(f.commission || 0);
        data[monthIdx].netProfit += Number(f.owner_payout || f.net_profit || 0);
      }
    });

    // Add expenses to monthly data
    allExpenses.forEach(exp => {
      const expDate = new Date(exp.date);
      const monthIdx = expDate.getMonth();
      if (monthIdx >= 0 && monthIdx < 12 && expDate.getFullYear() === selectedYear) {
        data[monthIdx].expenses += Number(exp.amount || 0);
      }
    });
    
    return data;
  })();

  // Expenses by category from filtered expense records
  const expensesByCategory = allExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {} as Record<string, number>);
  
  const expenseCategories = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));
  const COLORS = ['#581c87', '#7c3aed', '#a855f7', '#c084fc', '#e9d5ff', '#f3e8ff'];

  // Revenue breakdown for pie chart
  const revenueBreakdown = [
    { name: 'Your Earnings', value: totalNetProfit, color: '#10b981' },
    { name: 'Agency Fee', value: totalCommission, color: '#ef4444' },
    { name: 'Expenses', value: totalExpenses, color: '#f97316' },
  ].filter(item => item.value > 0);

  const filtered = financials.filter(f =>
    f.property.name.toLowerCase().includes(search.toLowerCase()) ||
    f.month_display?.toLowerCase().includes(search.toLowerCase())
  );

  const getMonthLabel = () => {
    if (selectedMonth === 0) return `Full Year ${selectedYear}`;
    return `${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear}`;
  };

  if (loading) {
    return (
      <div className="p-8 bg-[#f9fafb] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#581c87] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading earnings data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#f9fafb] min-h-screen">
      <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
        <div>
          <p className="text-sm text-gray-400 mb-1">Home › Earnings</p>
          <h1 className="text-2xl font-bold text-gray-900">Earnings Breakdown</h1>
          <p className="text-sm text-gray-500 mt-1">See exactly where your money comes from and where it goes</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium bg-white hover:bg-gray-50"
          >
            <Filter size={16} />
            Filter
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-2 bg-[#581c87] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#4c1d95] transition-all disabled:opacity-70"
          >
            {exporting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FileText size={16} />
            )}
            {exporting ? "Generating..." : "Export PDF"}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium bg-white"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium bg-white min-w-[140px]"
              >
                {MONTHS.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>
            <div>
              <button
                onClick={() => {
                  setSelectedYear(new Date().getFullYear());
                  setSelectedMonth(0);
                }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} className="text-[#581c87]" />
            <span className="text-xs text-gray-400">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalRevenue.toLocaleString()} MAD</p>
          <p className="text-xs text-gray-400 mt-1">{getMonthLabel()}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Receipt size={18} className="text-orange-500" />
            <span className="text-xs text-gray-400">Total Expenses</span>
          </div>
          <p className="text-2xl font-bold text-orange-500">{totalExpenses.toLocaleString()} MAD</p>
          <p className="text-xs text-gray-400 mt-1">Operational costs</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={18} className="text-red-500" />
            <span className="text-xs text-gray-400">Agency Commission</span>
          </div>
          <p className="text-2xl font-bold text-red-500">{totalCommission.toLocaleString()} MAD</p>
          <p className="text-xs text-gray-400 mt-1">15% of revenue</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={18} className="text-green-600" />
            <span className="text-xs text-gray-400">Your Net Profit</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{totalNetProfit.toLocaleString()} MAD</p>
          <p className="text-xs text-gray-400 mt-1">After commission & expenses</p>
        </div>
      </div>

      {/* Monthly Earnings Trend - Only show when viewing all months */}
      {selectedMonth === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8">
          <h2 className="font-bold text-gray-900 text-lg mb-4">📈 Monthly Earnings Trend ({selectedYear})</h2>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={monthlyChartData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#581c87" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#581c87" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} MAD`]} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#581c87" strokeWidth={2} fill="url(#revenueGrad)" />
              <Area type="monotone" dataKey="commission" name="Commission" stroke="#ef4444" strokeWidth={2} fill="none" strokeDasharray="5 5" />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f97316" strokeWidth={2} fill="none" strokeDasharray="5 5" />
              <Area type="monotone" dataKey="netProfit" name="Net Profit" stroke="#10b981" strokeWidth={2} fill="url(#profitGrad)" />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Revenue Distribution Pie Chart */}
      {revenueBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8">
          <h2 className="font-bold text-gray-900 text-lg mb-4">🥧 Revenue Distribution ({getMonthLabel()})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={revenueBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {revenueBreakdown.map((item, index) => (
                    <Cell key={`cell-${index}`} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${Number(value).toLocaleString()} MAD`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {revenueBreakdown.map((item) => (
                <div key={item.name} className="flex justify-between items-center p-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{item.value.toLocaleString()} MAD</span>
                </div>
              ))}
              <div className="pt-3 mt-2 border-t-2 border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total Revenue</span>
                  <span className="font-bold text-gray-900">{totalRevenue.toLocaleString()} MAD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expenses by Category Chart */}
      {expenseCategories.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8">
          <h2 className="font-bold text-gray-900 text-lg mb-4">💸 Expenses by Category ({getMonthLabel()})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={expenseCategories}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => `${Number(value).toLocaleString()} MAD`} />
                <Bar dataKey="value" fill="#581c87" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {expenseCategories.map((cat) => (
                <div key={cat.name} className="flex justify-between items-center p-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">{cat.name}</span>
                  <span className="font-semibold text-orange-500">{cat.value.toLocaleString()} MAD</span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t-2 border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total Expenses</span>
                  <span className="font-bold text-orange-500">{totalExpenses.toLocaleString()} MAD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financial Breakdown - Clear Money Flow */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 mb-8 border border-purple-100">
        <h2 className="font-bold text-gray-900 text-lg mb-4">💰 Financial Breakdown ({getMonthLabel()})</h2>
        <div className="space-y-3 max-w-2xl">
          <div className="flex justify-between items-center pb-3 border-b border-purple-200">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#581c87] rounded-full"></div>
              <span className="text-gray-700">Total Revenue from bookings</span>
            </div>
            <span className="font-semibold text-gray-900">{totalRevenue.toLocaleString()} MAD</span>
          </div>
          
          <div className="flex justify-between items-center pb-3 border-b border-purple-200 pl-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">− Agency Commission ({totalRevenue > 0 ? ((totalCommission/totalRevenue)*100).toFixed(0) : 15}%)</span>
            </div>
            <span className="text-red-500">-{totalCommission.toLocaleString()} MAD</span>
          </div>
          
          <div className="flex justify-between items-center pb-3 border-b border-purple-200 pl-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-gray-600">− Expenses (Cleaning, WiFi, Maintenance, etc.)</span>
            </div>
            <span className="text-orange-500">-{totalExpenses.toLocaleString()} MAD</span>
          </div>
          
          <div className="flex justify-between items-center pt-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-bold text-gray-900">= Your Earnings (Net Profit)</span>
            </div>
            <span className="text-xl font-bold text-green-600">{totalNetProfit.toLocaleString()} MAD</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-purple-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">Profit Margin</span>
            <span className="text-sm font-semibold text-green-600">
              {totalRevenue > 0 ? ((totalNetProfit / totalRevenue) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all" 
              style={{ width: `${totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Detailed Earnings Ledger Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="font-bold text-gray-900 text-lg">📋 Detailed Earnings Ledger ({getMonthLabel()})</h2>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search by property or date..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#581c87] bg-gray-50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-t border-gray-100 bg-gray-50">
                <th className="px-6 py-3 text-sm font-semibold text-[#581c87]">Date</th>
                <th className="px-6 py-3 text-sm font-semibold text-[#581c87]">Property Name</th>
                <th className="px-6 py-3 text-sm font-semibold text-[#581c87]">Revenue</th>
                <th className="px-6 py-3 text-sm font-semibold text-[#581c87]">Expenses</th>
                <th className="px-6 py-3 text-sm font-semibold text-[#581c87]">Commission</th>
                <th className="px-6 py-3 text-sm font-semibold text-[#581c87] text-green-600">Net to Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No earnings found for {getMonthLabel()}
                  </td>
                </tr>
              ) : (
                filtered.map((f, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {f.month_display} {f.year}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{f.property.name}</td>
                    <td className="px-6 py-4 text-gray-700 font-semibold">
                      {Number(f.revenue).toLocaleString()} MAD
                    </td>
                    <td className="px-6 py-4 text-orange-500">
                      {Number(f.expenses).toLocaleString()} MAD
                    </td>
                    <td className="px-6 py-4 text-red-500">
                      {Number(f.commission).toLocaleString()} MAD
                    </td>
                    <td className="px-6 py-4 font-bold text-green-600">
                      {Number(f.owner_payout || f.net_profit || 0).toLocaleString()} MAD
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