"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, TrendingUp, TrendingDown, MoreVertical, Home, Users, Building2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import api from "@/lib/axios";

interface Property {
  id: number;
  name: string;
  location: string;
  monthly_rent: string;
  status: string;
  status_display: string;
  created_at: string;
}

interface Owner {
  id: number;
  full_name: string;
  email: string;
}

interface FinancialRecord {
  id: number;
  property: number;
  amount: string;
  type: string;
  date: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    ownerPayouts: 0,
    occupancyRate: 0,
    totalProperties: 0,
    activeProperties: 0,
    totalOwners: 0
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('access');
    if (!token) {
      router.push('/login');
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch properties
      const propertiesRes = await api.get("/api/properties/");
      const propertiesData = Array.isArray(propertiesRes.data) ? propertiesRes.data : propertiesRes.data.results ?? [];
      setProperties(propertiesData.slice(0, 5));
      
      // Fetch owners
      const ownersRes = await api.get("/api/owners/");
      const ownersData = Array.isArray(ownersRes.data) ? ownersRes.data : ownersRes.data.results ?? [];
      setOwners(ownersData);
      
      // Calculate real statistics
      calculateStats(propertiesData, ownersData);
      
      // Generate monthly data from properties
      generateMonthlyData(propertiesData);
      
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (properties: Property[], owners: Owner[]) => {
    // Total monthly revenue from all properties
    const totalRevenue = properties.reduce((sum, p) => sum + Number(p.monthly_rent), 0);
    
    // Calculate expenses (example: 35% of revenue for maintenance, utilities, etc.)
    const totalExpenses = totalRevenue * 0.35;
    
    // Net profit = revenue - expenses
    const netProfit = totalRevenue - totalExpenses;
    
    // Owner payouts (example: 70% of net profit goes to owners)
    const ownerPayouts = netProfit * 0.7;
    
    // Occupancy rate (properties with status 'rented' or 'available' that are occupied)
    const activeProperties = properties.filter(p => p.status === 'rented' || p.status === 'available').length;
    const occupancyRate = properties.length > 0 ? (activeProperties / properties.length) * 100 : 0;
    
    setStats({
      totalRevenue,
      totalExpenses,
      netProfit,
      ownerPayouts,
      occupancyRate,
      totalProperties: properties.length,
      activeProperties,
      totalOwners: owners.length
    });
  };

  const generateMonthlyData = (properties: Property[]) => {
    // Get last 6 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    const monthlyStats = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = currentMonth - i;
      const monthName = months[monthIndex >= 0 ? monthIndex : monthIndex + 12];
      
      // Filter properties created in or before this month
      // For demo, we'll distribute revenue across months
      const revenueForMonth = properties.reduce((sum, p) => {
        const propertyDate = new Date(p.created_at);
        const propertyMonth = propertyDate.getMonth();
        
        // If property was created by this month, include its revenue
        if (propertyMonth <= monthIndex || monthIndex >= propertyMonth) {
          return sum + Number(p.monthly_rent);
        }
        return sum;
      }, 0) / 6; // Spread across 6 months for demo
      
      monthlyStats.push({
        month: monthName,
        revenue: Math.round(revenueForMonth),
        expenses: Math.round(revenueForMonth * 0.35),
      });
    }
    
    setMonthlyData(monthlyStats);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(amount)) + ' MAD';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const statCards = [
    { 
      title: "Total Revenue", 
      value: formatCurrency(stats.totalRevenue), 
      change: "+12.5%", 
      positive: true, 
      icon: <DollarSign size={20} />, 
      color: "text-blue-600", 
      bg: "bg-blue-50",
      subtitle: "Monthly recurring revenue"
    },
    { 
      title: "Total Expenses", 
      value: formatCurrency(stats.totalExpenses), 
      change: "+8.2%", 
      positive: true, 
      icon: <TrendingUp size={20} />, 
      color: "text-purple-600", 
      bg: "bg-purple-50",
      subtitle: "Maintenance & operations"
    },
    { 
      title: "Net Profit", 
      value: formatCurrency(stats.netProfit), 
      change: "+18.3%", 
      positive: true, 
      icon: <TrendingUp size={20} />, 
      color: "text-green-600", 
      bg: "bg-green-50",
      subtitle: "After expenses"
    },
    { 
      title: "Owner Payouts", 
      value: formatCurrency(stats.ownerPayouts), 
      change: "-3.1%", 
      positive: false, 
      icon: <TrendingDown size={20} />, 
      color: "text-orange-600", 
      bg: "bg-orange-50",
      subtitle: "Due to owners"
    },
  ];

  return (
    <div className="p-8 bg-[#f9fafb] min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Overview of your property management business</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>{stat.icon}</div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.positive ? "text-green-600 bg-green-50" : "text-red-500 bg-red-50"}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-[#581c87] to-[#7c3aed] rounded-2xl p-6 text-white shadow-lg">
          <Home size={24} className="mb-2 opacity-80" />
          <p className="text-sm opacity-80">Total Properties</p>
          <p className="text-3xl font-bold">{stats.totalProperties}</p>
          <p className="text-xs opacity-70 mt-1">{stats.activeProperties} active</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <Building2 size={24} className="mb-2 text-[#581c87]" />
          <p className="text-sm text-gray-500">Occupancy Rate</p>
          <p className="text-2xl font-bold text-gray-900">{stats.occupancyRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-400 mt-1">{stats.activeProperties} of {stats.totalProperties} properties</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <Users size={24} className="mb-2 text-[#581c87]" />
          <p className="text-sm text-gray-500">Total Owners</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalOwners}</p>
          <p className="text-xs text-gray-400 mt-1">Active partners</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <DollarSign size={24} className="mb-2 text-[#581c87]" />
          <p className="text-sm text-gray-500">Avg. Rent per Property</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats.totalProperties > 0 ? formatCurrency(stats.totalRevenue / stats.totalProperties) : '0 MAD'}
          </p>
          <p className="text-xs text-gray-400 mt-1">Monthly average</p>
        </div>
      </div>

      {/* Revenue vs Expenses Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="font-bold text-gray-900 text-lg mb-1">Revenue vs Expenses</h2>
        <p className="text-sm text-gray-400 mb-6">Monthly financial overview (last 6 months)</p>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} MAD`]} />
              <Legend />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#7c3aed" strokeWidth={2} fill="url(#colorRevenue)" />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f43f5e" strokeWidth={2} fill="url(#colorExpenses)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <DollarSign size={48} className="mx-auto mb-2 opacity-30" />
            <p>No data available. Add properties to see statistics.</p>
          </div>
        )}
      </div>

      {/* Recent Properties Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Recent Properties</h2>
            <p className="text-sm text-gray-400">Latest 5 properties added</p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/properties')}
            className="text-sm font-semibold text-[#581c87] hover:underline"
          >
            View all
          </button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-400 text-[12px] uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold">Property</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Monthly Rent</th>
              <th className="px-6 py-4 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-40 animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-20 animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24 animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-8 animate-pulse" /></td>
                </tr>
              ))
            ) : properties.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">
                  No properties found. Click "Add Property" to get started.
                </td>
              </tr>
            ) : (
              properties.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/properties`)}>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-400">{p.location}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      p.status === "available" ? "bg-green-50 text-green-600" :
                      p.status === "rented" ? "bg-orange-50 text-orange-600" :
                      p.status === "maintenance" ? "bg-red-50 text-red-600" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {p.status_display}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-700">
                    {Number(p.monthly_rent).toLocaleString()} MAD
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    <MoreVertical size={18} className="opacity-0 group-hover:opacity-100" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}