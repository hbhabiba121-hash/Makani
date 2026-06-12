"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Loader2, Download, Calendar, Building2, DollarSign, FileText, TrendingUp, 
  Plus, Trash2, Eye, X, ChevronDown, ChevronUp, Receipt, Users, 
  Search, Filter, ChevronLeft, ChevronRight
} from "lucide-react";
import api from "@/lib/axios";

interface Report {
  id: number;
  name: string;
  report_type: string;
  report_scope?: string;
  month: number | null;
  year: number;
  property_id: number | null;
  property_name: string;
  total_revenue: number;
  total_expenses: number;
  total_commission: number;
  net_profit: number;
  owner_payout?: number;
  property_count: number;
  created_at: string;
  summary?: {
    total_revenue: number;
    total_expenses: number;
    total_commission: number;
    net_profit: number;
  };
  details?: {
    properties?: PropertyDetail[];
    summary?: {
      total_bookings: number;
      total_expense_items: number;
      average_revenue_per_property: number;
    };
    monthly_breakdown?: MonthlyBreakdown[];
  };
}

interface PropertyDetail {
  id: number;
  name: string;
  location: string;
  total_revenue: number;
  total_expenses: number;
  total_commission: number;
  net_profit: number;
  bookings?: Booking[];
  expenses?: ExpenseDetail[];
  booking_count: number;
  expense_count: number;
  owner?: Owner;
}

interface Booking {
  guest_name: string;
  booking_source: string;
  check_in: string;
  check_out: string;
  nights: number;
  price_per_night: number;
  revenue: number;
  commission: number;
}

interface ExpenseDetail {
  category: string;
  description: string;
  date: string;
  amount: number;
  receipt_url?: string;
}

interface MonthlyBreakdown {
  month: number;
  month_name: string;
  revenue: number;
  expenses: number;
  commission: number;
  net_profit: number;
}

interface Property {
  id: number;
  name: string;
  location: string;
  owner_id?: number;
  owner_name?: string;
  price_per_night?: number;
  owner?: Owner;
}

interface Owner {
  id: number;
  user?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  name?: string;
}

