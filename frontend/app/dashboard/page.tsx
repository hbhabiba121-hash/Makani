"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, TrendingUp, TrendingDown, MoreVertical } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import api from "@/lib/axios";

interface Property {
  id: number;
  name: string;
  location: string;
  monthly_rent: string;
  status: string;
  status_display: string;
}

const chartData = [
  { month: "Jan", revenue: 45000, expenses: 28000 },
  { month: "Feb", revenue: 52000, expenses: 30000 },
  { month: "Mar", revenue: 49000, expenses: 27000 },
  { month: "Apr", revenue: 63000, expenses: 35000 },
  { month: "May", revenue: 58000, expenses: 32000 },
  { month: "Jun", revenue: 71000, expenses: 38000 },
  { month: "Jul", revenue: 75000, expenses: 40000 },
  { month: "Aug", revenue: 80000, expenses: 42000 },
];

export default function DashboardPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access');
    if (!token) {
      router.push('/login');
    }
  }, []);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await api.get("/api/properties/");
        const data = Array.isArray(res.data) ? res.data : res.data.results ?? [];
        setProperties(data.slice(0, 5));
      } catch (err) {
        console.error("Error fetching properties:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const stats = [
    { title: "Total Revenue", value: "124,589 MAD", change: "+12.5%", positive: true, icon: <DollarSign size={20} />, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Total Expenses", value: "45,230 MAD", change: "+8.2%", positive: true, icon: <TrendingUp size={20} />, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Net Profit", value: "79,359 MAD", change: "+18.3%", positive: true, icon: <TrendingUp size={20} />, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Owner Payouts", value: "52,840 MAD", change: "-3.1%", positive: false, icon: <TrendingDown size={20} />, color: "text-blue-600", bg: "bg-blue-50" },
  ];

  return (
    <div className="p-8 bg-[#f9fafb] min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Overview of your property management business</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>{stat.icon}</div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.positive ? "text-green-600 bg-green-50" : "text-red-500 bg-red-50"}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-xs text-gray-400 mt-1">vs last month</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="font-bold text-gray-900 text-lg mb-1">Revenue vs Expenses</h2>
        <p className="text-sm text-gray-400 mb-6">Monthly financial overview</p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
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
            <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} MAD`]} />
            <Legend />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#7c3aed" strokeWidth={2} fill="url(#colorRevenue)" />
            <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f43f5e" strokeWidth={2} fill="url(#colorExpenses)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-gray-900 text-lg">Recent Properties</h2>
          <button className="text-sm font-semibold text-[#581c87]">View all</button>
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
                  <td />
                </tr>
              ))
            ) : properties.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">
                  No properties found
                </td>
              </tr>
            ) : (
              properties.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-400">{p.location}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      p.status === "available" ? "bg-green-50 text-green-600" :
                      p.status === "rented" ? "bg-orange-50 text-orange-600" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {p.status_display}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-700">
                    {Number(p.monthly_rent).toLocaleString()} MAD
                  </td>
                  <td className="px-6 py-4 text-gray-400"><MoreVertical size={18} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}