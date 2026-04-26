"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { MapPin, Bed, Bath, ArrowLeft, Home, DollarSign, TrendingDown, Wallet } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "@/lib/axios";

interface Property {
  id: number;
  name: string;
  location: string;
  property_type: string;
  property_type_display: string;
  status: string;
  status_display: string;
  bedrooms: number;
  bathrooms: number;
  monthly_rent: string;
  description?: string;
  area_sqm?: string;
}

interface Financial {
  month: number;
  month_display: string;
  year: number;
  revenue: string;
  expenses: string;
  commission: string;
  owner_payout: string;
}

export default function OwnerPropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [financials, setFinancials] = useState<Financial[]>([]);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) router.push("/login");
  }, []);

  useEffect(() => {
    if (params.id) fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const propRes = await api.get(`/api/properties/${params.id}/`);
      setProperty(propRes.data);

      try {
        const finRes = await api.get(`/financials/summary/${params.id}/?year=${currentYear}`);
        const finData = Array.isArray(finRes.data) ? finRes.data : [];
        setFinancials(finData);
      } catch {
        setFinancials([]);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const placeholderColor = (type: string) => {
    switch (type) {
      case "villa": return "bg-purple-100";
      case "apartment": return "bg-blue-100";
      case "studio": return "bg-green-100";
      default: return "bg-purple-50";
    }
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500";
      case "rented": return "bg-orange-500";
      case "maintenance": return "bg-red-500";
      default: return "bg-gray-400";
    }
  };

  const chartData = financials.map(f => ({
    month: f.month_display.slice(0, 3),
    revenue: Number(f.revenue),
    payout: Number(f.owner_payout),
  }));

  if (loading) {
    return (
      <div className="p-8 bg-[#f9fafb] min-h-screen animate-pulse space-y-4">
        <div className="h-48 bg-gray-100 rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!property) return null;

  const monthlyRevenue = Number(property.monthly_rent);
  const totalPayout = financials.reduce((sum, f) => sum + Number(f.owner_payout), 0);
  const totalRevenue = financials.reduce((sum, f) => sum + Number(f.revenue), 0);
  const totalCommission = financials.reduce((sum, f) => sum + Number(f.commission), 0);
  const hasFinancials = financials.length > 0;

  return (
    <div className="p-8 bg-[#f9fafb] min-h-screen">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors text-sm font-medium"
      >
        <ArrowLeft size={16} /> Back to Properties
      </button>

      {/* Hero */}
      <div className={`h-52 ${placeholderColor(property.property_type)} rounded-2xl flex items-center justify-center relative mb-6 overflow-hidden`}>
        <Home size={56} className="text-purple-200" />
        <span className={`absolute top-4 right-4 text-white text-xs font-bold px-3 py-1.5 rounded-full ${statusStyle(property.status)}`}>
          {property.status_display}
        </span>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-6">
          <h1 className="text-2xl font-bold text-white">{property.name}</h1>
          <div className="flex items-center gap-1 text-white/80 mt-1">
            <MapPin size={13} />
            <span className="text-sm">{property.location}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">Monthly Rent</p>
              <p className="text-xl font-bold text-gray-900">{monthlyRevenue.toLocaleString()} MAD</p>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg">
              <DollarSign size={18} className="text-[#581c87]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">Agency Commission</p>
              <p className="text-xl font-bold text-red-500">
                {hasFinancials
                  ? `-${totalCommission.toLocaleString()} MAD`
                  : `-${Math.round(monthlyRevenue * 0.15).toLocaleString()} MAD`}
              </p>
              <p className="text-xs text-gray-400 mt-1">15% of revenue</p>
            </div>
            <div className="p-2 bg-red-50 rounded-lg">
              <TrendingDown size={18} className="text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">Your Net Payout</p>
              <p className="text-xl font-bold text-[#581c87]">
                {hasFinancials
                  ? `${totalPayout.toLocaleString()} MAD`
                  : `${Math.round(monthlyRevenue * 0.85).toLocaleString()} MAD`}
              </p>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg">
              <Wallet size={18} className="text-[#581c87]" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left */}
        <div className="lg:col-span-2 space-y-6">

          {/* Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-1">Revenue & Payout Trend</h2>
            <p className="text-sm text-gray-400 mb-4">Monthly performance — {currentYear}</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData.length > 0 ? chartData : [
                { month: "Jan", revenue: monthlyRevenue, payout: Math.round(monthlyRevenue * 0.85) },
                { month: "Feb", revenue: monthlyRevenue, payout: Math.round(monthlyRevenue * 0.85) },
                { month: "Mar", revenue: monthlyRevenue, payout: Math.round(monthlyRevenue * 0.85) },
                { month: "Apr", revenue: monthlyRevenue, payout: Math.round(monthlyRevenue * 0.85) },
              ]}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} MAD`]} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#7c3aed" strokeWidth={2} fill="url(#revGrad)" />
                <Area type="monotone" dataKey="payout" name="Net Payout" stroke="#10b981" strokeWidth={2} fill="url(#payGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Property Details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">Property Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Bed size={16} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Bedrooms</p>
                  <p className="font-semibold text-gray-900">{property.bedrooms}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Bath size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Bathrooms</p>
                  <p className="font-semibold text-gray-900">{property.bathrooms}</p>
                </div>
              </div>
              {property.area_sqm && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 bg-pink-100 rounded-lg flex items-center justify-center">
                    <Home size={16} className="text-pink-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Area</p>
                    <p className="font-semibold text-gray-900">{property.area_sqm} m²</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                  <Home size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Type</p>
                  <p className="font-semibold text-gray-900">{property.property_type_display}</p>
                </div>
              </div>
            </div>
            {property.description && (
              <div className="mt-4 pt-4 border-t border-gray-50">
                <p className="text-sm text-gray-500 leading-relaxed">{property.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">Financial Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Gross Revenue</span>
                <span className="font-semibold text-gray-900">
                  {hasFinancials ? `${totalRevenue.toLocaleString()} MAD` : `${monthlyRevenue.toLocaleString()} MAD`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Agency Commission (15%)</span>
                <span className="font-semibold text-red-500">
                  -{hasFinancials ? totalCommission.toLocaleString() : Math.round(monthlyRevenue * 0.15).toLocaleString()} MAD
                </span>
              </div>
              <div className="pt-3 border-t border-gray-100 flex justify-between">
                <span className="font-bold text-gray-900">Net to Owner</span>
                <span className="font-bold text-[#581c87]">
                  {hasFinancials ? `${totalPayout.toLocaleString()} MAD` : `${Math.round(monthlyRevenue * 0.85).toLocaleString()} MAD`}
                </span>
              </div>
            </div>
          </div>

          {hasFinancials && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4">Monthly Breakdown</h2>
              <div className="space-y-2">
                {financials.map((f, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-500">{f.month_display} {f.year}</span>
                    <span className="text-sm font-bold text-[#581c87]">{Number(f.owner_payout).toLocaleString()} MAD</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}