const ITEMS_PER_PAGE = 10;
const months = [
  { value: 1, label: 'Janvier' }, { value: 2, label: 'Février' }, { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' }, { value: 5, label: 'Mai' }, { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' }, { value: 8, label: 'Août' }, { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' }, { value: 11, label: 'Novembre' }, { value: 12, label: 'Décembre' },
];
const years = [2023, 2024, 2025, 2026, 2027];
const reportTypes = [
  { value: '', label: 'Tous' },
  { value: 'monthly', label: 'Mensuel' },
  { value: 'yearly', label: 'Annuel' }
];

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [expandedProperties, setExpandedProperties] = useState<Set<number>>(new Set());
  
  // Generate form states
  const [reportTypeChoice, setReportTypeChoice] = useState<"agency" | "owner">("agency");
  const [reportScope, setReportScope] = useState<"agency" | "single" | "owner">("agency");
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [reportPeriod, setReportPeriod] = useState<"monthly" | "yearly">("monthly");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Filter states
  const [filters, setFilters] = useState({
    property_id: '',
    report_type: '',
    month: '',
    year: new Date().getFullYear().toString()
  });
  
  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Delete states
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<number | null>(null);

  const getOwnerFullName = useCallback((owner: any): string => {
    if (!owner) return 'Propriétaire inconnu';
    if (owner.user) {
      const fullName = `${owner.user.first_name || ''} ${owner.user.last_name || ''}`.trim();
      if (fullName) return fullName;
      if (owner.user.email) return owner.user.email;
    }
    if (owner.first_name || owner.last_name) {
      const fullName = `${owner.first_name || ''} ${owner.last_name || ''}`.trim();
      if (fullName) return fullName;
    }
    if (owner.name) return owner.name;
    if (owner.email) return owner.email;
    return `Propriétaire #${owner.id}`;
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.property_id) params.append('property_id', filters.property_id);
      if (filters.report_type) params.append('report_type', filters.report_type);
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);
      
      const response = await api.get(`/reports/reports/?${params.toString()}`);
      const data = response.data;
      setReports(data.reports || []);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchProperties = useCallback(async () => {
    try {
      const response = await api.get('/api/properties/');
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setProperties(data);
    } catch (err) {
      console.error("Error fetching properties:", err);
    }
  }, []);

  const fetchOwners = useCallback(async () => {
    try {
      const response = await api.get('/api/owners/');
      let ownersData = Array.isArray(response.data) ? response.data : response.data.results || [];
      ownersData = ownersData.map((owner: any) => {
        if (!owner.user && (owner.first_name || owner.last_name)) {
          return { ...owner, user: { id: owner.id, email: owner.email || '', first_name: owner.first_name || '', last_name: owner.last_name || '' } };
        }
        if (owner.user && (!owner.user.first_name || !owner.user.last_name)) {
          return { ...owner, user: { ...owner.user, first_name: owner.user.first_name || owner.first_name || '', last_name: owner.user.last_name || owner.last_name || '', email: owner.user.email || owner.email || '' } };
        }
        return owner;
      });
      setOwners(ownersData);
    } catch (err) {
      console.error("Error fetching owners:", err);
    }
  }, []);

  const filteredProperties = selectedOwnerId ? properties.filter(p => p.owner_id === parseInt(selectedOwnerId)) : properties;

  useEffect(() => {
    fetchReports();
    fetchProperties();
    fetchOwners();
  }, [fetchReports, fetchProperties, fetchOwners]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const payload: any = { report_type: reportPeriod, report_scope: reportTypeChoice, year: selectedYear };
      if (reportPeriod === 'monthly') payload.month = selectedMonth;
      if (reportScope === 'owner' && selectedOwnerId) { payload.owner_id = parseInt(selectedOwnerId); payload.property_id = 'all'; }
      else if (reportScope === 'single' && selectedPropertyId) payload.property_id = selectedPropertyId;
      else if (reportScope === 'agency') payload.property_id = 'all';
      
      const response = await api.post('/reports/reports/generate/', payload);
      if (response.status === 200 || response.status === 201) {
        alert('Rapport généré avec succès !');
        fetchReports();
        setShowGenerateModal(false);
        resetGenerateForm();
      }
    } catch (err: any) {
      console.error("Error generating report:", err);
      alert(err.response?.data?.error || "Échec de la génération du rapport");
    } finally {
      setGenerating(false);
    }
  };

  const resetGenerateForm = () => {
    setReportTypeChoice("agency");
    setReportScope("agency");
    setSelectedOwnerId("");
    setSelectedPropertyId("");
    setReportPeriod("monthly");
    setSelectedMonth(new Date().getMonth() + 1);
    setSelectedYear(new Date().getFullYear());
  };

  const handleViewReport = async (report: Report) => {
    try {
      const response = await api.get(`/reports/reports/${report.id}/`);
      const data = response.data;
      setSelectedReport({
        ...data,
        total_revenue: data.summary?.total_revenue || data.total_revenue || 0,
        total_expenses: data.summary?.total_expenses || data.total_expenses || 0,
        total_commission: data.summary?.total_commission || data.total_commission || 0,
        net_profit: data.summary?.net_profit || data.net_profit || 0,
      });
      setShowViewModal(true);
    } catch (err) {
      console.error("Error fetching report details:", err);
      alert("Échec du chargement des détails");
    }
  };

  const handleDownloadReport = async (reportId: number) => {
    try {
      const response = await api.get(`/reports/reports/${reportId}/download/`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading report:", err);
      alert("Échec du téléchargement");
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    setDeletingId(reportId);
    try {
      await api.delete(`/reports/reports/${reportId}/delete/`);
      alert('Rapport supprimé avec succès !');
      fetchReports();
    } catch (err) {
      console.error("Error deleting report:", err);
      alert("Échec de la suppression");
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleViewReceipt = (receiptUrl: string) => {
    if (receiptUrl) window.open(receiptUrl, '_blank');
  };

  const handleFilterChange = (key: string, value: string) => setFilters({ ...filters, [key]: value });
  const clearFilters = () => setFilters({ property_id: '', report_type: '', month: '', year: new Date().getFullYear().toString() });
  const togglePropertyExpand = (propertyId: number) => {
    const newExpanded = new Set(expandedProperties);
    if (newExpanded.has(propertyId)) newExpanded.delete(propertyId);
    else newExpanded.add(propertyId);
    setExpandedProperties(newExpanded);
  };

  // Filter & Paginate reports
  const filteredReports = useMemo(() => {
    return reports.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.property_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reports, searchTerm]);

  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReports.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredReports, currentPage]);

  const inputClass = "w-full p-2.5 rounded-lg border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] text-[#334155] bg-[#f8fafc] focus:bg-white transition-all text-[13px] font-medium";

  const statsCards = [
    { label: "Rapports", value: reports.length, icon: FileText, accent: "#6366f1", sub: "Générés" },
    { label: "Revenu Total", value: `${reports.reduce((sum, r) => sum + (r.total_revenue || 0), 0).toLocaleString()} DH`, icon: DollarSign, accent: "#10b981", sub: "Cumulé" },
    { label: "Commission", value: `${reports.reduce((sum, r) => sum + (r.total_commission || 0), 0).toLocaleString()} DH`, icon: TrendingUp, accent: "#f59e0b", sub: "Agence" },
    { label: "Profit Net", value: `${reports.reduce((sum, r) => sum + (r.net_profit || 0), 0).toLocaleString()} DH`, icon: Building2, accent: "#581c87", sub: "Cumulé" },
  ];

  const PaginationControls = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-[#f1f5f9] bg-[#f8fafc]">
        <p className="text-[11px] text-[#94a3b8]">{filteredReports.length} résultat{filteredReports.length > 1 ? 's' : ''} • Page {currentPage} / {totalPages}</p>
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed text-[12px] transition-colors"><ChevronLeft size={14} /></button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
            return (<button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-medium transition-colors ${currentPage === pageNum ? "bg-[#10b981] text-white" : "text-[#64748b] hover:bg-[#f1f5f9] border border-[#e2e8f0]"}`}>{pageNum}</button>);
          })}
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed text-[12px] transition-colors"><ChevronRight size={14} /></button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 bg-[#f4f7f6] min-h-screen flex items-center justify-center">
        <div className="text-center"><Loader2 className="animate-spin text-[#10b981] mx-auto mb-3" size={32} /><p className="text-[#64748b] text-[13px]">Chargement des rapports...</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f6]">
      <div className="p-4 max-w-[1280px] mx-auto">

        {/* Action Button */}
        <div className="mb-4 flex justify-end">
          <button onClick={() => setShowGenerateModal(true)} className="flex items-center gap-1.5 bg-[#10b981] text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#059669] transition-all shadow-[0_1px_2px_rgba(16,185,129,0.25)]">
            <Plus size={14} /> Générer un rapport
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {statsCards.map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#e2e8f0] p-4 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-[#64748b] font-medium">{s.label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.accent + "12" }}><s.icon size={14} style={{ color: s.accent }} /></div>
              </div>
              <p className="text-[20px] font-bold text-[#1e293b] tracking-tight">{s.value}</p>
              <p className="text-[10px] text-[#94a3b8] mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input type="text" placeholder="Rechercher un rapport..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[13px] text-[#334155] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" />
            </div>
            <div className="relative sm:w-40">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <select value={filters.report_type} onChange={(e) => handleFilterChange('report_type', e.target.value)} className="w-full pl-9 pr-8 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[13px] text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] appearance-none cursor-pointer">
                {reportTypes.map(type => (<option key={type.value} value={type.value}>{type.label}</option>))}
              </select>
            </div>
            <div className="relative sm:w-36">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <select value={filters.year} onChange={(e) => handleFilterChange('year', e.target.value)} className="w-full pl-9 pr-8 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[13px] text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] appearance-none cursor-pointer">
                {years.map(year => (<option key={year} value={year}>{year}</option>))}
              </select>
            </div>
            <button onClick={clearFilters} className="px-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] text-[#334155] rounded-lg text-[12px] font-medium hover:bg-[#f1f5f9] transition-all">Réinitialiser</button>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
          {paginatedReports.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-[#f1f5f9] rounded-xl flex items-center justify-center mx-auto mb-3"><FileText size={22} className="text-[#94a3b8]" /></div>
              <p className="text-[14px] font-semibold text-[#334155]">Aucun rapport trouvé</p>
              <p className="text-[12px] text-[#94a3b8] mt-0.5">Générez votre premier rapport financier</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-[#f1f5f9]">
                {paginatedReports.map((report) => (
                  <div key={report.id} className="p-4 hover:bg-[#f8fafc] transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-[#1e293b] text-[14px]">{report.name}</h3>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${report.report_type === 'monthly' ? 'bg-[#dbeafe] text-[#3b82f6]' : 'bg-[#ede9fe] text-[#7c3aed]'}`}>
                            {report.report_type === 'monthly' ? 'Mensuel' : 'Annuel'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[11px] text-[#64748b]">
                          <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(report.created_at).toLocaleDateString('fr-FR')}</span>
                          <span className="flex items-center gap-1"><Building2 size={11} /> {report.property_name}</span>
                          <span className="text-[#10b981] font-medium">{report.total_revenue.toLocaleString()} DH</span>
                          <span className="text-[#ef4444] font-medium">-{report.total_expenses.toLocaleString()} DH</span>
                          <span className="text-[#f59e0b] font-medium">+{report.total_commission.toLocaleString()} DH</span>
                          <span className="text-[#581c87] font-bold">{report.net_profit.toLocaleString()} DH</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleViewReport(report)} className="flex items-center gap-1 bg-[#f0f9ff] text-[#0284c7] px-3 py-1.5 rounded-lg text-[11px] font-medium hover:bg-[#e0f2fe] transition-all"><Eye size={12} /> Voir</button>
                        <button onClick={() => handleDownloadReport(report.id)} className="flex items-center gap-1 bg-[#f0fdf4] text-[#10b981] px-3 py-1.5 rounded-lg text-[11px] font-medium hover:bg-[#dcfce7] transition-all"><Download size={12} /> PDF</button>
                        <button onClick={() => { setReportToDelete(report.id); setShowDeleteConfirm(true); }} className="flex items-center gap-1 bg-[#fef2f2] text-[#ef4444] px-3 py-1.5 rounded-lg text-[11px] font-medium hover:bg-[#fee2e2] transition-all"><Trash2 size={12} /> Supprimer</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <PaginationControls />
            </>
          )}
        </div>

      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#f1f5f9] px-5 py-4 flex justify-between items-center">
              <div><h2 className="text-[16px] font-bold text-[#1e293b]">Générer un rapport</h2><p className="text-[12px] text-[#94a3b8] mt-0.5">Créer un nouveau rapport financier</p></div>
              <button onClick={() => { setShowGenerateModal(false); resetGenerateForm(); }} className="text-[#94a3b8] hover:text-[#334155] transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9]"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Report Type */}
              <div>
                <label className="text-[12px] font-semibold text-[#334155] mb-2 block">1. Type de rapport</label>
                <div className="space-y-2">
                  <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${reportTypeChoice === 'agency' ? 'border-[#10b981] bg-[#f0fdf4]' : 'border-[#e2e8f0] hover:border-[#10b981]'}`}>
                    <input type="radio" name="reportType" value="agency" checked={reportTypeChoice === 'agency'} onChange={() => setReportTypeChoice("agency")} className="w-4 h-4 text-[#10b981]" /><div className="flex-1"><span className="font-semibold text-[#1e293b] text-[13px]">🏢 Rapport Agence</span><p className="text-[10px] text-[#64748b] mt-0.5">Commission - Dépenses = Profit Agence</p></div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${reportTypeChoice === 'owner' ? 'border-[#10b981] bg-[#f0fdf4]' : 'border-[#e2e8f0] hover:border-[#10b981]'}`}>
                    <input type="radio" name="reportType" value="owner" checked={reportTypeChoice === 'owner'} onChange={() => setReportTypeChoice("owner")} className="w-4 h-4 text-[#10b981]" /><div className="flex-1"><span className="font-semibold text-[#1e293b] text-[13px]">🏠 Rapport Propriétaire</span><p className="text-[10px] text-[#64748b] mt-0.5">Revenu - Commission - Dépenses = Profit Propriétaire</p></div>
                  </label>
                </div>
              </div>
              {/* Scope */}
              <div>
                <label className="text-[12px] font-semibold text-[#334155] mb-2 block">2. Périmètre</label>
                <div className="space-y-2">
                  <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${reportScope === 'agency' ? 'border-[#10b981] bg-[#f0fdf4]' : 'border-[#e2e8f0] hover:border-[#10b981]'}`}>
                    <input type="radio" name="scope" value="agency" checked={reportScope === 'agency'} onChange={() => setReportScope("agency")} className="w-4 h-4 text-[#10b981]" /><div className="flex-1"><span className="font-semibold text-[#1e293b] text-[13px]">🌍 Tous les biens</span><p className="text-[10px] text-[#64748b] mt-0.5">Rapport consolidé avec détail par bien</p></div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${reportScope === 'owner' ? 'border-[#10b981] bg-[#f0fdf4]' : 'border-[#e2e8f0] hover:border-[#10b981]'}`}>
                    <input type="radio" name="scope" value="owner" checked={reportScope === 'owner'} onChange={() => setReportScope("owner")} className="w-4 h-4 text-[#10b981]" /><div className="flex-1"><span className="font-semibold text-[#1e293b] text-[13px]">👤 Propriétaire spécifique</span><p className="text-[10px] text-[#64748b] mt-0.5">Tous les biens d'un propriétaire</p></div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${reportScope === 'single' ? 'border-[#10b981] bg-[#f0fdf4]' : 'border-[#e2e8f0] hover:border-[#10b981]'}`}>
                    <input type="radio" name="scope" value="single" checked={reportScope === 'single'} onChange={() => setReportScope("single")} className="w-4 h-4 text-[#10b981]" /><div className="flex-1"><span className="font-semibold text-[#1e293b] text-[13px]">🏠 Bien unique</span><p className="text-[10px] text-[#64748b] mt-0.5">Focus sur un seul bien</p></div>
                  </label>
                </div>
              </div>
              {/* Owner Selection */}
              {reportScope === 'owner' && (
                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Sélectionner un propriétaire</label>
                  <select value={selectedOwnerId} onChange={(e) => setSelectedOwnerId(e.target.value)} className={`${inputClass} bg-white`}>
                    <option value="">-- Choisir --</option>
                    {owners.map((owner) => (<option key={owner.id} value={owner.id}>{getOwnerFullName(owner)}</option>))}
                  </select>
                </div>
              )}
              {/* Property Selection */}
              {reportScope === 'single' && (
                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Sélectionner un bien</label>
                  <select value={selectedPropertyId} onChange={(e) => setSelectedPropertyId(e.target.value)} className={`${inputClass} bg-white`}>
                    <option value="">-- Choisir --</option>
                    {filteredProperties.map(prop => (<option key={prop.id} value={prop.id}>{prop.name}</option>))}
                  </select>
                </div>
              )}
              {/* Period */}
              <div>
                <label className="text-[12px] font-semibold text-[#334155] mb-2 block">3. Période</label>
                <div className="space-y-2">
                  <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${reportPeriod === 'monthly' ? 'border-[#10b981] bg-[#f0fdf4]' : 'border-[#e2e8f0] hover:border-[#10b981]'}`}>
                    <input type="radio" name="period" value="monthly" checked={reportPeriod === 'monthly'} onChange={() => setReportPeriod("monthly")} className="w-4 h-4 text-[#10b981]" /><div className="flex-1"><span className="font-semibold text-[#1e293b] text-[13px]">Mensuel</span><p className="text-[10px] text-[#64748b] mt-0.5">Résumé pour un mois spécifique</p></div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${reportPeriod === 'yearly' ? 'border-[#10b981] bg-[#f0fdf4]' : 'border-[#e2e8f0] hover:border-[#10b981]'}`}>
                    <input type="radio" name="period" value="yearly" checked={reportPeriod === 'yearly'} onChange={() => setReportPeriod("yearly")} className="w-4 h-4 text-[#10b981]" /><div className="flex-1"><span className="font-semibold text-[#1e293b] text-[13px]">Annuel</span><p className="text-[10px] text-[#64748b] mt-0.5">Résumé avec détail mensuel</p></div>
                  </label>
                </div>
              </div>
              {/* Date Selection */}
              {reportPeriod === 'monthly' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[12px] font-semibold text-[#334155] mb-1 block">Mois</label><select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className={`${inputClass} bg-white`}>{months.map(m => (<option key={m.value} value={m.value}>{m.label}</option>))}</select></div>
                  <div><label className="text-[12px] font-semibold text-[#334155] mb-1 block">Année</label><select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className={`${inputClass} bg-white`}>{years.map(y => (<option key={y} value={y}>{y}</option>))}</select></div>
                </div>
              )}
              {reportPeriod === 'yearly' && (
                <div><label className="text-[12px] font-semibold text-[#334155] mb-1 block">Année</label><select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className={`${inputClass} bg-white`}>{years.map(y => (<option key={y} value={y}>{y}</option>))}</select></div>
              )}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-[#f1f5f9] px-5 py-4 flex gap-2.5">
              <button onClick={() => { setShowGenerateModal(false); resetGenerateForm(); }} className="flex-1 py-2.5 rounded-lg border border-[#e2e8f0] text-[#64748b] font-semibold hover:bg-[#f8fafc] transition-all text-[13px]">Annuler</button>
              <button onClick={handleGenerateReport} disabled={generating || (reportScope === 'single' && !selectedPropertyId) || (reportScope === 'owner' && !selectedOwnerId)} className="flex-1 py-2.5 rounded-lg bg-[#10b981] text-white font-semibold hover:bg-[#059669] transition-all flex items-center justify-center gap-1.5 shadow-[0_1px_2px_rgba(16,185,129,0.25)] text-[13px] disabled:opacity-50">{generating ? <Loader2 className="animate-spin" size={16} /> : null}{generating ? "Génération..." : "Générer"}</button>
            </div>
          </div>
        </div>
      )}

      {/* View Report Modal */}
      {showViewModal && selectedReport && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#f1f5f9] px-5 py-4 flex justify-between items-center">
              <div><h2 className="text-[16px] font-bold text-[#1e293b]">{selectedReport.name}</h2><p className="text-[12px] text-[#94a3b8] mt-0.5">Généré le {new Date(selectedReport.created_at).toLocaleDateString('fr-FR')}</p></div>
              <button onClick={() => setShowViewModal(false)} className="text-[#94a3b8] hover:text-[#334155] transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9]"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-[#f0fdf4] rounded-xl p-3 text-center border border-[#d1fae5]"><p className="text-[10px] text-[#10b981] font-medium">Revenu Total</p><p className="text-[18px] font-bold text-[#10b981]">{(selectedReport.total_revenue || 0).toLocaleString()} DH</p></div>
                <div className="bg-[#fef2f2] rounded-xl p-3 text-center border border-[#fecaca]"><p className="text-[10px] text-[#ef4444] font-medium">Dépenses</p><p className="text-[18px] font-bold text-[#ef4444]">{(selectedReport.total_expenses || 0).toLocaleString()} DH</p></div>
                <div className="bg-[#fff7ed] rounded-xl p-3 text-center border border-[#fed7aa]"><p className="text-[10px] text-[#f97316] font-medium">Commission</p><p className="text-[18px] font-bold text-[#f97316]">{(selectedReport.total_commission || 0).toLocaleString()} DH</p></div>
                <div className="bg-[#ede9fe] rounded-xl p-3 text-center border border-[#ddd6fe]"><p className="text-[10px] text-[#7c3aed] font-medium">Profit Net</p><p className="text-[18px] font-bold text-[#7c3aed]">{(selectedReport.net_profit || 0).toLocaleString()} DH</p></div>
              </div>
              {/* Property Breakdown */}
              {selectedReport.details?.properties && selectedReport.details.properties.length > 0 && (
                <div>
                  <h3 className="font-bold text-[#1e293b] text-[14px] mb-3">📊 Détail par bien</h3>
                  <div className="space-y-3">
                    {selectedReport.details.properties.map((prop) => (
                      <div key={prop.id} className="border border-[#e2e8f0] rounded-xl overflow-hidden">
                        <button onClick={() => togglePropertyExpand(prop.id)} className="w-full p-4 flex justify-between items-center hover:bg-[#f8fafc] transition-colors text-left">
                          <div>
                            <h4 className="font-semibold text-[#1e293b] text-[13px]">{prop.name}</h4>
                            <p className="text-[11px] text-[#64748b]">{prop.location}</p>
                            {prop.owner && (<p className="text-[10px] text-[#64748b] mt-1">Propriétaire: {getOwnerFullName(prop.owner)}</p>)}
                          </div>
                          <div className="flex items-center gap-4 text-[12px]">
                            <span className="text-[#10b981] font-medium">{prop.total_revenue.toLocaleString()} DH</span>
                            <span className="text-[#ef4444] font-medium">-{prop.total_expenses.toLocaleString()} DH</span>
                            <span className="text-[#581c87] font-bold">{prop.net_profit.toLocaleString()} DH</span>
                            {expandedProperties.has(prop.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </button>
                        {expandedProperties.has(prop.id) && (
                          <div className="p-4 bg-[#f8fafc] border-t border-[#e2e8f0] space-y-4">
                            {/* Bookings */}
                            {prop.bookings && prop.bookings.length > 0 && (
                              <div>
                                <h5 className="text-[12px] font-semibold text-[#334155] mb-2">📅 Réservations</h5>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-[11px]">
                                    <thead className="bg-[#f1f5f9]"><tr><th className="px-2 py-2 text-left text-[#64748b]">Invité</th><th className="px-2 py-2 text-left text-[#64748b]">Source</th><th className="px-2 py-2 text-left text-[#64748b]">Dates</th><th className="px-2 py-2 text-right text-[#64748b]">Nuits</th><th className="px-2 py-2 text-right text-[#64748b]">Revenu</th><th className="px-2 py-2 text-right text-[#64748b]">Commission</th></tr></thead>
                                    <tbody>
                                      {prop.bookings.map((booking, idx) => (<tr key={idx} className="border-b border-[#f1f5f9]"><td className="px-2 py-2 text-[#334155]">{booking.guest_name}</td><td className="px-2 py-2 text-[#64748b]">{booking.booking_source}</td><td className="px-2 py-2 text-[#64748b] whitespace-nowrap">{booking.check_in} → {booking.check_out}</td><td className="px-2 py-2 text-right text-[#64748b]">{booking.nights}</td><td className="px-2 py-2 text-right text-[#10b981] font-medium">{booking.revenue.toLocaleString()} DH</td><td className="px-2 py-2 text-right text-[#f59e0b] font-medium">{booking.commission.toLocaleString()} DH</td></tr>))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                            {/* Expenses */}
                            {prop.expenses && prop.expenses.length > 0 && (
                              <div>
                                <h5 className="text-[12px] font-semibold text-[#334155] mb-2">💰 Dépenses</h5>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-[11px]">
                                    <thead className="bg-[#f1f5f9]"><tr><th className="px-2 py-2 text-left text-[#64748b]">Catégorie</th><th className="px-2 py-2 text-left text-[#64748b]">Description</th><th className="px-2 py-2 text-left text-[#64748b]">Date</th><th className="px-2 py-2 text-right text-[#64748b]">Montant</th><th className="px-2 py-2 text-center text-[#64748b]">Reçu</th></tr></thead>
                                    <tbody>
                                      {prop.expenses.map((expense, idx) => (<tr key={idx} className="border-b border-[#f1f5f9]"><td className="px-2 py-2 text-[#334155]">{expense.category}</td><td className="px-2 py-2 text-[#64748b]">{expense.description || '-'}</td><td className="px-2 py-2 text-[#64748b]">{expense.date}</td><td className="px-2 py-2 text-right text-[#ef4444] font-medium">{expense.amount.toLocaleString()} DH</td><td className="px-2 py-2 text-center">{expense.receipt_url ? (<button onClick={() => handleViewReceipt(expense.receipt_url!)} className="text-[#0284c7] hover:text-[#0369a1] flex items-center gap-1 mx-auto"><Receipt size={11} /><span className="text-[10px]">Voir</span></button>) : (<span className="text-[#94a3b8] text-[10px]">Aucun</span>)}</td></tr>))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-[#f1f5f9] px-5 py-4 flex gap-2.5">
              <button onClick={() => handleDownloadReport(selectedReport.id)} className="flex-1 py-2.5 rounded-lg bg-[#10b981] text-white font-semibold hover:bg-[#059669] transition-all flex items-center justify-center gap-1.5 shadow-[0_1px_2px_rgba(16,185,129,0.25)] text-[13px]"><Download size={14} /> Télécharger PDF</button>
              <button onClick={() => setShowViewModal(false)} className="flex-1 py-2.5 rounded-lg border border-[#e2e8f0] text-[#64748b] font-semibold hover:bg-[#f8fafc] transition-all text-[13px]">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] w-full max-w-sm">
            <div className="p-5">
              <div className="w-10 h-10 bg-[#fef2f2] rounded-xl flex items-center justify-center mx-auto mb-3"><Trash2 size={18} className="text-[#ef4444]" /></div>
              <h2 className="text-[16px] font-bold text-[#1e293b] text-center mb-1">Supprimer</h2>
              <p className="text-[#64748b] text-[13px] text-center mb-5">Supprimer ce rapport ? Action irréversible.</p>
              <div className="flex gap-2.5">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 rounded-lg border border-[#e2e8f0] text-[#64748b] font-semibold hover:bg-[#f8fafc] transition-all text-[13px]">Annuler</button>
                <button onClick={() => reportToDelete && handleDeleteReport(reportToDelete)} disabled={deletingId === reportToDelete} className="flex-1 py-2.5 rounded-lg bg-[#ef4444] text-white font-semibold hover:bg-[#dc2626] transition-all flex items-center justify-center gap-1.5 text-[13px] disabled:opacity-50">{deletingId === reportToDelete ? <Loader2 className="animate-spin" size={16} /> : null}{deletingId === reportToDelete ? "Suppression..." : "Supprimer"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}