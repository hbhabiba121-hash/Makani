"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, Download, Calendar, Building2, DollarSign, FileText, TrendingUp, Plus, Trash2, Eye, X, ChevronDown, ChevronUp, Receipt, Users } from "lucide-react";
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
  owner?: Owner; // Add owner to property details
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
  
  // Delete states
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<number | null>(null);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = [2023, 2024, 2025, 2026, 2027];
  const reportTypes = [
    { value: '', label: 'All Types' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  // Helper function to get owner full name from various data structures
  const getOwnerFullName = useCallback((owner: any): string => {
    if (!owner) return 'Unknown Owner';
    
    // If owner has user object with first_name and last_name
    if (owner.user) {
      const fullName = `${owner.user.first_name || ''} ${owner.user.last_name || ''}`.trim();
      if (fullName) return fullName;
      if (owner.user.email) return owner.user.email;
    }
    
    // If owner has direct first_name and last_name properties
    if (owner.first_name || owner.last_name) {
      const fullName = `${owner.first_name || ''} ${owner.last_name || ''}`.trim();
      if (fullName) return fullName;
    }
    
    // If owner has a name property
    if (owner.name) return owner.name;
    
    // If owner has email
    if (owner.email) return owner.email;
    
    // Fallback
    return `Owner #${owner.id}`;
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
      
      // Transform owners data to ensure consistent structure
      ownersData = ownersData.map((owner: any) => {
        // If owner doesn't have a user object but has first_name/last_name directly
        if (!owner.user && (owner.first_name || owner.last_name)) {
          return {
            ...owner,
            user: {
              id: owner.id,
              email: owner.email || '',
              first_name: owner.first_name || '',
              last_name: owner.last_name || ''
            }
          };
        }
        // If owner has user object but missing first_name/last_name
        if (owner.user && (!owner.user.first_name || !owner.user.last_name)) {
          return {
            ...owner,
            user: {
              ...owner.user,
              first_name: owner.user.first_name || owner.first_name || '',
              last_name: owner.user.last_name || owner.last_name || '',
              email: owner.user.email || owner.email || ''
            }
          };
        }
        return owner;
      });
      
      setOwners(ownersData);
    } catch (err) {
      console.error("Error fetching owners:", err);
    }
  }, []);

  // Filter properties by selected owner
  const filteredProperties = selectedOwnerId 
    ? properties.filter(p => p.owner_id === parseInt(selectedOwnerId))
    : properties;

  useEffect(() => {
    fetchReports();
    fetchProperties();
    fetchOwners();
  }, [fetchReports, fetchProperties, fetchOwners]);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const payload: any = {
        report_type: reportPeriod,
        report_scope: reportTypeChoice,
        year: selectedYear
      };
      
      if (reportPeriod === 'monthly') {
        payload.month = selectedMonth;
      }
      
      // Handle different scope selections
      if (reportScope === 'owner' && selectedOwnerId) {
        payload.owner_id = parseInt(selectedOwnerId);
        payload.property_id = 'all';
      } else if (reportScope === 'single' && selectedPropertyId) {
        payload.property_id = selectedPropertyId;
      } else if (reportScope === 'agency') {
        payload.property_id = 'all';
      }
      
      const response = await api.post('/reports/reports/generate/', payload);
      
      if (response.status === 200 || response.status === 201) {
        alert('Report generated successfully!');
        fetchReports();
        setShowGenerateModal(false);
        resetGenerateForm();
      }
    } catch (err: any) {
      console.error("Error generating report:", err);
      alert(err.response?.data?.error || "Failed to generate report");
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
      alert("Failed to load report details");
    }
  };

  const handleDownloadReport = async (reportId: number) => {
    try {
      const response = await api.get(`/reports/reports/${reportId}/download/`, { 
        responseType: 'blob' 
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading report:", err);
      alert("Failed to download report");
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    setDeletingId(reportId);
    try {
      await api.delete(`/reports/reports/${reportId}/delete/`);
      alert('Report deleted successfully!');
      fetchReports();
    } catch (err) {
      console.error("Error deleting report:", err);
      alert("Failed to delete report");
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleViewReceipt = (receiptUrl: string) => {
    if (receiptUrl) {
      window.open(receiptUrl, '_blank');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({
      property_id: '',
      report_type: '',
      month: '',
      year: new Date().getFullYear().toString()
    });
  };

  const togglePropertyExpand = (propertyId: number) => {
    const newExpanded = new Set(expandedProperties);
    if (newExpanded.has(propertyId)) {
      newExpanded.delete(propertyId);
    } else {
      newExpanded.add(propertyId);
    }
    setExpandedProperties(newExpanded);
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#581c87]" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Financial Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Generate and manage financial reports by agency, owner, or property</p>
        </div>
        <button 
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 bg-[#581c87] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#4c1d95] transition-all"
        >
          <Plus size={16} />
          Generate Report
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Scope</label>
            <select
              value={filters.property_id}
              onChange={(e) => handleFilterChange('property_id', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#581c87] focus:ring-1 focus:ring-[#581c87]"
            >
              <option value="">All Reports</option>
              <option value="all">Agency Reports (All Properties)</option>
              {properties.map(prop => (
                <option key={prop.id} value={prop.id}>{prop.name} (Single Property)</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Report Type</label>
            <select
              value={filters.report_type}
              onChange={(e) => handleFilterChange('report_type', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#581c87] focus:ring-1 focus:ring-[#581c87]"
            >
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Month</label>
            <select
              value={filters.month}
              onChange={(e) => handleFilterChange('month', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#581c87] focus:ring-1 focus:ring-[#581c87]"
              disabled={filters.report_type === 'yearly'}
            >
              <option value="">All Months</option>
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Year</label>
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#581c87] focus:ring-1 focus:ring-[#581c87]"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Generated Reports</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {reports.length > 0 ? reports.map((report) => (
            <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{report.name}</h3>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} /> {report.created_at}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 size={14} /> {report.property_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={14} /> {report.report_type === 'monthly' ? 'Monthly' : 'Yearly'}
                    </span>
                    <span className="flex items-center gap-1 text-green-600">
                      Revenue: {(report.total_revenue || 0).toLocaleString()} DH
                    </span>
                    <span className="flex items-center gap-1 text-red-500">
                      Expenses: {(report.total_expenses || 0).toLocaleString()} DH
                    </span>
                    <span className="flex items-center gap-1 text-[#581c87]">
                      Commission: {(report.total_commission || 0).toLocaleString()} DH
                    </span>
                    <span className="flex items-center gap-1 text-purple-600 font-semibold">
                      Profit: {(report.net_profit || 0).toLocaleString()} DH
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleViewReport(report)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
                  >
                    <Eye size={14} />
                    View
                  </button>
                  <button 
                    onClick={() => handleDownloadReport(report.id)}
                    className="flex items-center gap-2 px-3 py-2 bg-[#581c87] text-white rounded-lg text-sm font-medium hover:bg-[#4c1d95] transition-all"
                  >
                    <Download size={14} />
                    Download
                  </button>
                  <button 
                    onClick={() => {
                      setReportToDelete(report.id);
                      setShowDeleteConfirm(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-12 text-center text-gray-400">
              No reports found. Click "Generate Report" to create one.
            </div>
          )}
        </div>
      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Generate Financial Report</h2>
                <p className="text-sm text-gray-500">Create a new financial report</p>
              </div>
              <button onClick={() => { setShowGenerateModal(false); resetGenerateForm(); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* SECTION 1: REPORT TYPE */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">1. Report Type (Select One)</label>
                <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${reportTypeChoice === 'agency' ? 'border-[#581c87] bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="reportType"
                      value="agency"
                      checked={reportTypeChoice === 'agency'}
                      onChange={() => setReportTypeChoice("agency")}
                      className="w-4 h-4 text-[#581c87]"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">🏢 Agency Report</span>
                      <p className="text-xs text-gray-500 mt-0.5">Shows agency performance: Commission - Expenses = Agency Net Profit</p>
                    </div>
                  </label>
                  
                  <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${reportTypeChoice === 'owner' ? 'border-[#581c87] bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="reportType"
                      value="owner"
                      checked={reportTypeChoice === 'owner'}
                      onChange={() => setReportTypeChoice("owner")}
                      className="w-4 h-4 text-[#581c87]"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">🏠 Owner Report</span>
                      <p className="text-xs text-gray-500 mt-0.5">Shows property owner performance: Revenue - Commission - Expenses = Owner Net Profit</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* SECTION 2: SCOPE */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">2. Report Scope (Select One)</label>
                <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${reportScope === 'agency' ? 'border-[#581c87] bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="scope"
                      value="agency"
                      checked={reportScope === 'agency'}
                      onChange={() => setReportScope("agency")}
                      className="w-4 h-4 text-[#581c87]"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">🌍 All Properties</span>
                      <p className="text-xs text-gray-500 mt-0.5">Includes all properties combined with breakdown per property</p>
                    </div>
                  </label>
                  
                  <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${reportScope === 'owner' ? 'border-[#581c87] bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="scope"
                      value="owner"
                      checked={reportScope === 'owner'}
                      onChange={() => setReportScope("owner")}
                      className="w-4 h-4 text-[#581c87]"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">👤 Specific Owner</span>
                      <p className="text-xs text-gray-500 mt-0.5">Generate report for all properties owned by a specific owner</p>
                    </div>
                  </label>
                  
                  <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${reportScope === 'single' ? 'border-[#581c87] bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="scope"
                      value="single"
                      checked={reportScope === 'single'}
                      onChange={() => setReportScope("single")}
                      className="w-4 h-4 text-[#581c87]"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">🏠 Single Property</span>
                      <p className="text-xs text-gray-500 mt-0.5">Focus on one specific property only</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Owner Selection - FIXED to show full name properly */}
              {reportScope === 'owner' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Owner</label>
                  <select
                    value={selectedOwnerId}
                    onChange={(e) => setSelectedOwnerId(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#581c87] focus:ring-1 focus:ring-[#581c87]"
                  >
                    <option value="">-- Select an owner --</option>
                    {owners.map((owner) => {
                      const ownerName = getOwnerFullName(owner);
                      return (
                        <option key={owner.id} value={owner.id}>
                          {ownerName}
                        </option>
                      );
                    })}
                  </select>
                  {selectedOwnerId && (
                    <p className="text-xs text-gray-500 mt-2">
                      This will generate a report for all properties owned by this owner.
                    </p>
                  )}
                </div>
              )}

              {/* Property Selection */}
              {reportScope === 'single' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Property</label>
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#581c87] focus:ring-1 focus:ring-[#581c87]"
                  >
                    <option value="">-- Select a property --</option>
                    {filteredProperties.map(prop => (
                      <option key={prop.id} value={prop.id}>
                        {prop.name} {prop.owner_name ? `(Owner: ${prop.owner_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* SECTION 3: TIME PERIOD */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">3. Time Period (Select One)</label>
                <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${reportPeriod === 'monthly' ? 'border-[#581c87] bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="period"
                      value="monthly"
                      checked={reportPeriod === 'monthly'}
                      onChange={() => setReportPeriod("monthly")}
                      className="w-4 h-4 text-[#581c87]"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">Monthly Report</span>
                      <p className="text-xs text-gray-500 mt-0.5">Financial summary for a specific month</p>
                    </div>
                  </label>
                  
                  <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${reportPeriod === 'yearly' ? 'border-[#581c87] bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="period"
                      value="yearly"
                      checked={reportPeriod === 'yearly'}
                      onChange={() => setReportPeriod("yearly")}
                      className="w-4 h-4 text-[#581c87]"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">Yearly Report</span>
                      <p className="text-xs text-gray-500 mt-0.5">Financial summary with monthly breakdown</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Date Selection */}
              {reportPeriod === 'monthly' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Month</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#581c87] focus:ring-1 focus:ring-[#581c87]"
                    >
                      {months.map(month => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#581c87] focus:ring-1 focus:ring-[#581c87]"
                    >
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {reportPeriod === 'yearly' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#581c87] focus:ring-1 focus:ring-[#581c87]"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Validation Messages */}
              {reportScope === 'owner' && !selectedOwnerId && (
                <div className="bg-yellow-50 rounded-xl p-3 text-sm text-yellow-700">
                  Please select an owner to generate owner report
                </div>
              )}
              {reportScope === 'single' && !selectedPropertyId && (
                <div className="bg-yellow-50 rounded-xl p-3 text-sm text-yellow-700">
                  Please select a property for single property report
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => { setShowGenerateModal(false); resetGenerateForm(); }}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={generating || 
                  (reportScope === 'single' && !selectedPropertyId) ||
                  (reportScope === 'owner' && !selectedOwnerId)
                }
                className="flex-1 px-4 py-2 rounded-lg bg-[#581c87] text-white hover:bg-[#4c1d95] transition-all text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating && <Loader2 size={16} className="animate-spin" />}
                {generating ? "Generating..." : "Generate Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Report Modal */}
      {showViewModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedReport.name}</h2>
                <p className="text-sm text-gray-500">Generated on {selectedReport.created_at}</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Total Revenue</p>
                  <p className="text-lg font-bold text-green-600">
                    {(selectedReport.total_revenue || 0).toLocaleString()} DH
                  </p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Total Expenses</p>
                  <p className="text-lg font-bold text-red-600">
                    {(selectedReport.total_expenses || 0).toLocaleString()} DH
                  </p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Commission</p>
                  <p className="text-lg font-bold text-orange-600">
                    {(selectedReport.total_commission || 0).toLocaleString()} DH
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Net Profit</p>
                  <p className="text-lg font-bold text-purple-600">
                    {(selectedReport.net_profit || 0).toLocaleString()} DH
                  </p>
                </div>
              </div>

              {/* Property Breakdown */}
              {selectedReport.details?.properties && selectedReport.details.properties.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">📊 Property Breakdown</h3>
                  <div className="space-y-3">
                    {selectedReport.details.properties.map((prop) => (
                      <div key={prop.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() => togglePropertyExpand(prop.id)}
                          className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors text-left"
                        >
                          <div>
                            <h4 className="font-semibold text-gray-900">{prop.name}</h4>
                            <p className="text-xs text-gray-500">{prop.location}</p>
                            {prop.owner && (
                              <p className="text-xs text-gray-500 mt-1">
                                Owner: {getOwnerFullName(prop.owner)}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <span className="text-green-600">{prop.total_revenue.toLocaleString()} DH</span>
                            <span className="text-red-500">{prop.total_expenses.toLocaleString()} DH</span>
                            <span className="text-purple-600 font-semibold">{prop.net_profit.toLocaleString()} DH</span>
                            {expandedProperties.has(prop.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </button>
                        
                        {expandedProperties.has(prop.id) && (
                          <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-4">
                            {/* Bookings */}
                            {prop.bookings && prop.bookings.length > 0 && (
                              <div>
                                <h5 className="text-sm font-semibold text-gray-700 mb-2">📅 Bookings</h5>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="px-2 py-1 text-left">Guest</th>
                                        <th className="px-2 py-1 text-left">Source</th>
                                        <th className="px-2 py-1 text-left">Dates</th>
                                        <th className="px-2 py-1 text-right">Nights</th>
                                        <th className="px-2 py-1 text-right">Revenue</th>
                                        <th className="px-2 py-1 text-right">Commission</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {prop.bookings.map((booking, idx) => (
                                        <tr key={idx} className="border-b border-gray-200">
                                          <td className="px-2 py-1">{booking.guest_name}</td>
                                          <td className="px-2 py-1">{booking.booking_source}</td>
                                          <td className="px-2 py-1 whitespace-nowrap">{booking.check_in} → {booking.check_out}</td>
                                          <td className="px-2 py-1 text-right">{booking.nights}</td>
                                          <td className="px-2 py-1 text-right">{booking.revenue.toLocaleString()} DH</td>
                                          <td className="px-2 py-1 text-right">{booking.commission.toLocaleString()} DH</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                            
                            {/* Expenses with Receipts */}
                            {prop.expenses && prop.expenses.length > 0 && (
                              <div>
                                <h5 className="text-sm font-semibold text-gray-700 mb-2">💰 Expenses</h5>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="px-2 py-1 text-left">Category</th>
                                        <th className="px-2 py-1 text-left">Description</th>
                                        <th className="px-2 py-1 text-left">Date</th>
                                        <th className="px-2 py-1 text-right">Amount</th>
                                        <th className="px-2 py-1 text-center">Receipt</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {prop.expenses.map((expense, idx) => (
                                        <tr key={idx} className="border-b border-gray-200">
                                          <td className="px-2 py-1">{expense.category}</td>
                                          <td className="px-2 py-1">{expense.description || '-'}</td>
                                          <td className="px-2 py-1">{expense.date}</td>
                                          <td className="px-2 py-1 text-right text-red-600">{expense.amount.toLocaleString()} DH</td>
                                          <td className="px-2 py-1 text-center">
                                            {expense.receipt_url ? (
                                              <button
                                                onClick={() => handleViewReceipt(expense.receipt_url!)}
                                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 mx-auto"
                                              >
                                                <Receipt size={12} />
                                                <span className="text-xs">View</span>
                                              </button>
                                            ) : (
                                              <span className="text-gray-400 text-xs">No receipt</span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
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

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => handleDownloadReport(selectedReport.id)}
                className="flex-1 px-4 py-2 rounded-lg bg-[#581c87] text-white hover:bg-[#4c1d95] transition-all text-sm font-medium flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Download PDF
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Confirm Delete</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600">Are you sure you want to delete this report? This action cannot be undone.</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => reportToDelete && handleDeleteReport(reportToDelete)}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all text-sm font-medium flex items-center justify-center gap-2"
              >
                {deletingId === reportToDelete && <Loader2 size={16} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}