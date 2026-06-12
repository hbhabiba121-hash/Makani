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
  ChevronRight,
  PieChart,
  ArrowRight,
  Star,
  Briefcase
} from 'lucide-react';
import { financialService, RevenueRecord, RevenueStats, Property } from '@/lib/financialService';

const defaultBookingSources = ['Airbnb', 'Booking.com', 'Vrbo', 'Direct', 'Expedia', 'Other'];
const ITEMS_PER_PAGE = 8;

export default function RevenuePage() {
  const [revenueRecords, setRevenueRecords] = useState<RevenueRecord[]>([]);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSource, setSelectedSource] = useState("all");
  
  const [currentPage, setCurrentPage] = useState(1);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewingRecord, setViewingRecord] = useState<RevenueRecord | null>(null);
  
  const [customBookingSource, setCustomBookingSource] = useState('');
  const [showCustomSourceInput, setShowCustomSourceInput] = useState(false);
  
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

  const filteredRecords = useMemo(() => {
    return revenueRecords.filter(record => {
      const matchesSearch = record.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            record.guest.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSource = selectedSource === "all" || record.source === selectedSource;
      return matchesSearch && matchesSource;
    });
  }, [revenueRecords, searchTerm, selectedSource]);

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRecords, currentPage]);

  const inputClass = "w-full p-2.5 rounded-lg border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] text-[#334155] bg-[#f8fafc] focus:bg-white transition-all text-[13px] font-medium";

  // Top performing properties
  const topProperties = useMemo(() => {
    const propertyStats: Record<string, { revenue: number; count: number }> = {};
    revenueRecords.forEach(record => {
      if (!propertyStats[record.property]) {
        propertyStats[record.property] = { revenue: 0, count: 0 };
      }
      propertyStats[record.property].revenue += record.commission;
      propertyStats[record.property].count += 1;
    });
    return Object.entries(propertyStats)
      .map(([name, data]) => ({ name, revenue: data.revenue, bookings: data.count }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);
  }, [revenueRecords]);

  const statsCards = [
    { label: "Revenu Agence", value: `${totalAgencyRevenue.toLocaleString()} DH`, icon: Briefcase, accent: "#10b981", trend: "+15%", trendUp: true },
    { label: "Total Réservations", value: `${stats?.totalRevenue?.toLocaleString() || '0'} DH`, icon: CreditCard, accent: "#6366f1", sub: "Avant commission" },
    { label: "Séjours", value: stats?.totalBookings || 0, icon: Calendar, accent: "#f59e0b", sub: "Complétés" },
    { label: "Top Plateforme", value: topPlatform, icon: Star, accent: "#581c87", sub: `${revenueRecords.filter(r => r.source === topPlatform).length} réservations` },
  ];

  const PaginationControls = () => {
    if (totalPages <= 1) return null;
    
    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;
      let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      let endPage = Math.min(totalPages, startPage + maxVisible - 1);
      
      if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      return pages;
    };

    return (
      <div className="flex items-center justify-between px-5 py-4 border-t border-[#f1f5f9] bg-gradient-to-r from-[#fafbfc] to-[#f8fafc]">
        <p className="text-[11px] text-[#94a3b8]">
          {filteredRecords.length} résultat{filteredRecords.length > 1 ? 's' : ''} • Page {currentPage} / {totalPages}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {getPageNumbers().map(pageNum => (
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
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#10b981]/10 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="animate-spin text-[#10b981]" size={32} />
          </div>
          <p className="text-[#64748b] text-[13px] font-medium">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]">
      <div className="p-6 max-w-[1400px] mx-auto">

        {/* Header Section */}
        <div className="relative mb-8">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#10b981]/5 rounded-full blur-3xl -z-10"></div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-[1.75rem] font-bold bg-gradient-to-r from-[#111827] to-[#10b981] bg-clip-text text-transparent tracking-tight">
                Gestion des Revenus
              </h1>
              <p className="text-[0.875rem] text-[#64748b] mt-1">Suivez et gérez les revenus de l'agence</p>
            </div>
            <button
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="flex items-center gap-2 bg-gradient-to-r from-[#10b981] to-[#059669] text-white px-5 py-2.5 rounded-xl text-[13px] font-semibold hover:shadow-lg transition-all duration-300"
            >
              <Plus size={16} />
              Nouvelle Réservation
            </button>
          </div>
        </div>

        {/* Stats Cards with Modern Design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {statsCards.map((s, i) => (
            <div key={i} className="group bg-white rounded-2xl border border-[#e2e8f0] p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110" style={{ backgroundColor: s.accent + "12" }}>
                  <s.icon size={18} style={{ color: s.accent }} />
                </div>
                {s.trend && (
                  <div className={`flex items-center gap-1 text-[11px] font-medium ${s.trendUp ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    <ArrowUpRight size={12} />
                    {s.trend}
                  </div>
                )}
              </div>
              <p className="text-[12px] text-[#64748b] font-medium uppercase tracking-wider">{s.label}</p>
              <p className="text-[24px] font-bold text-[#1e293b] tracking-tight mt-1">{s.value}</p>
              {s.sub && <p className="text-[10px] text-[#94a3b8] mt-2">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Platform Distribution */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-[#1e293b] text-[15px]">Distribution par Plateforme</h2>
                <p className="text-[11px] text-[#94a3b8] mt-0.5">Réservations par source de revenus</p>
              </div>
              <PieChart size={18} className="text-[#94a3b8]" />
            </div>
            <div className="space-y-4">
              {getUniqueSources().filter(s => s !== "all").map(source => {
                const sourceRecords = revenueRecords.filter(r => r.source === source);
                const total = sourceRecords.reduce((sum, r) => sum + r.commission, 0);
                const percentage = totalAgencyRevenue > 0 ? (total / totalAgencyRevenue) * 100 : 0;
                const getSourceColor = () => {
                  if (source === "Airbnb") return "#ef4444";
                  if (source === "Booking.com") return "#3b82f6";
                  if (source === "Vrbo") return "#7c3aed";
                  if (source === "Direct") return "#10b981";
                  return "#64748b";
                };
                return (
                  <div key={source} className="group cursor-pointer" onClick={() => setSelectedSource(source)}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getSourceColor() }} />
                        <span className="text-[12px] font-medium text-[#334155]">{source}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-[#1e293b]">{total.toLocaleString()} DH</span>
                        <span className="text-[10px] text-[#94a3b8] w-12 text-right">{percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                        style={{ width: `${percentage}%`, backgroundColor: getSourceColor() }}
                      />
                    </div>
                    <p className="text-[9px] text-[#94a3b8] mt-1">{sourceRecords.length} réservations</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Properties */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-[#1e293b] text-[15px]">Top Performances</h2>
                <p className="text-[11px] text-[#94a3b8] mt-0.5">Meilleurs biens par revenu</p>
              </div>
              <Trophy size={18} className="text-[#94a3b8]" />
            </div>
            <div className="space-y-3">
              {topProperties.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 size={32} className="mx-auto text-[#cbd5e1] mb-2" />
                  <p className="text-[12px] text-[#94a3b8]">Aucune donnée disponible</p>
                </div>
              ) : (
                topProperties.map((prop, idx) => (
                  <div key={prop.name} className="flex items-center justify-between p-3 rounded-xl bg-[#fafbfc] hover:bg-[#f8fafc] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${idx === 0 ? 'bg-[#fef3c7]' : idx === 1 ? 'bg-[#f1f5f9]' : 'bg-[#fef2f2]'}`}>
                        <span className={`text-[11px] font-bold ${idx === 0 ? 'text-[#f59e0b]' : idx === 1 ? 'text-[#64748b]' : 'text-[#ef4444]'}`}>
                          #{idx + 1}
                        </span>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-[#1e293b]">{prop.name}</p>
                        <p className="text-[10px] text-[#94a3b8]">{prop.bookings} réservations</p>
                      </div>
                    </div>
                    <p className="text-[13px] font-bold text-[#10b981]">{prop.revenue.toLocaleString()} DH</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input 
                type="text" 
                placeholder="Rechercher un bien ou un invité..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-9 pr-3 py-2.5 bg-[#fafbfc] border border-[#e2e8f0] rounded-xl text-[13px] text-[#334155] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" 
              />
            </div>
            <div className="relative sm:w-56">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <select 
                value={selectedSource} 
                onChange={(e) => setSelectedSource(e.target.value)} 
                className="w-full pl-9 pr-8 py-2.5 bg-[#fafbfc] border border-[#e2e8f0] rounded-xl text-[13px] text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] appearance-none cursor-pointer"
              >
                {getUniqueSources().map(source => (
                  <option key={source} value={source}>
                    {source === "all" ? "Toutes les plateformes" : source}
                  </option>
                ))}
              </select>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-[#fafbfc] border border-[#e2e8f0] text-[#334155] rounded-xl text-[12px] font-medium hover:bg-[#f1f5f9] transition-all">
              <Download size={14} />
              Exporter
            </button>
          </div>
        </div>

        {/* Revenue Records Table */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-gradient-to-r from-[#fafbfc] to-[#f8fafc]">
                  <th className="text-left px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Bien</th>
                  <th className="text-left px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider hidden sm:table-cell">Invité</th>
                  <th className="text-left px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider hidden md:table-cell">Source</th>
                  <th className="text-left px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider hidden lg:table-cell">Dates</th>
                  <th className="text-right px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Total</th>
                  <th className="text-right px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Commission</th>
                  <th className="text-center px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {paginatedRecords.length > 0 ? paginatedRecords.map((record, idx) => (
                  <tr key={record.id} className="hover:bg-[#fafbfc] transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#f1f5f9] flex items-center justify-center group-hover:bg-[#e2e8f0] transition-colors">
                          <Building2 size={13} className="text-[#64748b]" />
                        </div>
                        <span className="font-medium text-[#1e293b] text-[13px] truncate max-w-[150px]" title={record.property}>
                          {record.property}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-2 text-[12px] text-[#64748b]">
                        <div className="w-5 h-5 rounded-full bg-[#f1f5f9] flex items-center justify-center">
                          <User size={10} className="text-[#64748b]" />
                        </div>
                        <span className="truncate max-w-[100px]">{record.guest}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                        record.source === "Airbnb" ? "bg-[#fef2f2] text-[#ef4444]" : 
                        record.source === "Booking.com" ? "bg-[#dbeafe] text-[#3b82f6]" : 
                        record.source === "Vrbo" ? "bg-[#ede9fe] text-[#7c3aed]" :
                        record.source === "Direct" ? "bg-[#d1fae5] text-[#10b981]" :
                        "bg-[#f1f5f9] text-[#64748b]"
                      }`}>
                        {record.source}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={11} className="text-[#94a3b8]" />
                        <span className="text-[11px] text-[#64748b] whitespace-nowrap">
                          {record.check_in || record.date}
                        </span>
                        <ArrowRight size={10} className="text-[#cbd5e1]" />
                        <span className="text-[10px] text-[#94a3b8]">{record.nights} nuits</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-[#1e293b] text-[13px] font-bold whitespace-nowrap">
                        {record.amount.toLocaleString()} DH
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-[#10b981] text-[13px] whitespace-nowrap">
                          {record.commission.toLocaleString()} DH
                        </span>
                        <span className="text-[9px] text-[#94a3b8]">
                          ({record.commission_rate || 20}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => handleViewRecord(record)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"
                          title="Voir détails"
                        >
                          <Eye size={13} />
                        </button>
                        <button 
                          onClick={() => handleEditRecord(record)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"
                          title="Modifier"
                        >
                          <Edit size={13} />
                        </button>
                        <button 
                          onClick={() => handleDeleteRecord(record.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#fef2f2] text-[#ef4444] transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="w-16 h-16 rounded-full bg-[#f1f5f9] flex items-center justify-center mx-auto mb-3">
                        <Receipt size={24} className="text-[#94a3b8]" />
                      </div>
                      <p className="text-[#94a3b8] text-[13px] font-medium">
                        {filteredRecords.length === 0 ? "Aucun enregistrement trouvé" : "Aucune donnée sur cette page"}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <PaginationControls />
        </div>
      </div>

      {/* View Details Modal - Modern Design */}
      {showViewModal && viewingRecord && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#10b981] to-[#059669] rounded-t-2xl"></div>
              <div className="p-6 border-b border-[#f1f5f9] flex justify-between items-center">
                <div>
                  <h2 className="text-[18px] font-bold bg-gradient-to-r from-[#111827] to-[#10b981] bg-clip-text text-transparent">
                    Détails de la réservation
                  </h2>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5">Informations complètes</p>
                </div>
                <button onClick={() => setShowViewModal(false)} className="text-[#94a3b8] hover:text-[#334155] transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9]">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#fafbfc] rounded-xl p-3">
                  <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-1">Bien</p>
                  <p className="font-semibold text-[#1e293b] text-[13px]">{viewingRecord.property}</p>
                </div>
                <div className="bg-[#fafbfc] rounded-xl p-3">
                  <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-1">Invité</p>
                  <p className="font-semibold text-[#1e293b] text-[13px]">{viewingRecord.guest}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#fafbfc] rounded-xl p-3">
                  <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-1">Plateforme</p>
                  <p className="font-semibold text-[#1e293b] text-[13px]">{viewingRecord.source}</p>
                </div>
                <div className="bg-[#fafbfc] rounded-xl p-3">
                  <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-1">Nuits</p>
                  <p className="font-semibold text-[#1e293b] text-[13px]">{viewingRecord.nights}</p>
                </div>
              </div>
              <div className="bg-[#fafbfc] rounded-xl p-3">
                <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-1">Séjour</p>
                <p className="font-semibold text-[#1e293b] text-[13px]">
                  {viewingRecord.check_in || viewingRecord.date} → {viewingRecord.check_out || '-'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#fafbfc] rounded-xl p-3">
                  <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-1">Prix / nuit</p>
                  <p className="font-semibold text-[#1e293b] text-[13px]">
                    {Math.round(viewingRecord.amount / viewingRecord.nights).toLocaleString()} DH
                  </p>
                </div>
                <div className="bg-[#fafbfc] rounded-xl p-3">
                  <p className="text-[10px] text-[94a3b8] uppercase tracking-wider mb-1">Total réservation</p>
                  <p className="font-bold text-[#1e293b] text-[15px]">{viewingRecord.amount.toLocaleString()} DH</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-[#f0fdf4] to-[#dcfce7] rounded-xl p-4 border border-[#d1fae5]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-[#10b981] font-medium uppercase tracking-wider">Revenu Agence</p>
                    <p className="text-[11px] text-[#059669] mt-0.5">Taux: {viewingRecord.commission_rate || 20}%</p>
                  </div>
                  <p className="font-bold text-[24px] text-[#10b981]">{viewingRecord.commission.toLocaleString()} DH</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[#f1f5f9]">
              <button onClick={() => setShowViewModal(false)} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-semibold hover:shadow-lg transition-all text-[13px]">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Revenue Modal - Modern Design */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#f1f5f9] px-6 py-5 flex justify-between items-center z-10">
              <div>
                <h2 className="text-[18px] font-bold bg-gradient-to-r from-[#111827] to-[#10b981] bg-clip-text text-transparent">
                  {editingId ? 'Modifier' : 'Ajouter'} une réservation
                </h2>
                <p className="text-[11px] text-[#94a3b8] mt-0.5">{editingId ? 'Mettre à jour les informations' : 'Nouvel enregistrement'}</p>
              </div>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-[#94a3b8] hover:text-[#334155] transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9]">
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {/* Property Selection */}
              <div className="mb-5">
                <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">Bien *</label>
                <div className="relative">
                  <button
                    onClick={() => setShowPropertyDropdown(!showPropertyDropdown)}
                    className="w-full p-3 bg-[#fafbfc] border border-[#e2e8f0] rounded-xl flex items-center justify-between hover:border-[#10b981] transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#e0e7ff] to-[#c7d2fe] rounded-xl flex items-center justify-center">
                        <Building2 className="text-[#6366f1]" size={18} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-[#1e293b] text-[13px]">{selectedProperty?.name || 'Sélectionner un bien'}</p>
                        <p className="text-[10px] text-[#64748b]">{selectedProperty?.location || ''}</p>
                      </div>
                    </div>
                    <ChevronDown className={`text-[#94a3b8] transition-transform duration-200 ${showPropertyDropdown ? 'rotate-180' : ''}`} size={16} />
                  </button>

                  {showPropertyDropdown && properties.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#e2e8f0] rounded-xl shadow-lg z-10 max-h-56 overflow-y-auto">
                      {properties.map(property => (
                        <button
                          key={property.id}
                          onClick={() => { setSelectedProperty(property); setShowPropertyDropdown(false); }}
                          className="w-full p-3 flex items-center gap-3 hover:bg-[#fafbfc] transition-colors border-b border-[#f1f5f9] last:border-0 text-left"
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

              {/* Price and Nights */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">Prix / nuit (DH) *</label>
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
                  <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">Nuits *</label>
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

              {/* Estimated Preview Cards */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gradient-to-r from-[#f0fdf4] to-[#dcfce7] rounded-xl p-3 border border-[#d1fae5]">
                  <p className="text-[10px] text-[#10b981] font-medium uppercase tracking-wider">Total réservation</p>
                  <p className="text-[18px] font-bold text-[#10b981] mt-1">{estimatedTotal.toLocaleString()} DH</p>
                </div>
                <div className="bg-gradient-to-r from-[#f3e8ff] to-[#e9d5ff] rounded-xl p-3 border border-[#d8b4fe]">
                  <p className="text-[10px] text-[#581c87] font-medium uppercase tracking-wider">Revenu Agence</p>
                  <p className="text-[18px] font-bold text-[#581c87] mt-1">{estimatedCommission.toLocaleString()} DH</p>
                </div>
              </div>

              {/* Commission Rate */}
              <div className="mb-4">
                <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">Taux commission (%) *</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    step="0.1"
                    value={formData.commissionRate} 
                    onChange={(e) => setFormData({...formData, commissionRate: e.target.value})} 
                    placeholder="20" 
                    className={`${inputClass} w-28`}
                  />
                  <span className="text-[#64748b] text-[13px]">%</span>
                  <div className="flex-1 text-[11px] text-[#64748b]">
                    Agence gagne: <strong className="text-[#10b981] text-[13px]">{estimatedCommission.toLocaleString()} DH</strong>
                  </div>
                </div>
              </div>

              {/* Booking Source */}
              <div className="mb-4">
                <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">Plateforme de réservation</label>
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
              <div className="mb-4">
                <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">Nom de l'invité *</label>
                <input 
                  type="text" 
                  value={formData.guestName} 
                  onChange={(e) => setFormData({...formData, guestName: e.target.value})} 
                  placeholder="John Doe" 
                  className={inputClass}
                />
              </div>

              {/* Check-in Date */}
              <div className="mb-4">
                <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">Date d'arrivée *</label>
                <input 
                  type="date" 
                  value={formData.checkInDate} 
                  onChange={(e) => handleCheckInChange(e.target.value)} 
                  className={inputClass}
                />
              </div>

              {/* Check-out Date */}
              <div>
                <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">Date de départ (Auto)</label>
                <input 
                  type="text" 
                  value={formData.checkOutDate || 'Calculé automatiquement'} 
                  readOnly 
                  className={`${inputClass} bg-[#f1f5f9] text-[#64748b] cursor-not-allowed`}
                />
                {formData.checkInDate && formData.nights && (
                  <p className="text-[10px] text-[#10b981] mt-1.5 flex items-center gap-1">
                    <Clock size={10} />
                    Séjour: {formData.checkInDate} → {formData.checkOutDate} ({formData.nights} nuits)
                  </p>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="sticky bottom-0 bg-white border-t border-[#f1f5f9] px-6 py-5 flex gap-3">
              <button 
                onClick={() => { setShowAddModal(false); resetForm(); }} 
                className="flex-1 py-2.5 rounded-xl border border-[#e2e8f0] text-[#64748b] font-semibold hover:bg-[#fafbfc] transition-all text-[13px]"
              >
                Annuler
              </button>
              <button 
                onClick={handleAddRevenue} 
                disabled={submitting} 
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
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

// Add missing Trophy and Receipt icons
const Trophy = ({ size, className }: { size?: number; className?: string }) => {
  return <Star size={size} className={className} />;
};

const Receipt = ({ size, className }: { size?: number; className?: string }) => {
  return <CreditCard size={size} className={className} />;
};