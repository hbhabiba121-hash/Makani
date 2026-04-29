// frontend/app/dashboard/revenue/page.tsx - FIXED TOP PLATFORM & OTHER SOURCE

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Award, 
  Search, 
  Filter, 
  Download,
  ArrowUpRight,
  Building2,
  User,
  Clock,
  CreditCard,
  Loader2,
  Plus,
  X,
  Save,
  Bed,
  Bath,
  Users,
  ChevronDown,
  Check,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { financialService, RevenueRecord, RevenueStats, Property } from '@/lib/financialService';

const defaultBookingSources = ['Airbnb', 'Booking.com', 'Vrbo', 'Direct', 'Expedia', 'Other'];

export default function RevenuePage() {
  const [revenueRecords, setRevenueRecords] = useState<RevenueRecord[]>([]);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSource, setSelectedSource] = useState("all");
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewingRecord, setViewingRecord] = useState<RevenueRecord | null>(null);
  
  // Custom booking source
  const [customBookingSource, setCustomBookingSource] = useState('');
  const [showCustomSourceInput, setShowCustomSourceInput] = useState(false);
  
  // Form state with commission
  const [formData, setFormData] = useState({
    amount: '',
    nights: '1',
    bookingSource: 'Airbnb',
    guestName: '',
    checkInDate: '',
    checkOutDate: '',
    status: 'paid',
    commissionRate: '20'
  });

  // Calculate check-out date based on check-in date + nights
  const calculateCheckOut = useCallback((checkInDate: string, nights: number) => {
    if (!checkInDate || !nights || nights <= 0) {
      return '';
    }
    const checkIn = new Date(checkInDate);
    if (isNaN(checkIn.getTime())) {
      return '';
    }
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + nights);
    return checkOut.toISOString().split('T')[0];
  }, []);

  // Handle check-in date change - auto calculate check-out
  const handleCheckInChange = (checkInDate: string) => {
    const nightsNum = parseInt(formData.nights) || 0;
    const checkOutDate = calculateCheckOut(checkInDate, nightsNum);
    setFormData(prev => ({
      ...prev,
      checkInDate,
      checkOutDate
    }));
  };

  // Handle nights change - auto calculate check-out
  const handleNightsChange = (nights: string) => {
    const nightsNum = parseInt(nights) || 0;
    const checkOutDate = calculateCheckOut(formData.checkInDate, nightsNum);
    setFormData(prev => ({
      ...prev,
      nights,
      checkOutDate
    }));
  };

  // Handle booking source change
  const handleBookingSourceChange = (source: string) => {
    setFormData(prev => ({ ...prev, bookingSource: source }));
    if (source === 'Other') {
      setShowCustomSourceInput(true);
    } else {
      setShowCustomSourceInput(false);
      setCustomBookingSource('');
    }
  };

  // Calculations
  const estimatedTotal = parseFloat(formData.amount) * parseInt(formData.nights) || 0;
  const estimatedCommission = estimatedTotal * (parseFloat(formData.commissionRate) / 100);
  const estimatedNetProfit = estimatedTotal - estimatedCommission;

  // Calculate REAL Top Platform from actual booking data
  const getRealTopPlatform = () => {
    if (revenueRecords.length === 0) return 'N/A';
    
    const platformCount: { [key: string]: number } = {};
    revenueRecords.forEach(record => {
      const platform = record.source;
      platformCount[platform] = (platformCount[platform] || 0) + 1;
    });
    
    let topPlatform = '';
    let maxCount = 0;
    for (const [platform, count] of Object.entries(platformCount)) {
      if (count > maxCount) {
        maxCount = count;
        topPlatform = platform;
      }
    }
    return topPlatform;
  };

  // Calculate Agency Revenue (Total Commission from all bookings)
  const totalAgencyRevenue = revenueRecords.reduce((sum, record) => sum + (record.commission || 0), 0);
  const averageCommissionRate = revenueRecords.length > 0 
    ? revenueRecords.reduce((sum, record) => sum + (record.commission_rate || 20), 0) / revenueRecords.length
    : 20;

  // Get top platform for display
  const topPlatform = getRealTopPlatform();

  // Fetch functions
  const fetchRevenueData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, recordsData] = await Promise.all([
        financialService.getRevenueStats(),
        financialService.getRevenueRecords()
      ]);
      setStats(statsData);
      setRevenueRecords(recordsData);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProperties = useCallback(async () => {
    try {
      const propertiesData = await financialService.getProperties();
      console.log('Fetched properties:', propertiesData);
      setProperties(propertiesData);
      if (propertiesData.length > 0) {
        setSelectedProperty(propertiesData[0]);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  }, []);

  useEffect(() => {
    fetchRevenueData();
    fetchProperties();
  }, [fetchRevenueData, fetchProperties]);

  // Reset form
  const resetForm = () => {
    setFormData({
      amount: '',
      nights: '1',
      bookingSource: 'Airbnb',
      guestName: '',
      checkInDate: '',
      checkOutDate: '',
      status: 'paid',
      commissionRate: '20'
    });
    setCustomBookingSource('');
    setShowCustomSourceInput(false);
    setEditingId(null);
  };

  // Handle Add/Update Revenue
  const handleAddRevenue = async () => {
    if (!selectedProperty || !formData.amount || !formData.guestName || !formData.checkInDate) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const totalRevenue = parseFloat(formData.amount) * parseInt(formData.nights);
      
      // Determine final booking source (custom if "Other" was selected)
      let finalBookingSource = formData.bookingSource;
      if (formData.bookingSource === 'Other' && customBookingSource.trim()) {
        finalBookingSource = customBookingSource.trim();
      }
      
      const recordData = {
        property_id: selectedProperty.id,
        month: new Date(formData.checkInDate).getMonth() + 1,
        year: new Date(formData.checkInDate).getFullYear(),
        price_per_night: parseFloat(formData.amount),
        nights: parseInt(formData.nights),
        revenue: totalRevenue,
        expenses: 0,
        commission_rate: parseFloat(formData.commissionRate),
        guest_name: formData.guestName,
        booking_source: finalBookingSource,
        check_in: formData.checkInDate,
        check_out: formData.checkOutDate,
      };

      if (editingId) {
        await financialService.updateFinancialRecord(editingId, recordData);
      } else {
        await financialService.createFinancialRecord(recordData);
      }
      
      setShowAddModal(false);
      resetForm();
      fetchRevenueData();
    } catch (error) {
      console.error('Error adding revenue:', error);
      alert('Failed to save revenue record');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle View Record
  const handleViewRecord = (record: RevenueRecord) => {
    setViewingRecord(record);
    setShowViewModal(true);
  };

  // Handle Edit - Load existing data into form
  const handleEditRecord = (record: RevenueRecord) => {
    const pricePerNight = record.price_per_night || (record.amount / record.nights);
    const checkInDate = record.check_in || '';
    const checkOutDate = record.check_out || '';
    const bookingSource = record.booking_source || record.source || 'Airbnb';
    const guestName = record.guest_name || record.guest || '';
    const commissionRate = record.commission_rate?.toString() || '20';
    
    // Check if it's a custom source (not in default list)
    const isCustomSource = !defaultBookingSources.includes(bookingSource);
    
    setFormData({
      amount: String(pricePerNight),
      nights: String(record.nights),
      bookingSource: isCustomSource ? 'Other' : bookingSource,
      guestName: guestName,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      status: record.status || 'paid',
      commissionRate: commissionRate
    });
    
    if (isCustomSource) {
      setShowCustomSourceInput(true);
      setCustomBookingSource(bookingSource);
    } else {
      setShowCustomSourceInput(false);
      setCustomBookingSource('');
    }
    
    const property = properties.find(p => p.id === record.property_id);
    if (property) {
      setSelectedProperty(property);
    }
    
    setEditingId(record.id);
    setShowAddModal(true);
  };

  // Handle Delete
  const handleDeleteRecord = async (recordId: number) => {
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        await financialService.deleteFinancialRecord(recordId);
        fetchRevenueData();
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('Failed to delete record');
      }
    }
  };

  // Get unique booking sources for filter (including custom ones)
  const getUniqueSources = () => {
    const sources = new Set<string>();
    sources.add("all");
    revenueRecords.forEach(record => {
      sources.add(record.source);
    });
    return Array.from(sources);
  };

  const filteredRecords = revenueRecords.filter(record => {
    const matchesSearch = record.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.guest.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = selectedSource === "all" || record.source === selectedSource;
    return matchesSearch && matchesSource;
  });

  if (loading) {
    return (
      <div className="p-8 bg-[#f9fafb] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-[#581c87] mx-auto mb-4" size={48} />
          <p className="text-gray-500">Loading revenue data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-[#f9fafb] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue Management</h1>
          <p className="text-gray-500 text-sm mt-1">Track agency commission and booking revenue</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-[#581c87] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#4c1d95] transition-all shadow-lg shadow-[#581c87]/20 text-sm"
        >
          <Plus size={18} />
          Add Revenue
        </button>
      </div>

      {/* Stats Cards - AGENCY REVENUE is primary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* AGENCY REVENUE (Commission) - MOST IMPORTANT */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-[#581c87] to-[#4c1d95] rounded-2xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <DollarSign className="text-white" size={20} />
            </div>
            <div className="flex items-center gap-1 text-sm text-white/80">
              <ArrowUpRight size={14} />
              <span>Agency Revenue</span>
            </div>
          </div>
          <p className="text-xs text-white/70 font-medium">💥 AGENCY REVENUE (Commission)</p>
          <h3 className="text-2xl font-bold mt-1">{totalAgencyRevenue.toLocaleString()} DH</h3>
          <p className="text-xs text-white/50 mt-1">Average commission: {Math.round(averageCommissionRate)}%</p>
        </motion.div>

        {/* Total Bookings Revenue (what guests paid) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
            <CreditCard className="text-blue-600" size={20} />
          </div>
          <p className="text-xs text-gray-500 font-medium">Total Bookings Revenue</p>
          <h3 className="text-xl font-bold text-gray-900 mt-1">{stats?.totalRevenue?.toLocaleString() || '0'} DH</h3>
          <p className="text-xs text-gray-400 mt-1">What guests paid (before commission)</p>
        </motion.div>

        {/* Total Bookings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3">
            <Calendar className="text-green-600" size={20} />
          </div>
          <p className="text-xs text-gray-500 font-medium">Total Bookings</p>
          <h3 className="text-xl font-bold text-gray-900 mt-1">{stats?.totalBookings || 0}</h3>
          <p className="text-xs text-gray-400 mt-1">Completed stays</p>
        </motion.div>

        {/* Top Platform - REAL DATA from bookings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-3">
            <Award className="text-orange-600" size={20} />
          </div>
          <p className="text-xs text-gray-500 font-medium">Top Platform</p>
          <h3 className="text-xl font-bold text-gray-900 mt-1">{topPlatform}</h3>
          <p className="text-xs text-gray-400 mt-1">
            {revenueRecords.filter(r => r.source === topPlatform).length} bookings from this platform
          </p>
        </motion.div>
      </div>

      {/* Revenue Records Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-bold text-gray-900">All Revenue Records</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#581c87]/20 focus:border-[#581c87] w-full sm:w-48" 
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                <select 
                  value={selectedSource} 
                  onChange={(e) => setSelectedSource(e.target.value)} 
                  className="pl-8 pr-6 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#581c87]/20 focus:border-[#581c87] appearance-none bg-white cursor-pointer"
                >
                  {getUniqueSources().map(source => (
                    <option key={source} value={source}>
                      {source === "all" ? "All Platforms" : source}
                    </option>
                  ))}
                </select>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all">
                <Download size={14} />
                Export
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-3 py-3">Property</th>
                <th className="px-3 py-3">Guest</th>
                <th className="px-3 py-3">Source</th>
                <th className="px-3 py-3">Dates</th>
                <th className="px-3 py-3 text-right">Booking Value</th>
                <th className="px-3 py-3 text-right">Commission</th>
                <th className="px-3 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRecords.length > 0 ? filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-gray-900 text-sm truncate max-w-[120px]" title={record.property}>
                        {record.property}
                      </span>
                    </div>
                   </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 text-sm truncate max-w-[100px]" title={record.guest}>
                        {record.guest}
                      </span>
                    </div>
                   </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                      record.source === "Airbnb" ? "bg-red-50 text-red-600" : 
                      record.source === "Booking.com" ? "bg-blue-50 text-blue-600" : 
                      record.source === "Vrbo" ? "bg-purple-50 text-purple-600" :
                      record.source === "Direct" ? "bg-green-50 text-green-600" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {record.source}
                    </span>
                   </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-600 whitespace-nowrap">
                        {record.check_in || record.date}
                      </span>
                      <span className="text-xs text-gray-400">
                        → {record.check_out || '-'} ({record.nights} nights)
                      </span>
                    </div>
                   </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-gray-700 text-sm font-medium whitespace-nowrap">
                      {record.amount.toLocaleString()} DH
                    </span>
                   </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-[#581c87] text-sm whitespace-nowrap">
                        {record.commission.toLocaleString()} DH
                      </span>
                      <span className="text-xs text-gray-400">
                        ({record.commission_rate || 20}%)
                      </span>
                    </div>
                   </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        onClick={() => handleViewRecord(record)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        onClick={() => handleEditRecord(record)}
                        className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteRecord(record.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                   </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-gray-400 text-sm">
                    No revenue records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* View Details Modal */}
      {showViewModal && viewingRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
                <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500">Property</span>
                <span className="font-semibold text-gray-900">{viewingRecord.property}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500">Guest</span>
                <span className="font-semibold text-gray-900">{viewingRecord.guest}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500">Booking Source</span>
                <span className="font-semibold text-gray-900">{viewingRecord.source}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500">Check-in / Check-out</span>
                <span className="font-semibold text-gray-900">
                  {viewingRecord.check_in || viewingRecord.date} → {viewingRecord.check_out || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500">Nights</span>
                <span className="font-semibold text-gray-900">{viewingRecord.nights}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500">Price per Night</span>
                <span className="font-semibold text-gray-900">
                  {Math.round(viewingRecord.amount / viewingRecord.nights).toLocaleString()} DH
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500">Booking Total</span>
                <span className="font-bold text-gray-900">{viewingRecord.amount.toLocaleString()} DH</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500">Commission Rate</span>
                <span className="font-semibold text-gray-900">{viewingRecord.commission_rate || 20}%</span>
              </div>
              <div className="flex justify-between items-center bg-purple-50 p-3 rounded-xl">
                <span className="font-bold text-[#581c87]">💥 Agency Revenue (Commission)</span>
                <span className="font-bold text-xl text-[#581c87]">{viewingRecord.commission.toLocaleString()} DH</span>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100">
              <button onClick={() => setShowViewModal(false)} className="w-full py-3 rounded-xl bg-[#581c87] text-white font-semibold hover:bg-[#4c1d95] transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Revenue Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Revenue Record' : 'Add Revenue Record'}</h2>
                <p className="text-sm text-gray-500 mt-1">{editingId ? 'Update booking or revenue transaction' : 'Record a new booking or revenue transaction'}</p>
              </div>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {/* Property Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Property</label>
                <div className="relative">
                  <button
                    onClick={() => setShowPropertyDropdown(!showPropertyDropdown)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between hover:border-purple-300 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Building2 className="text-purple-600" size={24} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">{selectedProperty?.name || 'Select property'}</p>
                        <p className="text-sm text-gray-500">{selectedProperty?.location || 'Choose a property'}</p>
                      </div>
                    </div>
                    <ChevronDown className={`text-gray-400 transition-transform ${showPropertyDropdown ? 'rotate-180' : ''}`} size={20} />
                  </button>

                  {showPropertyDropdown && properties.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg z-10 max-h-64 overflow-y-auto">
                      {properties.map(property => (
                        <button
                          key={property.id}
                          onClick={() => {
                            setSelectedProperty(property);
                            setShowPropertyDropdown(false);
                          }}
                          className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Building2 size={18} className="text-gray-600" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-gray-900">{property.name}</p>
                            <p className="text-xs text-gray-500">{property.location}</p>
                          </div>
                          {selectedProperty?.id === property.id && <Check size={18} className="text-green-500" />}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {properties.length === 0 && (
                    <div className="text-center p-4 bg-yellow-50 rounded-xl mt-2">
                      <p className="text-sm text-yellow-800">No properties found. Please create a property first.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Price per night and Nights */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price per night (DH) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={formData.amount} 
                    onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                    placeholder="350" 
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#581c87]/20 focus:border-[#581c87]" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Number of Nights <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    value={formData.nights} 
                    onChange={(e) => handleNightsChange(e.target.value)} 
                    placeholder="1" 
                    min="1"
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#581c87]/20 focus:border-[#581c87]" 
                  />
                </div>
              </div>

              {/* Estimated Total & Commission Preview */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-purple-50 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-purple-700 font-medium">Booking Total</span>
                    <span className="text-xl font-bold text-purple-900">
                      {estimatedTotal.toLocaleString()} DH
                    </span>
                  </div>
                </div>
                <div className="bg-green-50 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-700 font-medium">💥 Agency Revenue</span>
                    <span className="text-xl font-bold text-green-700">
                      {estimatedCommission.toLocaleString()} DH
                    </span>
                  </div>
                </div>
              </div>

              {/* Commission Rate Field */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Commission Rate (%) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    step="0.1"
                    value={formData.commissionRate} 
                    onChange={(e) => setFormData({...formData, commissionRate: e.target.value})} 
                    placeholder="20" 
                    className="w-32 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#581c87]/20 focus:border-[#581c87]" 
                  />
                  <span className="text-gray-500">%</span>
                  <div className="flex-1 text-sm text-gray-500">
                    Agency earns: <strong className="text-[#581c87]">{estimatedCommission.toLocaleString()} DH</strong>
                  </div>
                </div>
              </div>

              {/* Booking Source with Custom Input */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Booking Source</label>
                <select 
                  value={formData.bookingSource} 
                  onChange={(e) => handleBookingSourceChange(e.target.value)} 
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#581c87]/20 focus:border-[#581c87] bg-white"
                >
                  {defaultBookingSources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
                
                {/* Custom source input - shows when "Other" is selected */}
                {showCustomSourceInput && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Please specify booking source
                    </label>
                    <input 
                      type="text" 
                      value={customBookingSource} 
                      onChange={(e) => setCustomBookingSource(e.target.value)} 
                      placeholder="e.g., Google Travel, TripAdvisor, etc."
                      className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#581c87]/20 focus:border-[#581c87]"
                    />
                    <p className="text-xs text-gray-400 mt-1">Enter the name of the booking platform</p>
                  </div>
                )}
              </div>

              {/* Guest Name */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Guest Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.guestName} 
                  onChange={(e) => setFormData({...formData, guestName: e.target.value})} 
                  placeholder="John Doe" 
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#581c87]/20 focus:border-[#581c87]" 
                />
              </div>

              {/* Check-in Date */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Check-in Date <span className="text-red-500">*</span>
                </label>
                <input 
                  type="date" 
                  value={formData.checkInDate} 
                  onChange={(e) => handleCheckInChange(e.target.value)} 
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#581c87]/20 focus:border-[#581c87]" 
                />
              </div>

              {/* Check-out Date - Read Only */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Check-out Date (Auto-calculated)</label>
                <input 
                  type="text" 
                  value={formData.checkOutDate || 'Will be calculated'} 
                  readOnly 
                  className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed" 
                />
                {formData.checkInDate && formData.nights && (
                  <p className="text-xs text-blue-500 mt-1">
                    Stay: {formData.checkInDate} → {formData.checkOutDate} ({formData.nights} nights)
                  </p>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
              <button 
                onClick={() => { setShowAddModal(false); resetForm(); }} 
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddRevenue} 
                disabled={submitting} 
                className="flex-1 py-3 rounded-xl bg-[#581c87] text-white font-semibold hover:bg-[#4c1d95] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#581c87]/20 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {submitting ? "Saving..." : (editingId ? "Update Revenue" : "Add Revenue")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}