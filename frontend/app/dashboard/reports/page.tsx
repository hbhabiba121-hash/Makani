"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, Download, Calendar, Building2, DollarSign, FileText, TrendingUp, Plus, Trash2, Filter } from "lucide-react";
import api from "@/lib/axios";

interface Report {
  id: number;
  name: string;
  report_type: string;
  month: number | null;
  year: number;
  property_id: number | null;
  property_name: string;
  total_revenue: number;
  total_expenses: number;
  total_commission: number;
  net_profit: number;
  property_count: number;
  created_at: string;
  details?: any;
}

interface Property {
  id: number;
  name: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    property_id: '',
    report_type: '',
    month: '',
    year: new Date().getFullYear().toString()
  });
  
  // Generate form states
  const [selectedProperty, setSelectedProperty] = useState("");
  const [reportType, setReportType] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Delete states
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<number | null>(null);
  
  const [stats, setStats] = useState({
    totalReports: 0,
    totalRevenue: 0,
    totalProfit: 0
  });

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

  useEffect(() => {
    fetchReports();
    fetchProperties();
  }, [filters]);

  const fetchReports = async () => {
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
      
      // Calculate stats
      const totalReports = data.reports?.length || 0;
      const totalRevenue = data.reports?.reduce((sum: number, r: Report) => sum + r.total_revenue, 0) || 0;
      const totalProfit = data.reports?.reduce((sum: number, r: Report) => sum + r.net_profit, 0) || 0;
      
      setStats({
        totalReports,
        totalRevenue,
        totalProfit
      });
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await api.get('/financials/properties/');
      setProperties(response.data);
    } catch (err) {
      console.error("Error fetching properties:", err);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const payload: any = {
        report_type: reportType,
        year: selectedYear
      };
      
      if (reportType === 'monthly') {
        payload.month = selectedMonth;
      }
      
      if (selectedProperty && selectedProperty !== 'all') {
        payload.property_id = selectedProperty;
      }
      
      const response = await api.post('/reports/reports/generate/', payload);
      
      if (response.status === 201) {
        alert(`Report generated successfully!`);
        fetchReports();
      }
      
      setShowGenerateModal(false);
    } catch (err: any) {
      console.error("Error generating report:", err);
      alert(err.response?.data?.error || "Failed to generate report");
    } finally {
      setGenerating(false);
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

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#581c87]" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      {/* Header with Generate Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Generate and manage financial reports by property, month, or year</p>
        </div>
        <button 
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 bg-[#581c87] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#4c1d95] transition-all"
        >
          <Plus size={16} />
          Generate Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
            <FileText size={20} className="text-blue-600" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Total Reports</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalReports}</h3>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
            <DollarSign size={20} className="text-green-600" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Total Revenue</p>
          <h3 className="text-2xl font-bold text-green-600 mt-1">{stats.totalRevenue.toLocaleString()} DH</h3>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
            <TrendingUp size={20} className="text-purple-600" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Total Profit</p>
          <h3 className="text-2xl font-bold text-purple-600 mt-1">{stats.totalProfit.toLocaleString()} DH</h3>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Property</label>
            <select
              value={filters.property_id}
              onChange={(e) => handleFilterChange('property_id', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#581c87] focus:ring-1 focus:ring-[#581c87]"
            >
              <option value="">All Properties</option>
              <option value="all">All Properties (Combined)</option>
              {properties.map(prop => (
                <option key={prop.id} value={prop.id}>{prop.name}</option>
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
                    <span className="flex items-center gap-1">
                      <DollarSign size={14} /> Revenue: {report.total_revenue.toLocaleString()} DH
                    </span>
                    <span className="flex items-center gap-1 text-red-500">
                      Expenses: {report.total_expenses.toLocaleString()} DH
                    </span>
                    <span className="flex items-center gap-1 text-green-600">
                      Profit: {report.net_profit.toLocaleString()} DH
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDownloadReport(report.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#581c87] text-white rounded-lg text-sm font-medium hover:bg-[#4c1d95] transition-all"
                  >
                    <Download size={14} />
                    Download
                  </button>
                  <button 
                    onClick={() => {
                      setReportToDelete(report.id);
                      setShowDeleteConfirm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all"
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

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Generate Report</h2>
                <p className="text-sm text-gray-500">Create a new financial report</p>
              </div>
              <button onClick={() => setShowGenerateModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Property</label>
                <select
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#581c87] focus:ring-1 focus:ring-[#581c87]"
                >
                  <option value="">All Properties (Combined)</option>
                  <option value="all">All Properties (Separate)</option>
                  {properties.map(prop => (
                    <option key={prop.id} value={prop.id}>{prop.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Report Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="monthly"
                      checked={reportType === 'monthly'}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-4 h-4 text-[#581c87]"
                    />
                    <span className="text-sm">Monthly</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="yearly"
                      checked={reportType === 'yearly'}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-4 h-4 text-[#581c87]"
                    />
                    <span className="text-sm">Yearly</span>
                  </label>
                </div>
              </div>

              {reportType === 'monthly' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Month</label>
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
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Year</label>
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

              {reportType === 'yearly' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Year</label>
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
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={generating}
                className="flex-1 px-4 py-2 rounded-lg bg-[#581c87] text-white hover:bg-[#4c1d95] transition-all text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {generating && <Loader2 size={16} className="animate-spin" />}
                {generating ? "Generating..." : "Generate Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}