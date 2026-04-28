"use client";

import { useEffect, useState } from "react";
import { Plus, X, Upload, ChevronDown, Loader2, FileText, Edit, Trash2, Search, Filter, Download, DollarSign, TrendingUp, Receipt } from "lucide-react";
import api from "@/lib/axios";

interface Property {
  id: number;
  name: string;
}

interface Expense {
  id: number;
  property: number;
  property_name: string;
  category: string;
  description: string;
  date: string;
  amount: string;
  has_receipt: boolean;
  receipt_url?: string;
}

export default function ExpensesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter states
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    property_id: "",
    category: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    amount: "",
    receipt: null as File | null,
  });
  
  const categories = ["Cleaning", "WiFi", "Electricity", "Maintenance", "Supplies", "Other"];
  const [stats, setStats] = useState({
    totalExpenses: 0,
    topCategory: "N/A",
    totalRecords: 0,
    withReceipts: 0,
    categoryBreakdown: {} as Record<string, number>
  });

  useEffect(() => {
    fetchProperties();
    fetchExpenses();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [selectedProperty, selectedCategory]);

  const fetchProperties = async () => {
    try {
      const res = await api.get("/financials/properties/");
      const data = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      setProperties(data);
    } catch (err) {
      console.error("Error fetching properties:", err);
    } finally {
      setLoadingProps(false);
    }
  };

  const fetchExpenses = async () => {
    setLoadingExpenses(true);
    try {
      const params: any = {};
      if (selectedProperty) params.property_id = selectedProperty;
      if (selectedCategory) params.category = selectedCategory;
      
      const res = await api.get("/financials/expenses/", { params });
      const expensesData = res.data;
      setExpenses(expensesData);
      calculateStats(expensesData);
    } catch (err) {
      console.error("Error fetching expenses:", err);
    } finally {
      setLoadingExpenses(false);
    }
  };

  const calculateStats = (expensesData: Expense[]) => {
    const total = expensesData.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const categoryTotals: Record<string, number> = {};
    
    expensesData.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + parseFloat(exp.amount);
    });
    
    let topCat = "N/A";
    let maxAmount = 0;
    Object.entries(categoryTotals).forEach(([cat, amount]) => {
      if (amount > maxAmount) {
        maxAmount = amount;
        topCat = cat;
      }
    });
    
    setStats({
      totalExpenses: total,
      topCategory: topCat,
      totalRecords: expensesData.length,
      withReceipts: expensesData.filter(exp => exp.has_receipt).length,
      categoryBreakdown: categoryTotals
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.property_id || !formData.category || !formData.amount) {
      alert("Please fill in all required fields");
      return;
    }
    
    setSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append("property_id", formData.property_id);
      submitData.append("category", formData.category);
      submitData.append("description", formData.description);
      submitData.append("date", formData.date);
      submitData.append("amount", formData.amount);
      if (formData.receipt) {
        submitData.append("receipt", formData.receipt);
      }
      
      if (editingExpense) {
        await api.put(`/financials/expenses/${editingExpense.id}/`, submitData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/financials/expenses/", submitData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      
      resetForm();
      fetchExpenses();
    } catch (err) {
      console.error("Error saving expense:", err);
      alert("Failed to save expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      try {
        await api.delete(`/financials/expenses/${id}/`);
        fetchExpenses();
      } catch (err) {
        console.error("Error deleting expense:", err);
        alert("Failed to delete expense");
      }
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      property_id: String(expense.property),
      category: expense.category,
      description: expense.description,
      date: expense.date,
      amount: expense.amount,
      receipt: null,
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      property_id: "",
      category: "",
      description: "",
      date: new Date().toISOString().split('T')[0],
      amount: "",
      receipt: null,
    });
    setEditingExpense(null);
    setIsModalOpen(false);
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          exp.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalExpensesDH = stats.totalExpenses.toLocaleString();

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">Expense Management</h1>
          <p className="text-slate-500 mt-1 text-sm">Track and manage all property expenses</p>
        </div>

        <button 
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-[#581c87] hover:bg-[#4c1d95] text-white px-5 py-2.5 rounded-xl transition-all font-semibold shadow-sm"
        >
          <Plus size={20} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <DollarSign size={20} className="text-red-600" />
            </div>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">+12.5%</span>
          </div>
          <p className="text-xs text-gray-500 font-medium">Total Expenses</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalExpensesDH} DH</h3>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
            <TrendingUp size={20} className="text-purple-600" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Top Category</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.topCategory}</h3>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
            <Receipt size={20} className="text-blue-600" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Total Records</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalRecords}</h3>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
            <FileText size={20} className="text-green-600" />
          </div>
          <p className="text-xs text-gray-500 font-medium">With Receipts</p>
          <h3 className="text-2xl font-bold text-green-600 mt-1">{stats.withReceipts}</h3>
        </div>
      </div>

      {/* Expense Breakdown by Category */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Expense Breakdown by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
          {categories.map(cat => {
            const amount = stats.categoryBreakdown[cat] || 0;
            const colors: Record<string, string> = {
              Cleaning: "bg-blue-50 text-blue-600",
              WiFi: "bg-purple-50 text-purple-600",
              Electricity: "bg-yellow-50 text-yellow-600",
              Maintenance: "bg-red-50 text-red-600",
              Supplies: "bg-green-50 text-green-600",
              Other: "bg-gray-50 text-gray-600",
            };
            return (
              <div key={cat} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                <span className={`${colors[cat] || "bg-gray-50 text-gray-600"} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block`}>
                  {cat}
                </span>
                <h4 className="text-xl font-bold text-gray-800 mt-3">{amount.toLocaleString()} DH</h4>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search properties, descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#581c87]/20 focus:border-[#581c87]"
          />
        </div>
        <div className="relative min-w-[180px]">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#581c87]/20 focus:border-[#581c87] appearance-none bg-white cursor-pointer"
          >
            <option value="">All Properties</option>
            {properties.map(prop => (
              <option key={prop.id} value={prop.id}>{prop.name}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative min-w-[180px]">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#581c87]/20 focus:border-[#581c87] appearance-none bg-white cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all">
          <Download size={16} />
          Export
        </button>
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Receipt</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loadingExpenses ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-[#581c87]" size={32} />
                    <p className="text-gray-400 mt-2">Loading expenses...</p>
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-gray-400 italic">
                    No expenses found
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{exp.property_name}</td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{exp.description}</td>
                    <td className="px-6 py-4 text-gray-600">{exp.date}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">{parseFloat(exp.amount).toLocaleString()} DH</td>
                    <td className="px-6 py-4">
                      {exp.has_receipt ? (
                        <span className="flex items-center gap-1 text-green-600 bg-green-50 w-fit px-2 py-1 rounded text-xs font-medium">
                          <FileText size={12} /> Yes
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs font-medium px-2 py-1 bg-gray-50 rounded">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleEdit(exp)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(exp.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Expense Modal - SHORT VERSION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingExpense ? "Edit Expense" : "Add Expense"}
                </h2>
              </div>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Property */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Property *</label>
                <select 
                  value={formData.property_id}
                  onChange={(e) => setFormData({...formData, property_id: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#581c87] focus:ring-1 focus:ring-[#581c87]"
                  required
                >
                  <option value="">Select property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (DH) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00" 
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#581c87] focus:ring-1 focus:ring-[#581c87]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date *</label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#581c87] focus:ring-1 focus:ring-[#581c87]"
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#581c87] focus:ring-1 focus:ring-[#581c87]"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe the expense..." 
                  rows={2} 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#581c87] focus:ring-1 focus:ring-[#581c87] resize-none"
                />
              </div>

              {/* Receipt Upload - Simplified */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Receipt</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-all">
                    Choose File
                    <input 
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setFormData({...formData, receipt: e.target.files?.[0] || null})}
                      className="hidden"
                    />
                  </label>
                  {formData.receipt && (
                    <span className="text-xs text-green-600 truncate flex-1">{formData.receipt.name}</span>
                  )}
                  {!formData.receipt && (
                    <span className="text-xs text-gray-400">No file chosen</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG (max 10MB)</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-3">
                <button 
                  type="button"
                  onClick={resetForm} 
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 font-semibold text-gray-700 hover:bg-gray-50 transition-all text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 rounded-lg bg-[#581c87] text-white font-semibold hover:bg-[#4c1d95] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitting ? "Saving..." : (editingExpense ? "Update" : "Add")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}