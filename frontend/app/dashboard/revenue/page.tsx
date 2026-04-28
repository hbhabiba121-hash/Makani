// frontend/app/dashboard/revenue/page.tsx - COMPLETE WITH DH CURRENCY & PROPER SIZING

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
  Trash2
} from 'lucide-react';
import { financialService, RevenueRecord, RevenueStats } from '@/lib/financialService';

interface Property {
  id: number;
  name: string;
  location: string;
  image?: string;
  price_per_night?: number;
  bedrooms?: number;
  bathrooms?: number;
  max_guests?: number;
}

export default function RevenuePage() {
  const [revenueRecords, setRevenueRecords] = useState<RevenueRecord[]>([]);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSource, setSelectedSource] = useState("all");
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    nights: '1',
    bookingSource: 'Airbnb',
    guestName: '',
    checkInDate: '',
    checkOutDate: '',
    status: 'paid'
  });

  const bookingSources = ['Airbnb', 'Booking.com', 'Vrbo', 'Direct', 'Expedia', 'Other'];

  // Auto-calculate check-out date
  const calculateCheckOut = useCallback((checkInDate: string, nights: number) => {
    if (checkInDate && nights) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + nights);
      return checkOut.toISOString().split('T')[0];
    }
    return '';
  }, []);

  const handleDateChange = (checkInDate: string, nights: number) => {
    const checkOutDate = calculateCheckOut(checkInDate, nights);
    setFormData(prev => ({
      ...prev,
      checkInDate,
      checkOutDate
    }));
  };

  const handleNightsChange = (nights: string) => {
    const nightsNum = parseInt(nights) || 0;
    const checkOutDate = calculateCheckOut(formData.checkInDate, nightsNum);
    setFormData(prev => ({
      ...prev,
      nights,
      checkOutDate
    }));
  };

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

  // Handle Add/Update Revenue
  const handleAddRevenue = async () => {
    if (!selectedProperty || !formData.amount || !formData.guestName || !formData.checkInDate) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const totalRevenue = parseFloat(formData.amount) * parseInt(formData.nights);
      
      const recordData = {
        property_id: selectedProperty.id,
        month: new Date(formData.checkInDate).getMonth() + 1,
        year: new Date(formData.checkInDate).getFullYear(),
        price_per_night: parseFloat(formData.amount),
        nights: parseInt(formData.nights),
        revenue: totalRevenue,
        expenses: 0,
        commission_rate: 20,
        guest_name: formData.guestName,
        booking_source: formData.bookingSource,
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

  // Handle Edit - Load existing data into form
  const handleEditRecord = (record: RevenueRecord) => {
    const pricePerNight = record.price_per_night || (record.amount / record.nights);
    const checkInDate = record.check_in || '';
    const checkOutDate = record.check_out || '';
    const bookingSource = record.booking_source || record.source || 'Airbnb';
    const guestName = record.guest_name || record.guest || '';
    
    setFormData({
      amount: String(pricePerNight),
      nights: String(record.nights),
      bookingSource: bookingSource,
      guestName: guestName,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      status: record.status || 'paid'
    });
    
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

  const resetForm = () => {
    setFormData({
      amount: '',
      nights: '1',
      bookingSource: 'Airbnb',
      guestName: '',
      checkInDate: '',
      checkOutDate: '',
      status: 'paid'
    });
    setEditingId(null);
  };

  const estimatedTotal = parseFloat(formData.amount) * parseInt(formData.nights) || 0;

  const filteredRecords = revenueRecords.filter(record => {
    const matchesSearch = record.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.guest.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = selectedSource === "all" || record.source === selectedSource;
    return matchesSearch && matchesSource;
  });

  const sources = ["all", ...new Set(revenueRecords.map(r => r.source))];

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
          <p className="text-gray-500 text-sm mt-1">Track all property revenue and bookings</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="text-green-600" size={20} />
            </div>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <ArrowUpRight size={14} />
              <span>12.5%</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 font-medium">Total Revenue</p>
          <h3 className="text-xl font-bold text-gray-900 mt-1">{stats?.totalRevenue?.toLocaleString() || '0'} DH</h3>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
            <Calendar className="text-blue-600" size={20} />
          </div>
          <p className="text-xs text-gray-500 font-medium">Total Bookings</p>
          <h3 className="text-xl font-bold text-gray-900 mt-1">{stats?.totalBookings || 0}</h3>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp className="text-purple-600" size={20} />
          </div>
          <p className="text-xs text-gray-500 font-medium">Avg per Booking</p>
          <h3 className="text-xl font-bold text-gray-900 mt-1">{stats?.avgPerBooking?.toLocaleString() || '0'} DH</h3>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-3">
            <Award className="text-orange-600" size={20} />
          </div>
          <p className="text-xs text-gray-500 font-medium">Top Platform</p>
          <h3 className="text-xl font-bold text-gray-900 mt-1">{stats?.topPlatform || 'N/A'}</h3>
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
                  {sources.map(source => (
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
                <th className="px-3 py-3">Check-in</th>
                <th className="px-3 py-3">Check-out</th>
                <th className="px-3 py-3">Nights</th>
                <th className="px-3 py-3 text-right">DH/Night</th>
                <th className="px-3 py-3 text-right">Total</th>
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
                      "bg-green-50 text-green-600"
                    }`}>
                      {record.source}
                    </span>
                   </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 text-sm whitespace-nowrap">
                        {record.check_in || record.date}
                      </span>
                    </div>
                   </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 text-sm whitespace-nowrap">
                        {record.check_out || '-'}
                      </span>
                    </div>
                   </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 text-sm whitespace-nowrap">
                        {record.nights}
                      </span>
                    </div>
                   </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-gray-700 text-sm font-medium whitespace-nowrap">
                      {Math.round(record.amount / record.nights).toLocaleString()} DH
                    </span>
                   </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                      <CreditCard size={14} className="text-green-500 flex-shrink-0" />
                      <span className="font-bold text-green-600 text-sm">
                        {record.amount.toLocaleString()} DH
                      </span>
                    </div>
                   </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        onClick={() => handleEditRecord(record)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                  <td colSpan={9} className="px-3 py-8 text-center text-gray-400 text-sm">
                    No revenue records found
                   </td>
                </tr>
              )}
            </tbody>
           </table>
        </div>
      </motion.div>

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

              {/* Amount and Nights */}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nights</label>
                  <input 
                    type="number" 
                    value={formData.nights} 
                    onChange={(e) => handleNightsChange(e.target.value)} 
                    placeholder="7" 
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#581c87]/20 focus:border-[#581c87]" 
                  />
                </div>
              </div>

              {/* Estimated Total */}
              <div className="bg-purple-50 rounded-xl p-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-700 font-medium">Estimated Total</span>
                  <span className="text-xl font-bold text-purple-900">
                    {estimatedTotal.toLocaleString()} DH
                  </span>
                </div>
              </div>

              {/* Booking Source */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Booking Source</label>
                <select 
                  value={formData.bookingSource} 
                  onChange={(e) => setFormData({...formData, bookingSource: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#581c87]/20 focus:border-[#581c87] bg-white"
                >
                  {bookingSources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Check-in Date <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  value={formData.checkInDate} 
                  onChange={(e) => handleDateChange(e.target.value, parseInt(formData.nights))} 
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#581c87]/20 focus:border-[#581c87]" 
                />
              </div>

              {/* Check-out Date - Auto-calculated */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Check-out Date</label>
                <input 
                  type="date" 
                  value={formData.checkOutDate} 
                  readOnly 
                  className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed" 
                />
                <p className="text-xs text-gray-400 mt-1">Automatically calculated based on check-in date + nights</p>
              </div>

              {/* Selected Property Preview */}
              {selectedProperty && (
                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Selected Property</p>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                      <Building2 className="text-purple-600" size={28} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{selectedProperty.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Bed size={12} /> {selectedProperty.bedrooms || 2} beds
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Bath size={12} /> {selectedProperty.bathrooms || 2} baths
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Users size={12} /> {selectedProperty.max_guests || 4} guests
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500 font-semibold">
                          <DollarSign size={12} /> {selectedProperty.price_per_night || 100} DH/night
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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