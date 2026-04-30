"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, TrendingUp, Calendar, Users, Star, 
  Wallet, TrendingDown, Home, BarChart3, 
  Percent, DollarSign, Briefcase, Clock, Award,
  AlertCircle, XCircle
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import api from "@/lib/axios";

interface Property {
  id: number;
  name: string;
  location: string;
  property_type_display: string;
  monthly_rent: string;
  area_sqm: string;
  bedrooms: number;
  bathrooms: number;
  status_display: string;
}

interface Booking {
  id: number;
  guest_name: string;
  booking_source: string;
  nights: number;
  price_per_night: number;
  revenue: number;
  commission: number;
  net_profit: number;
  check_in: string;
  check_out: string;
  month: number;
  year: number;
  month_display: string;
}

interface Expense {
  id: number;
  category: string;
  amount: string;
  date: string;
  description: string;
  property_name: string;
}

interface OccupancyData {
  occupancy_rate: number;
  booked_days: number;
  total_days: number;
  total_revenue: number;
  total_stays: number;
  monthly_breakdown: Array<{
    month: number;
    month_name: string;
    year: number;
    booked_days: number;
    total_days: number;
    occupancy_rate: number;
  }>;
}

export default function PropertyPerformancePage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [occupancyData, setOccupancyData] = useState<OccupancyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) router.push("/login");
  }, [router]);

  useEffect(() => {
    if (propertyId) {
      fetchData();
    }
  }, [propertyId, selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get property details
      const propRes = await api.get(`/api/properties/${propertyId}/`);
      setProperty(propRes.data);

      // Get financial records (bookings) for the property
      const finRes = await api.get(`/api/financials/monthly-summary/${propertyId}/?year=${selectedYear}`);
      const finData = finRes.data || [];
      setBookings(finData);

      // Get expenses
      try {
        const expRes = await api.get(`/api/financials/expenses/?property_id=${propertyId}`);
        setExpenses(expRes.data || []);
      } catch (e) {
        console.warn("No expenses data");
        setExpenses([]);
      }

      // Get occupancy data
      try {
        const occRes = await api.get(`/api/financials/property-occupancy/${propertyId}/?year=${selectedYear}`);
        setOccupancyData(occRes.data);
      } catch (e) {
        console.warn("No occupancy data");
        setOccupancyData(null);
      }

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate Performance Metrics
  const calculateMetrics = () => {
    const totalBookings = bookings.length;
    const totalNights = bookings.reduce((sum, b) => sum + (b.nights || 0), 0);
    const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.revenue || 0), 0);
    const totalPayout = bookings.reduce((sum, b) => sum + Number(b.net_profit || 0), 0);
    const totalCommission = bookings.reduce((sum, b) => sum + Number(b.commission || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    
    const avgPricePerNight = totalNights > 0 ? totalRevenue / totalNights : Number(property?.monthly_rent || 0) / 30;
    
    // Occupancy rate from API or calculated
    const occupancyRate = occupancyData?.occupancy_rate || (totalNights / 365) * 100;
    
    const netProfit = totalRevenue - totalCommission - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Platform distribution
    const platformDistribution: { [key: string]: number } = {};
    bookings.forEach(b => {
      const source = b.booking_source || 'Direct';
      platformDistribution[source] = (platformDistribution[source] || 0) + 1;
    });

    return {
      totalBookings,
      totalNights,
      totalRevenue,
      totalPayout,
      totalCommission,
      totalExpenses,
      avgPricePerNight,
      occupancyRate,
      netProfit,
      profitMargin,
      platformDistribution,
    };
  };

  // Monthly breakdown for chart
  const getMonthlyChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map((month, idx) => ({
      month,
      revenue: 0,
      bookings: 0,
      nights: 0,
      avgPrice: 0,
    }));
    
    bookings.forEach(booking => {
      const monthIdx = (booking.month || 1) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        data[monthIdx].revenue += Number(booking.revenue || 0);
        data[monthIdx].bookings += 1;
        data[monthIdx].nights += booking.nights || 0;
      }
    });
    
    data.forEach(d => {
      d.avgPrice = d.nights > 0 ? d.revenue / d.nights : 0;
    });
    
    return data;
  };

  const metrics = calculateMetrics();
  const monthlyChartData = getMonthlyChartData();
  const platformData = Object.entries(metrics.platformDistribution).map(([name, value]) => ({ name, value }));
  
  const COLORS = ['#581c87', '#7c3aed', '#a855f7', '#c084fc', '#e9d5ff'];

  const getRatingText = (rate: number) => {
    if (rate >= 70) return { text: "Excellent", color: "text-green-600", bgColor: "bg-green-50", icon: Award };
    if (rate >= 50) return { text: "Good", color: "text-blue-600", bgColor: "bg-blue-50", icon: TrendingUp };
    if (rate >= 30) return { text: "Average", color: "text-yellow-600", bgColor: "bg-yellow-50", icon: AlertCircle };
    return { text: "Needs Improvement", color: "text-red-500", bgColor: "bg-red-50", icon: XCircle };
  };

  const rating = getRatingText(metrics.occupancyRate);
  const RatingIcon = rating.icon;

  if (loading) {
    return (
      <div className="p-8 bg-[#f9fafb] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#581c87] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-8 bg-[#f9fafb] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Home size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Property not found</p>
          <button
            onClick={() => router.push("/owner/properties")}
            className="mt-4 text-[#581c87] hover:underline"
          >
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#f9fafb] min-h-screen">
      
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} /> Back to Properties
        </button>
        
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{property.location} • {property.property_type_display}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-400">{property.bedrooms} beds • {property.bathrooms} baths</span>
              {property.area_sqm && (
                <span className="text-xs text-gray-400">• {property.area_sqm} m²</span>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium bg-white"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* Performance Score Card */}
      <div className="mb-8 bg-gradient-to-r from-[#581c87] to-[#7c3aed] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 ${rating.bgColor} rounded-2xl flex items-center justify-center`}>
              <RatingIcon size={32} className={rating.color} />
            </div>
            <div>
              <p className="text-purple-200 text-sm">Performance Rating</p>
              <p className={`text-2xl font-bold ${rating.color}`}>
                {rating.text}
              </p>
              <p className="text-purple-200 text-sm mt-1">Based on {metrics.occupancyRate.toFixed(0)}% occupancy</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-purple-200 text-sm">Net Profit ({selectedYear})</p>
            <p className="text-3xl font-bold">{Math.round(metrics.netProfit).toLocaleString()} MAD</p>
            <p className="text-purple-200 text-sm mt-1">{metrics.profitMargin.toFixed(1)}% profit margin</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Calendar size={20} className="text-[#581c87]" />
            </div>
            <span className="text-xs text-gray-400">Total Bookings</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics.totalBookings}</p>
          <p className="text-xs text-gray-500 mt-1">{metrics.totalNights} nights booked</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <span className="text-xs text-gray-400">Avg Price / Night</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{Math.round(metrics.avgPricePerNight).toLocaleString()} MAD</p>
          <p className="text-xs text-gray-500 mt-1">Across {metrics.totalBookings} stays</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Percent size={20} className="text-blue-600" />
            </div>
            <span className="text-xs text-gray-400">Occupancy Rate</span>
          </div>
          <p className={`text-2xl font-bold ${
            metrics.occupancyRate >= 50 ? 'text-green-600' : 
            metrics.occupancyRate >= 30 ? 'text-yellow-600' : 'text-red-500'
          }`}>
            {metrics.occupancyRate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">of {selectedYear}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Wallet size={20} className="text-orange-600" />
            </div>
            <span className="text-xs text-gray-400">Net Profit</span>
          </div>
          <p className="text-2xl font-bold text-[#581c87]">{Math.round(metrics.netProfit).toLocaleString()} MAD</p>
          <p className="text-xs text-gray-500 mt-1">
            Revenue: {Math.round(metrics.totalRevenue).toLocaleString()} MAD
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-900">Monthly Revenue</h2>
            <TrendingUp size={18} className="text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} MAD`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#581c87" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-900">Booking Sources</h2>
            <Briefcase size={18} className="text-gray-400" />
          </div>
          {platformData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {platformData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Briefcase size={48} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No booking data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Recent Bookings</h2>
          <p className="text-sm text-gray-400 mt-1">Latest guest stays</p>
        </div>
        <div className="divide-y divide-gray-100">
          {bookings.slice(0, 10).map((booking) => (
            <div key={booking.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{booking.guest_name || 'Guest'}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full">{booking.booking_source || 'Direct'}</span>
                    <span>•</span>
                    <span>{booking.nights || 1} nights</span>
                    <span>•</span>
                    <span>{booking.price_per_night} MAD/night</span>
                  </div>
                  {booking.check_in && (
                    <p className="text-xs text-gray-400 mt-1">
                      {booking.check_in} → {booking.check_out}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#581c87]">{Number(booking.revenue).toLocaleString()} MAD</p>
                  <p className="text-xs text-gray-400 mt-1">{booking.month_display} {booking.year}</p>
                </div>
              </div>
            </div>
          ))}
          {bookings.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <Calendar size={48} className="mx-auto mb-3 opacity-30" />
              <p>No bookings recorded for {selectedYear}</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <BarChart3 size={18} className="text-[#581c87]" />
          Performance Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white/50 rounded-xl p-3">
            <p className="font-medium text-gray-800 mb-1">📊 Occupancy Analysis</p>
            <p className="text-gray-600 text-xs">
              {metrics.occupancyRate >= 60 
                ? "✓ Excellent occupancy! Your property is in high demand. Consider raising prices during peak seasons."
                : metrics.occupancyRate >= 40
                ? "ℹ️ Good occupancy rate. Optimize your listing photos and description to attract more bookings."
                : "⚠️ Low occupancy detected. Review your pricing strategy, improve listing quality, or adjust availability."}
            </p>
          </div>
          <div className="bg-white/50 rounded-xl p-3">
            <p className="font-medium text-gray-800 mb-1">💰 Pricing Strategy</p>
            <p className="text-gray-600 text-xs">
              Average {Math.round(metrics.avgPricePerNight).toLocaleString()} MAD/night
              {metrics.avgPricePerNight > 600 
                ? " - Premium positioning. Your property appeals to luxury travelers. Keep up the quality!"
                : metrics.avgPricePerNight > 350
                ? " - Competitive pricing. Consider adding amenities to justify rate increases."
                : " - Below market rate. You might be undervaluing your property."}
            </p>
          </div>
          <div className="bg-white/50 rounded-xl p-3">
            <p className="font-medium text-gray-800 mb-1">🎯 Revenue Opportunity</p>
            <p className="text-gray-600 text-xs">
              {Math.round((365 - metrics.totalNights) * metrics.avgPricePerNight * 0.85).toLocaleString()} MAD 
              potential from unbooked nights
              {metrics.occupancyRate < 50 && " - Focus on improving visibility and ratings."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}