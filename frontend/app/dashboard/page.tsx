"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Home, 
  Users, 
  UserCheck, 
  Target, 
  TrendingUp, 
  TrendingDown,
  MoreVertical,
  Search,
  Eye,
  Edit,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
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
  phone?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalProperties: 0,
    propertiesGrowth: 0,
    totalCustomers: 0,
    customersGrowth: 0,
    totalAgents: 0,
    agentsGrowth: 0,
    goalPercentage: 0,
    totalSales: 0
  });
  const [salesData, setSalesData] = useState<any[]>([]);
  const itemsPerPage = 4;

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
      
      const propertiesRes = await api.get("/api/properties/");
      const propertiesData = Array.isArray(propertiesRes.data) ? propertiesRes.data : propertiesRes.data.results ?? [];
      setProperties(propertiesData);
      
      const ownersRes = await api.get("/api/owners/");
      const ownersData = Array.isArray(ownersRes.data) ? ownersRes.data : ownersRes.data.results ?? [];
      setOwners(ownersData);
      
      calculateStats(propertiesData, ownersData);
      generateSalesData(propertiesData);
      
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (properties: Property[], owners: Owner[]) => {
    // Calculate total monthly revenue
    const totalMonthlyRevenue = properties.reduce((sum, p) => sum + Number(p.monthly_rent), 0);
    
    setStats({
      totalProperties: properties.length,
      propertiesGrowth: 2.01,
      totalCustomers: owners.length,
      customersGrowth: 6.89,
      totalAgents: Math.round(properties.length * 0.25),
      agentsGrowth: 5.89,
      goalPercentage: selectedPeriod === 'week' ? 78 : 65,
      totalSales: totalMonthlyRevenue
    });
  };

  const generateSalesData = (properties: Property[]) => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    const totalMonthlyRevenue = properties.reduce((sum, p) => sum + Number(p.monthly_rent), 0);
    const avgPerDay = totalMonthlyRevenue / 30;
    
    if (selectedPeriod === 'week') {
      const weeklyData = days.map((day, i) => ({
        name: day,
        ventes: Math.round(avgPerDay * (i + 1) * (Math.random() * 0.5 + 0.75)),
      }));
      setSalesData(weeklyData);
    } else {
      const monthlyData = months.map((month, i) => ({
        name: month,
        ventes: Math.round(totalMonthlyRevenue * (i + 1) / 12 * (Math.random() * 0.3 + 0.85)),
      }));
      setSalesData(monthlyData);
    }
  };

  useEffect(() => {
    if (properties.length > 0) {
      generateSalesData(properties);
      setStats(prev => ({ ...prev, goalPercentage: selectedPeriod === 'week' ? 78 : 65 }));
    }
  }, [selectedPeriod, properties]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'available': return 'text-emerald-600 bg-emerald-50';
      case 'rented': return 'text-blue-600 bg-blue-50';
      case 'maintenance': return 'text-rose-600 bg-rose-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'available': return 'Disponible';
      case 'rented': return 'Loué';
      case 'maintenance': return 'Maintenance';
      default: return status;
    }
  };

  // Filter properties based on search
  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate engagement value (simulated based on rent)
  const getEngagement = (rent: number) => {
    return Math.floor(rent / 100) * 10;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      {/* Header - Exactly like image */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Get a complete overview of your real estate performance in one place.
        </p>
      </div>

      {/* Stats Grid - 4 cards like the image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* No. of Properties Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
              <Home size={18} className="text-purple-600" />
            </div>
            <div className="flex items-center gap-0.5 text-xs font-medium text-emerald-600">
              <ArrowUpRight size={12} />
              {stats.propertiesGrowth}%
            </div>
          </div>
          <p className="text-xs text-gray-500">No. of Properties</p>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalProperties)}</p>
          <p className="text-xs text-gray-400 mt-1">vs last week</p>
        </div>

        {/* Total Customers Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users size={18} className="text-blue-600" />
            </div>
            <div className="flex items-center gap-0.5 text-xs font-medium text-emerald-600">
              <ArrowUpRight size={12} />
              {stats.customersGrowth}%
            </div>
          </div>
          <p className="text-xs text-gray-500">Total Customers</p>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalCustomers)}</p>
          <p className="text-xs text-gray-400 mt-1">vs last week</p>
        </div>

        {/* Total Agents Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
              <UserCheck size={18} className="text-emerald-600" />
            </div>
            <div className="flex items-center gap-0.5 text-xs font-medium text-emerald-600">
              <ArrowUpRight size={12} />
              {stats.agentsGrowth}%
            </div>
          </div>
          <p className="text-xs text-gray-500">Total Agents</p>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalAgents)}</p>
          <p className="text-xs text-gray-400 mt-1">vs last week</p>
        </div>

        {/* Goals Card */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
              <Target size={18} className="text-white" />
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setSelectedPeriod('week')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  selectedPeriod === 'week' 
                    ? 'bg-white text-purple-600' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setSelectedPeriod('month')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  selectedPeriod === 'month' 
                    ? 'bg-white text-purple-600' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Month
              </button>
            </div>
          </div>
          <p className="text-xs text-white/80">Goals</p>
          <p className="text-2xl font-bold text-white mt-0.5">{stats.goalPercentage}%</p>
          <div className="mt-2 bg-white/20 rounded-full h-1 overflow-hidden">
            <div 
              className="bg-white rounded-full h-1 transition-all duration-500"
              style={{ width: `${stats.goalPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sales Breakdown Chart - Area Chart like image */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">Sales Breakdown</h2>
            <p className="text-xs text-gray-400">April 2024</p>
          </div>
          <div className="flex gap-2">
            <button className="p-1 hover:bg-gray-100 rounded transition-colors">
              <Filter size={14} className="text-gray-400" />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded transition-colors">
              <Calendar size={14} className="text-gray-400" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} hide />
                  <Tooltip 
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Sales']}
                    contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '11px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="ventes" 
                    name="Sales" 
                    stroke="#7c3aed" 
                    strokeWidth={2} 
                    fill="url(#colorSales)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <TrendingUp size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">No sales data available</p>
              </div>
            )}
          </div>
          
          {/* Right side stats - Total Sales */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Total Sales</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalSales)}</p>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Archived</span>
                <span className="font-semibold text-gray-700">{formatCurrency(stats.totalSales * 0.82)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Goal</span>
                <span className="font-semibold text-gray-700">{formatCurrency(stats.totalSales * 1.2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Property List Table - Exactly like image columns */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Table Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">Active Property List</h2>
              <p className="text-xs text-gray-400 mt-0.5">All active properties in your portfolio</p>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-48"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Engagement</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded w-28" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded w-24" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded w-32" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded w-16" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded w-14" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded w-6" /></td>
                  </tr>
                ))
              ) : paginatedProperties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    <Building2 size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No properties found</p>
                  </td>
                </tr>
              ) : (
                paginatedProperties.map((property, idx) => (
                  <tr key={property.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-xs">{property.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <MapPin size={10} className="text-gray-400" />
                        {property.location}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="text-xs text-gray-700">
                          {owners[idx % owners.length]?.full_name || `Owner ${idx + 1}`}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Phone size={8} />
                          <span>{owners[idx % owners.length]?.phone || '+212 6XX XXX XXX'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Mail size={8} />
                          <span>{owners[idx % owners.length]?.email || `owner${idx + 1}@email.com`}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-700">
                          {getEngagement(Number(property.monthly_rent)).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(property.status)}`}>
                        {getStatusText(property.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 text-xs">
                        {formatCurrency(Number(property.monthly_rent))}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                          <MoreVertical size={14} className="text-gray-400" />
                        </button>
                        <div className="absolute right-0 mt-2 w-28 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <button className="w-full px-2 py-1.5 text-left text-[10px] text-gray-600 hover:bg-gray-50 rounded-t-lg flex items-center gap-1">
                            <Eye size={10} /> View
                          </button>
                          <button className="w-full px-2 py-1.5 text-left text-[10px] text-gray-600 hover:bg-gray-50 flex items-center gap-1">
                            <Edit size={10} /> Edit
                          </button>
                          <button className="w-full px-2 py-1.5 text-left text-[10px] text-red-600 hover:bg-red-50 rounded-b-lg flex items-center gap-1">
                            <Trash2 size={10} /> Delete
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredProperties.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
            <p className="text-[10px] text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredProperties.length)} of {filteredProperties.length} properties
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
              >
                <ChevronLeft size={14} />
              </button>
              {[...Array(Math.min(3, totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                      currentPage === pageNum
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 3 && <span className="px-1 text-[11px] text-gray-400">...</span>}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}