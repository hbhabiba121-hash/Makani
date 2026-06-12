"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ChevronDown,
  Check,
  Edit,
  Trash2,
  Eye,
  Percent,
  Wallet,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { financialService, RevenueRecord, RevenueStats, Property } from '@/lib/financialService';

const defaultBookingSources = ['Airbnb', 'Booking.com', 'Vrbo', 'Direct', 'Expedia', 'Other'];
const ITEMS_PER_PAGE = 10;

export default function RevenuePage() {
  const [revenueRecords, setRevenueRecords] = useState<RevenueRecord[]>([]);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSource, setSelectedSource] = useState("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  
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
    if (!checkInDate || !nights || nights <= 0) return '';
    const checkIn = new Date(checkInDate);
    if (isNaN(checkIn.getTime())) return '';
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + nights);
    return checkOut.toISOString().split('T')[0];
  }, []);

  const handleCheckInChange = (checkInDate: string) => {
    const nightsNum = parseInt(formData.nights) || 0;
    const checkOutDate = calculateCheckOut(checkInDate, nightsNum);
    setFormData(prev => ({ ...prev, checkInDate, checkOutDate }));
  };

  const handleNightsChange = (nights: string) => {
    const nightsNum = parseInt(nights) || 0;
    const checkOutDate = calculateCheckOut(formData.checkInDate, nightsNum);
    setFormData(prev => ({ ...prev, nights, checkOutDate }));
  };

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
      if (count > maxCount) { maxCount = count; topPlatform = platform; }
    }
    return topPlatform;
  };

  const totalAgencyRevenue = revenueRecords.reduce((sum, record) => sum + (record.commission || 0), 0);
  const averageCommissionRate = revenueRecords.length > 0 
    ? revenueRecords.reduce((sum, record) => sum + (record.commission_rate || 20), 0) / revenueRecords.length
    : 20;
  const topPlatform = getRealTopPlatform();

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
      setProperties(propertiesData);
      if (propertiesData.length > 0) setSelectedProperty(propertiesData[0]);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  }, []);

  useEffect(() => {
    fetchRevenueData();
    fetchProperties();
  }, [fetchRevenueData, fetchProperties]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSource]);

  const resetForm = () => {
    setFormData({
      amount: '', nights: '1', bookingSource: 'Airbnb', guestName: '',
      checkInDate: '', checkOutDate: '', status: 'paid', commissionRate: '20'
    });
    setCustomBookingSource('');
    setShowCustomSourceInput(false);
    setEditingId(null);
  };

  const handleAddRevenue = async () => {
    if (!selectedProperty || !formData.amount || !formData.guestName || !formData.checkInDate) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setSubmitting(true);
    try {
      const totalRevenue = parseFloat(formData.amount) * parseInt(formData.nights);
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
      alert('Échec de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewRecord = (record: RevenueRecord) => {
    setViewingRecord(record);
    setShowViewModal(true);
  };

  const handleEditRecord = (record: RevenueRecord) => {
    const pricePerNight = record.price_per_night || (record.amount / record.nights);
    const bookingSource = record.booking_source || record.source || 'Airbnb';
    const guestName = record.guest_name || record.guest || '';
    const commissionRate = record.commission_rate?.toString() || '20';
    const isCustomSource = !defaultBookingSources.includes(bookingSource);
    
    setFormData({
      amount: String(pricePerNight),
      nights: String(record.nights),
      bookingSource: isCustomSource ? 'Other' : bookingSource,
      guestName: guestName,
      checkInDate: record.check_in || '',
      checkOutDate: record.check_out || '',
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
    if (property) setSelectedProperty(property);
    setEditingId(record.id);
    setShowAddModal(true);
  };

  const handleDeleteRecord = async (recordId: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet enregistrement ?')) {
      try {
        await financialService.deleteFinancialRecord(recordId);
        fetchRevenueData();
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('Échec de la suppression');
      }
    }
  };

  const getUniqueSources = () => {
    const sources = new Set<string>();
    sources.add("all");
    revenueRecords.forEach(record => sources.add(record.source));
    return Array.from(sources);
  };

  // Filter records
  const filteredRecords = useMemo(() => {
    return revenueRecords.filter(record => {
      const matchesSearch = record.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            record.guest.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSource = selectedSource === "all" || record.source === selectedSource;
      return matchesSearch && matchesSource;
    });
  }, [revenueRecords, searchTerm, selectedSource]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRecords, currentPage]);

  const inputClass = "w-full p-2.5 rounded-lg border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] text-[#334155] bg-[#f8fafc] focus:bg-white transition-all text-[13px] font-medium";

  // Renamed to statsCards to avoid conflict with the stats state variable
  const statsCards = [
    { label: "Revenu Agence", value: `${totalAgencyRevenue.toLocaleString()} DH`, icon: Wallet, accent: "#10b981", sub: `Moy. ${Math.round(averageCommissionRate)}%` },
    { label: "Total Réservations", value: `${stats?.totalRevenue?.toLocaleString() || '0'} DH`, icon: CreditCard, accent: "#6366f1", sub: "Avant commission" },
    { label: "Séjours", value: stats?.totalBookings || 0, icon: Calendar, accent: "#f59e0b", sub: "Complétés" },
    { label: "Top Plateforme", value: topPlatform, icon: Award, accent: "#581c87", sub: `${revenueRecords.filter(r => r.source === topPlatform).length} réservations` },
  ];

  // Pagination Controls Component
  const PaginationControls = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-[#f1f5f9] bg-[#f8fafc]">
        <p className="text-[11px] text-[#94a3b8]">
          {filteredRecords.length} résultat{filteredRecords.length > 1 ? 's' : ''} • Page {currentPage} / {totalPages}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed text-[12px] transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-medium transition-colors ${
                  currentPage === pageNum
                    ? "bg-[#10b981] text-white"
                    : "text-[#64748b] hover:bg-[#f1f5f9] border border-[#e2e8f0]"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed text-[12px] transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 bg-[#f4f7f6] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-[#10b981] mx-auto mb-3" size={32} />
          <p className="text-[#64748b] text-[13px]">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f6]">
      <div className="p-4 max-w-[1280px] mx-auto">

        {/* Action Button */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex items-center gap-1.5 bg-[#10b981] text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#059669] transition-all shadow-[0_1px_2px_rgba(16,185,129,0.25)]"
          >
            <Plus size={14} />
            Ajouter
          </button>
        </div>

        {/* Stats Cards - using statsCards array */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {statsCards.map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#e2e8f0] p-4 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-[#64748b] font-medium">{s.label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.accent + "12" }}>
                  <s.icon size={14} style={{ color: s.accent }} />
                </div>
              </div>
              <p className="text-[20px] font-bold text-[#1e293b] tracking-tight">{s.value}</p>
              <p className="text-[10px] text-[#94a3b8] mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input 
                type="text" 
                placeholder="Rechercher un bien ou un invité..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-9 pr-3 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[13px] text-[#334155] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" 
              />
            </div>
            <div className="relative sm:w-48">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <select 
                value={selectedSource} 
                onChange={(e) => setSelectedSource(e.target.value)} 
                className="w-full pl-9 pr-8 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[13px] text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] appearance-none cursor-pointer"
              >
                {getUniqueSources().map(source => (
                  <option key={source} value={source}>
                    {source === "all" ? "Toutes les plateformes" : source}
                  </option>
                ))}
              </select>
            </div>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] text-[#334155] rounded-lg text-[12px] font-medium hover:bg-[#f1f5f9] transition-all">
              <Download size={14} />
              Exporter
            </button>
          </div>
        </div>

        {/* Revenue Records Table */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e2e8f0]">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Bien</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider hidden sm:table-cell">Invité</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider hidden md:table-cell">Source</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider hidden lg:table-cell">Dates</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Total</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Commission</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {paginatedRecords.length > 0 ? paginatedRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-[#94a3b8] flex-shrink-0" />
                        <span className="font-medium text-[#1e293b] text-[13px] truncate max-w-[120px]" title={record.property}>
                          {record.property}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-[12px] text-[#64748b]">
                        <User size={12} />
                        <span className="truncate max-w-[100px]">{record.guest}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                        record.source === "Airbnb" ? "bg-[#fef2f2] text-[#ef4444]" : 
                        record.source === "Booking.com" ? "bg-[#dbeafe] text-[#3b82f6]" : 
                        record.source === "Vrbo" ? "bg-[#ede9fe] text-[#7c3aed]" :
                        record.source === "Direct" ? "bg-[#d1fae5] text-[#10b981]" :
                        "bg-[#f1f5f9] text-[#64748b]"
                      }`}>
                        {record.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-[#64748b] whitespace-nowrap">
                          {record.check_in || record.date}
                        </span>
                        <span className="text-[10px] text-[#94a3b8]">
                          → {record.check_out || '-'} ({record.nights} nuits)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[#1e293b] text-[13px] font-semibold whitespace-nowrap">
                        {record.amount.toLocaleString()} DH
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-[#10b981] text-[13px] whitespace-nowrap">
                          {record.commission.toLocaleString()} DH
                        </span>
                        <span className="text-[10px] text-[#94a3b8]">
                          ({record.commission_rate || 20}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => handleViewRecord(record)}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f1f5f9] text-[#64748b] transition-colors"
                          title="Voir détails"
                        >
                          <Eye size={13} />
                        </button>
                        <button 
                          onClick={() => handleEditRecord(record)}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f1f5f9] text-[#64748b] transition-colors"
                          title="Modifier"
                        >
                          <Edit size={13} />
                        </button>
                        <button 
                          onClick={() => handleDeleteRecord(record.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#fef2f2] text-[#ef4444] transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-[#94a3b8] text-[13px]">
                      {filteredRecords.length === 0 ? "Aucun enregistrement trouvé" : "Aucune donnée sur cette page"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          <PaginationControls />
        </div>

      </div>

      {/* View Details Modal */}
      {showViewModal && viewingRecord && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] w-full max-w-md">
            <div className="p-5 border-b border-[#f1f5f9] flex justify-between items-center">
              <h2 className="text-[16px] font-bold text-[#1e293b]">Détails de la réservation</h2>
              <button onClick={() => setShowViewModal(false)} className="text-[#94a3b8] hover:text-[#334155] transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9]">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-[#f1f5f9]">
                <span className="text-[12px] text-[#64748b]">Bien</span>
                <span className="font-semibold text-[#1e293b] text-[13px]">{viewingRecord.property}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#f1f5f9]">
                <span className="text-[12px] text-[#64748b]">Invité</span>
                <span className="font-semibold text-[#1e293b] text-[13px]">{viewingRecord.guest}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#f1f5f9]">
                <span className="text-[12px] text-[#64748b]">Plateforme</span>
                <span className="font-semibold text-[#1e293b] text-[13px]">{viewingRecord.source}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#f1f5f9]">
                <span className="text-[12px] text-[#64748b]">Séjour</span>
                <span className="font-semibold text-[#1e293b] text-[13px]">
                  {viewingRecord.check_in || viewingRecord.date} → {viewingRecord.check_out || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#f1f5f9]">
                <span className="text-[12px] text-[#64748b]">Nuits</span>
                <span className="font-semibold text-[#1e293b] text-[13px]">{viewingRecord.nights}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#f1f5f9]">
                <span className="text-[12px] text-[#64748b]">Prix/nuit</span>
                <span className="font-semibold text-[#1e293b] text-[13px]">
                  {Math.round(viewingRecord.amount / viewingRecord.nights).toLocaleString()} DH
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#f1f5f9]">
                <span className="text-[12px] text-[#64748b]">Total réservation</span>
                <span className="font-bold text-[#1e293b] text-[13px]">{viewingRecord.amount.toLocaleString()} DH</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#f1f5f9]">
                <span className="text-[12px] text-[#64748b]">Taux commission</span>
                <span className="font-semibold text-[#1e293b] text-[13px]">{viewingRecord.commission_rate || 20}%</span>
              </div>
              <div className="flex justify-between items-center bg-[#f0fdf4] p-3 rounded-xl border border-[#d1fae5]">
                <span className="font-bold text-[#10b981] text-[13px]">💥 Revenu Agence</span>
                <span className="font-bold text-[18px] text-[#10b981]">{viewingRecord.commission.toLocaleString()} DH</span>
              </div>
            </div>
            <div className="p-5 border-t border-[#f1f5f9]">
              <button onClick={() => setShowViewModal(false)} className="w-full py-2.5 rounded-lg bg-[#10b981] text-white font-semibold hover:bg-[#059669] transition-all text-[13px]">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Revenue Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#f1f5f9] px-5 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-[16px] font-bold text-[#1e293b]">{editingId ? 'Modifier' : 'Ajouter'} une réservation</h2>
                <p className="text-[12px] text-[#94a3b8] mt-0.5">{editingId ? 'Mettre à jour' : 'Nouvel enregistrement'}</p>
              </div>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-[#94a3b8] hover:text-[#334155] transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9]">
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              {/* Property Selection */}
              <div className="mb-4">
                <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">Bien *</label>
                <div className="relative">
                  <button
                    onClick={() => setShowPropertyDropdown(!showPropertyDropdown)}
                    className="w-full p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg flex items-center justify-between hover:border-[#10b981] transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#e0e7ff] rounded-lg flex items-center justify-center">
                        <Building2 className="text-[#6366f1]" size={18} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-[#1e293b] text-[13px]">{selectedProperty?.name || 'Sélectionner un bien'}</p>
                        <p className="text-[11px] text-[#64748b]">{selectedProperty?.location || ''}</p>
                      </div>
                    </div>
                    <ChevronDown className={`text-[#94a3b8] transition-transform ${showPropertyDropdown ? 'rotate-180' : ''}`} size={16} />
                  </button>

                  {showPropertyDropdown && properties.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e2e8f0] rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                      {properties.map(property => (
                        <button
                          key={property.id}
                          onClick={() => { setSelectedProperty(property); setShowPropertyDropdown(false); }}
                          className="w-full p-3 flex items-center gap-3 hover:bg-[#f8fafc] transition-colors border-b border-[#f1f5f9] last:border-0 text-left"
                        >
                          <div className="w-9 h-9 bg-[#f1f5f9] rounded-lg flex items-center justify-center">
                            <Building2 size={16} className="text-[#64748b]" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-[#1e293b] text-[13px]">{property.name}</p>
                            <p className="text-[10px] text-[#64748b]">{property.location}</p>
                          </div>
                          {selectedProperty?.id === property.id && <Check size={16} className="text-[#10b981]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Price per night and Nights */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Prix/nuit (DH) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={formData.amount} 
                    onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                    placeholder="350" 
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Nuits *</label>
                  <input 
                    type="number" 
                    value={formData.nights} 
                    onChange={(e) => handleNightsChange(e.target.value)} 
                    placeholder="1" 
                    min="1"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Estimated Total & Commission Preview */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-[#f0fdf4] rounded-lg p-3 border border-[#d1fae5]">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#10b981] font-medium">Total réservation</span>
                    <span className="text-[16px] font-bold text-[#10b981]">
                      {estimatedTotal.toLocaleString()} DH
                    </span>
                  </div>
                </div>
                <div className="bg-[#ede9fe] rounded-lg p-3 border border-[#ddd6fe]">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#581c87] font-medium">💥 Revenu Agence</span>
                    <span className="text-[16px] font-bold text-[#581c87]">
                      {estimatedCommission.toLocaleString()} DH
                    </span>
                  </div>
                </div>
              </div>

              {/* Commission Rate Field */}
              <div className="mb-3">
                <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Taux commission (%) *</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    step="0.1"
                    value={formData.commissionRate} 
                    onChange={(e) => setFormData({...formData, commissionRate: e.target.value})} 
                    placeholder="20" 
                    className={`${inputClass} w-24`}
                  />
                  <span className="text-[#64748b] text-[13px]">%</span>
                  <div className="flex-1 text-[11px] text-[#64748b]">
                    Agence gagne: <strong className="text-[#10b981]">{estimatedCommission.toLocaleString()} DH</strong>
                  </div>
                </div>
              </div>

              {/* Booking Source with Custom Input */}
              <div className="mb-3">
                <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Plateforme de réservation</label>
                <select 
                  value={formData.bookingSource} 
                  onChange={(e) => handleBookingSourceChange(e.target.value)} 
                  className={`${inputClass} bg-white`}
                >
                  {defaultBookingSources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
                {showCustomSourceInput && (
                  <div className="mt-2">
                    <label className="text-[11px] text-[#64748b] mb-1 block">Précisez la plateforme</label>
                    <input 
                      type="text" 
                      value={customBookingSource} 
                      onChange={(e) => setCustomBookingSource(e.target.value)} 
                      placeholder="ex: Google Travel, TripAdvisor..."
                      className={inputClass}
                    />
                  </div>
                )}
              </div>

              {/* Guest Name */}
              <div className="mb-3">
                <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Nom de l'invité *</label>
                <input 
                  type="text" 
                  value={formData.guestName} 
                  onChange={(e) => setFormData({...formData, guestName: e.target.value})} 
                  placeholder="John Doe" 
                  className={inputClass}
                />
              </div>

              {/* Check-in Date */}
              <div className="mb-3">
                <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Date d'arrivée *</label>
                <input 
                  type="date" 
                  value={formData.checkInDate} 
                  onChange={(e) => handleCheckInChange(e.target.value)} 
                  className={inputClass}
                />
              </div>

              {/* Check-out Date - Read Only */}
              <div className="mb-4">
                <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Date de départ (Auto)</label>
                <input 
                  type="text" 
                  value={formData.checkOutDate || 'Calculé automatiquement'} 
                  readOnly 
                  className={`${inputClass} bg-[#f1f5f9] text-[#64748b] cursor-not-allowed`}
                />
                {formData.checkInDate && formData.nights && (
                  <p className="text-[10px] text-[#10b981] mt-1">
                    Séjour: {formData.checkInDate} → {formData.checkOutDate} ({formData.nights} nuits)
                  </p>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="sticky bottom-0 bg-white border-t border-[#f1f5f9] px-5 py-4 flex gap-2.5">
              <button 
                onClick={() => { setShowAddModal(false); resetForm(); }} 
                className="flex-1 py-2.5 rounded-lg border border-[#e2e8f0] text-[#64748b] font-semibold hover:bg-[#f8fafc] transition-all text-[13px]"
              >
                Annuler
              </button>
              <button 
                onClick={handleAddRevenue} 
                disabled={submitting} 
                className="flex-1 py-2.5 rounded-lg bg-[#10b981] text-white font-semibold hover:bg-[#059669] transition-all flex items-center justify-center gap-1.5 shadow-[0_1px_2px_rgba(16,185,129,0.25)] text-[13px] disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                {submitting ? "Enregistrement..." : (editingId ? "Mettre à jour" : "Ajouter")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}