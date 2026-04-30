"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, Calendar, Users, DollarSign, Wallet, TrendingDown, 
  Receipt, TrendingUp, Percent, Clock, AlertCircle, CheckCircle,
  RefreshCw, ChevronDown, ChevronUp
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import api from "@/lib/axios";

interface Property {
  id: number;
  name: string;
  location: string;
  property_type_display: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm: string;
  description: string;
  images_urls: string[];
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
  has_receipt: boolean;
  receipt: string | null;
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

export default function OwnerPropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [occupancyData, setOccupancyData] = useState<OccupancyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showExpenseReceipt, setShowExpenseReceipt] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    bookings: true,
    expenses: true,
    financials: true
  });

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
      const propRes = await api.get(`/api/properties/${propertyId}/`);
      setProperty(propRes.data);

      const finRes = await api.get(`/api/financials/monthly-summary/${propertyId}/?year=${selectedYear}`);
      setBookings(finRes.data || []);

      try {
        const expRes = await api.get(`/api/financials/expenses/?property_id=${propertyId}`);
        setExpenses(expRes.data || []);
      } catch (e) {
        setExpenses([]);
      }

      try {
        const occRes = await api.get(`/api/financials/property-occupancy/${propertyId}/?year=${selectedYear}`);
        setOccupancyData(occRes.data);
      } catch (e) {
        setOccupancyData(null);
      }

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.revenue || 0), 0);
  const totalCommission = bookings.reduce((sum, b) => sum + Number(b.commission || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netProfit = totalRevenue - totalCommission - totalExpenses;
  const occupancyRate = occupancyData?.occupancy_rate || 0;
  const totalBookings = bookings.length;
  const totalNights = bookings.reduce((sum, b) => sum + (b.nights || 0), 0);
  const avgStayDuration = totalBookings > 0 ? totalNights / totalBookings : 0;

  const monthlyChartData = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map((month, idx) => ({ month, revenue: 0, commission: 0, netProfit: 0 }));
    
    bookings.forEach(booking => {
      const monthIdx = (booking.month || 1) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        data[monthIdx].revenue += Number(booking.revenue || 0);
        data[monthIdx].commission += Number(booking.commission || 0);
        data[monthIdx].netProfit += Number(booking.net_profit || 0);
      }
    });
    return data;
  })();

  const expensesByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {} as Record<string, number>);
  
  const expenseCategories = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));
  const COLORS = ['#581c87', '#7c3aed', '#a855f7', '#c084fc', '#e9d5ff', '#f3e8ff'];

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <div className="p-8 bg-[#f9fafb] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#581c87] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading property data...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-8 bg-[#f9fafb] min-h-screen flex items-center justify-center">
        <div className="text-center">Property not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="px-8 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-3 transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Back to Properties
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">{property.location}</span>
                <span className="text-gray-300">•</span>
                <span className="text-sm text-gray-500">{property.bedrooms} beds • {property.bathrooms} baths</span>
                {property.area_sqm && <span className="text-sm text-gray-500">• {property.area_sqm} m²</span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium bg-white"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
              <button onClick={fetchData} className="p-2 text-gray-400 hover:text-[#581c87] transition-colors">
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">

        {/* 1. KEY KPIs - Quick Snapshot */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Quick Snapshot</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={16} className="text-[#581c87]" />
                <span className="text-xs text-gray-400">Total Revenue</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{totalRevenue.toLocaleString()} MAD</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={16} className="text-green-600" />
                <span className="text-xs text-gray-400">Your Earnings</span>
              </div>
              <p className="text-xl font-bold text-green-600">{netProfit.toLocaleString()} MAD</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={16} className="text-red-500" />
                <span className="text-xs text-gray-400">Agency Fee</span>
              </div>
              <p className="text-xl font-bold text-red-500">{totalCommission.toLocaleString()} MAD</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Receipt size={16} className="text-orange-500" />
                <span className="text-xs text-gray-400">Total Expenses</span>
              </div>
              <p className="text-xl font-bold text-orange-500">{totalExpenses.toLocaleString()} MAD</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Percent size={16} className="text-blue-500" />
                <span className="text-xs text-gray-400">Occupancy Rate</span>
              </div>
              <p className={`text-xl font-bold ${occupancyRate >= 50 ? 'text-green-600' : occupancyRate >= 30 ? 'text-yellow-600' : 'text-red-500'}`}>
                {occupancyRate.toFixed(1)}%
              </p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-purple-500" />
                <span className="text-xs text-gray-400">Total Nights</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{totalNights}</p>
            </div>
          </div>
        </div>

        {/* 2. PERFORMANCE CHART */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">📈 Revenue vs Expenses vs Net Profit</h2>
              <p className="text-sm text-gray-400 mt-1">Monthly performance trend</p>
            </div>
            {occupancyRate >= 50 ? (
              <div className="flex items-center gap-1 text-green-600 text-sm"><TrendingUp size={16} /> Improving</div>
            ) : occupancyRate >= 30 ? (
              <div className="flex items-center gap-1 text-yellow-600 text-sm"><AlertCircle size={16} /> Stable</div>
            ) : (
              <div className="flex items-center gap-1 text-red-500 text-sm"><TrendingDown size={16} /> Needs attention</div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={320}>
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
              <Area type="monotone" dataKey="netProfit" name="Net Profit" stroke="#10b981" strokeWidth={2} fill="url(#profitGrad)" />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">

            {/* 3. BOOKINGS SECTION */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button 
                onClick={() => toggleSection('bookings')}
                className="w-full p-6 flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">📅 Bookings</h2>
                  <p className="text-sm text-gray-400 mt-1">Guest stays and transactions</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{totalBookings} stays</p>
                    <p className="text-xs text-gray-400">Avg {avgStayDuration.toFixed(1)} nights</p>
                  </div>
                  {expandedSections.bookings ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>
              
              {expandedSections.bookings && (
                <div className="border-t border-gray-100">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Guest</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Source</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Dates</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Nights</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Price/Night</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Revenue</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Commission</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {bookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{booking.guest_name || 'Guest'}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">{booking.booking_source || 'Direct'}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {booking.check_in ? `${booking.check_in} → ${booking.check_out}` : `${booking.month_display} ${booking.year}`}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{booking.nights}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{booking.price_per_night} MAD</td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">{booking.revenue.toLocaleString()} MAD</td>
                            <td className="px-6 py-4 text-sm text-red-500">{booking.commission.toLocaleString()} MAD</td>
                          </tr>
                        ))}
                        {bookings.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                              No bookings for {selectedYear}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* 4. EXPENSES BREAKDOWN */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button 
                onClick={() => toggleSection('expenses')}
                className="w-full p-6 flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">💸 Expenses Breakdown</h2>
                  <p className="text-sm text-gray-400 mt-1">Property maintenance and operational costs</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-500">{totalExpenses.toLocaleString()} MAD total</p>
                    <p className="text-xs text-gray-400">
                      Top: {Object.entries(expensesByCategory).sort((a,b) => b[1] - a[1])[0]?.[0] || 'None'}
                    </p>
                  </div>
                  {expandedSections.expenses ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>
              
              {expandedSections.expenses && (
                <div className="border-t border-gray-100 p-6">
                  {expenses.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-1">
                        <h3 className="font-semibold text-gray-700 mb-3">By Category</h3>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={expenseCategories}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={70}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {expenseCategories.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${Number(value).toLocaleString()} MAD`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="lg:col-span-2">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Category</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Description</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Amount</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Receipt</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {expenses.map((expense) => (
                              <tr key={expense.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-700">{expense.category}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{expense.description || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{expense.date}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-red-500">{Number(expense.amount).toLocaleString()} MAD</td>
                                <td className="px-4 py-3">
                                  {expense.has_receipt ? (
                                    <button 
                                      onClick={() => setShowExpenseReceipt(showExpenseReceipt === expense.id ? null : expense.id)}
                                      className="text-[#581c87] text-xs hover:underline"
                                    >
                                      {showExpenseReceipt === expense.id ? 'Hide' : 'View'}
                                    </button>
                                  ) : (
                                    <span className="text-xs text-gray-400">No receipt</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 py-8">No expenses recorded for {selectedYear}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            
            {/* 5. FINANCIAL BREAKDOWN */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-24">
              <button 
                onClick={() => toggleSection('financials')}
                className="w-full p-6 flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">💰 Financial Breakdown</h2>
                  <p className="text-sm text-gray-400 mt-1">How your revenue is distributed</p>
                </div>
                {expandedSections.financials ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              {expandedSections.financials && (
                <div className="border-t border-gray-100 p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[#581c87] rounded-full"></div>
                        <span className="text-gray-700">Total Revenue</span>
                      </div>
                      <span className="font-semibold text-gray-900">{totalRevenue.toLocaleString()} MAD</span>
                    </div>
                    
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100 pl-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-gray-600">− Agency Commission ({totalRevenue > 0 ? ((totalCommission/totalRevenue)*100).toFixed(0) : 15}%)</span>
                      </div>
                      <span className="text-red-500">-{totalCommission.toLocaleString()} MAD</span>
                    </div>
                    
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100 pl-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-gray-600">− Expenses</span>
                      </div>
                      <span className="text-orange-500">-{totalExpenses.toLocaleString()} MAD</span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-bold text-gray-900">= Your Earnings (Net Profit)</span>
                      </div>
                      <span className="text-xl font-bold text-green-600">{netProfit.toLocaleString()} MAD</span>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t-2 border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Profit Margin</span>
                        <span className="text-sm font-semibold text-green-600">
                          {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all" 
                          style={{ width: `${totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Property Details Quick View */}
            {property.description && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">📝 About this property</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{property.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}