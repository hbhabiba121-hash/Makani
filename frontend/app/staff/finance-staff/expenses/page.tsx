"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  Plus, X, Upload, ChevronDown, Loader2, FileText, Edit, Trash2, 
  Search, Filter, Download, DollarSign, TrendingUp, Receipt, 
  ChevronLeft, ChevronRight, Calendar, Building2, PieChart,
  ArrowUpRight, Clock, CreditCard, Home, Wifi, Zap, Brush, Package,
  MoreHorizontal, AlertCircle
} from "lucide-react";
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

const ITEMS_PER_PAGE = 8;
const categories = [
  { id: "Cleaning", name: "Cleaning", icon: Brush, color: "#3b82f6", bg: "#dbeafe" },
  { id: "WiFi", name: "WiFi", icon: Wifi, color: "#7c3aed", bg: "#ede9fe" },
  { id: "Electricity", name: "Electricity", icon: Zap, color: "#f59e0b", bg: "#fef3c7" },
  { id: "Maintenance", name: "Maintenance", icon: Home, color: "#ef4444", bg: "#fee2e2" },
  { id: "Supplies", name: "Supplies", icon: Package, color: "#10b981", bg: "#d1fae5" },
  { id: "Other", name: "Other", icon: MoreHorizontal, color: "#64748b", bg: "#f1f5f9" },
];

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  Cleaning: { bg: "bg-[#dbeafe]", text: "text-[#3b82f6]", border: "border-[#3b82f6]" },
  WiFi: { bg: "bg-[#ede9fe]", text: "text-[#7c3aed]", border: "border-[#7c3aed]" },
  Electricity: { bg: "bg-[#fef3c7]", text: "text-[#f59e0b]", border: "border-[#f59e0b]" },
  Maintenance: { bg: "bg-[#fee2e2]", text: "text-[#ef4444]", border: "border-[#ef4444]" },
  Supplies: { bg: "bg-[#d1fae5]", text: "text-[#10b981]", border: "border-[#10b981]" },
  Other: { bg: "bg-[#f1f5f9]", text: "text-[#64748b]", border: "border-[#64748b]" },
};

export default function ExpensesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  const [formData, setFormData] = useState({
    property_id: "",
    category: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    amount: "",
    receipt: null as File | null,
  });
  
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
    setCurrentPage(1);
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
      alert("Veuillez remplir tous les champs obligatoires");
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
      alert("Échec de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette dépense ?")) {
      try {
        await api.delete(`/financials/expenses/${id}/`);
        fetchExpenses();
      } catch (err) {
        console.error("Error deleting expense:", err);
        alert("Échec de la suppression");
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

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchesSearch = exp.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            exp.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [expenses, searchTerm]);

  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredExpenses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredExpenses, currentPage]);

  const inputClass = "w-full p-2.5 rounded-xl border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] text-[#334155] bg-[#f8fafc] focus:bg-white transition-all text-[13px] font-medium";

  const statsCards = [
    { label: "Total Dépenses", value: `${stats.totalExpenses.toLocaleString()} DH`, icon: DollarSign, accent: "#ef4444", trend: "+12%", trendUp: true },
    { label: "Catégorie Top", value: stats.topCategory, icon: TrendingUp, accent: "#8b5cf6", sub: "Plus de dépenses" },
    { label: "Avec Reçu", value: stats.withReceipts, icon: FileText, accent: "#10b981", sub: `${Math.round((stats.withReceipts / (stats.totalRecords || 1)) * 100)}% des dépenses` },
    { label: "Moyenne", value: `${stats.totalRecords > 0 ? Math.round(stats.totalExpenses / stats.totalRecords).toLocaleString() : 0} DH`, icon: CreditCard, accent: "#f59e0b", sub: "Par dépense" },
  ];

  // Top properties by expenses
  const topProperties = useMemo(() => {
    const propStats: Record<string, { total: number; count: number }> = {};
    expenses.forEach(exp => {
      if (!propStats[exp.property_name]) {
        propStats[exp.property_name] = { total: 0, count: 0 };
      }
      propStats[exp.property_name].total += parseFloat(exp.amount);
      propStats[exp.property_name].count += 1;
    });
    return Object.entries(propStats)
      .map(([name, data]) => ({ name, total: data.total, count: data.count }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
  }, [expenses]);

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
          {filteredExpenses.length} résultat{filteredExpenses.length > 1 ? 's' : ''} • Page {currentPage} / {totalPages}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]">
      <div className="p-6 max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="relative mb-8">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#10b981]/5 rounded-full blur-3xl -z-10"></div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-[1.75rem] font-bold bg-gradient-to-r from-[#111827] to-[#10b981] bg-clip-text text-transparent tracking-tight">
                Gestion des Dépenses
              </h1>
              <p className="text-[0.875rem] text-[#64748b] mt-1">Suivez et gérez toutes les dépenses de vos propriétés</p>
            </div>
            <button
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="flex items-center gap-2 bg-gradient-to-r from-[#10b981] to-[#059669] text-white px-5 py-2.5 rounded-xl text-[13px] font-semibold hover:shadow-lg transition-all duration-300"
            >
              <Plus size={16} />
              Ajouter une dépense
            </button>
          </div>
        </div>

        {/* Stats Cards */}
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
          {/* Category Breakdown */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-[#1e293b] text-[15px]">Répartition par catégorie</h2>
                <p className="text-[11px] text-[#94a3b8] mt-0.5">Dépenses par catégorie</p>
              </div>
              <PieChart size={18} className="text-[#94a3b8]" />
            </div>
            <div className="space-y-4">
              {categories.map(cat => {
                const amount = stats.categoryBreakdown[cat.name] || 0;
                const percentage = stats.totalExpenses > 0 ? (amount / stats.totalExpenses) * 100 : 0;
                const colors = categoryColors[cat.name] || categoryColors.Other;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(selectedCategory === cat.name ? "" : cat.name)}
                    className="w-full group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className={colors.text} />
                        <span className="text-[12px] font-medium text-[#334155]">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-[#1e293b]">{amount.toLocaleString()} DH</span>
                        <span className="text-[10px] text-[#94a3b8] w-12 text-right">{percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                        style={{ width: `${percentage}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Top Properties by Expenses */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-[#1e293b] text-[15px]">Top Dépenses par Bien</h2>
                <p className="text-[11px] text-[#94a3b8] mt-0.5">Biens avec le plus de dépenses</p>
              </div>
              <Building2 size={18} className="text-[#94a3b8]" />
            </div>
            <div className="space-y-3">
              {topProperties.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt size={32} className="mx-auto text-[#cbd5e1] mb-2" />
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
                        <p className="text-[10px] text-[#94a3b8]">{prop.count} dépenses</p>
                      </div>
                    </div>
                    <p className="text-[13px] font-bold text-[#ef4444]">{prop.total.toLocaleString()} DH</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input 
                type="text" 
                placeholder="Rechercher un bien ou une description..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-9 pr-3 py-2.5 bg-[#fafbfc] border border-[#e2e8f0] rounded-xl text-[13px] text-[#334155] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" 
              />
            </div>
            <div className="relative sm:w-56">
              <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <select 
                value={selectedProperty} 
                onChange={(e) => setSelectedProperty(e.target.value)} 
                className="w-full pl-9 pr-8 py-2.5 bg-[#fafbfc] border border-[#e2e8f0] rounded-xl text-[13px] text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] appearance-none cursor-pointer"
              >
                <option value="">Tous les biens</option>
                {properties.map(prop => (
                  <option key={prop.id} value={prop.id}>{prop.name}</option>
                ))}
              </select>
            </div>
            <div className="relative sm:w-56">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)} 
                className="w-full pl-9 pr-8 py-2.5 bg-[#fafbfc] border border-[#e2e8f0] rounded-xl text-[13px] text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] appearance-none cursor-pointer"
              >
                <option value="">Toutes catégories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-[#fafbfc] border border-[#e2e8f0] text-[#334155] rounded-xl text-[12px] font-medium hover:bg-[#f1f5f9] transition-all">
              <Download size={14} />
              Exporter
            </button>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-gradient-to-r from-[#fafbfc] to-[#f8fafc]">
                  <th className="text-left px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Bien</th>
                  <th className="text-left px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider hidden sm:table-cell">Catégorie</th>
                  <th className="text-left px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider hidden md:table-cell">Description</th>
                  <th className="text-left px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider hidden lg:table-cell">Date</th>
                  <th className="text-right px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Montant</th>
                  <th className="text-center px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Reçu</th>
                  <th className="text-center px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {loadingExpenses ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="w-12 h-12 rounded-full bg-[#f1f5f9] flex items-center justify-center mx-auto mb-3">
                        <Loader2 className="animate-spin text-[#10b981]" size={20} />
                      </div>
                      <p className="text-[#64748b] text-[13px]">Chargement...</p>
                    </td>
                  </tr>
                ) : paginatedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="w-16 h-16 rounded-full bg-[#f1f5f9] flex items-center justify-center mx-auto mb-3">
                        <Receipt size={24} className="text-[#94a3b8]" />
                      </div>
                      <p className="text-[#94a3b8] text-[13px] font-medium">
                        {filteredExpenses.length === 0 ? "Aucune dépense trouvée" : "Aucune donnée sur cette page"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedExpenses.map((exp) => {
                    const colors = categoryColors[exp.category] || categoryColors.Other;
                    const CategoryIcon = categories.find(c => c.name === exp.category)?.icon || MoreHorizontal;
                    return (
                      <tr key={exp.id} className="hover:bg-[#fafbfc] transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#f1f5f9] flex items-center justify-center group-hover:bg-[#e2e8f0] transition-colors">
                              <Building2 size={13} className="text-[#64748b]" />
                            </div>
                            <span className="font-medium text-[#1e293b] text-[13px] truncate max-w-[150px]" title={exp.property_name}>
                              {exp.property_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            <CategoryIcon size={11} className={colors.text} />
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                              {exp.category}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <span className="text-[12px] text-[#64748b] truncate max-w-[200px] block" title={exp.description}>
                            {exp.description || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 text-[12px] text-[#64748b]">
                            <Calendar size={12} />
                            <span>{new Date(exp.date).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-bold text-[#ef4444] text-[13px] whitespace-nowrap">
                            {parseFloat(exp.amount).toLocaleString()} DH
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {exp.has_receipt ? (
                            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                              <FileText size={10} /> Oui
                            </span>
                          ) : (
                            <span className="text-[#94a3b8] text-[11px]">Non</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              onClick={() => handleEdit(exp)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"
                              title="Modifier"
                            >
                              <Edit size={13} />
                            </button>
                            <button 
                              onClick={() => handleDelete(exp.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          <PaginationControls />
        </div>
      </div>

      {/* Add/Edit Expense Modal - Modern */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all">
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#10b981] to-[#059669] rounded-t-2xl"></div>
              <div className="sticky top-0 bg-white border-b border-[#f1f5f9] px-6 py-5 flex justify-between items-center">
                <div>
                  <h2 className="text-[18px] font-bold bg-gradient-to-r from-[#111827] to-[#10b981] bg-clip-text text-transparent">
                    {editingExpense ? 'Modifier' : 'Ajouter'} une dépense
                  </h2>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5">{editingExpense ? 'Mettre à jour' : 'Nouvel enregistrement'}</p>
                </div>
                <button onClick={resetForm} className="text-[#94a3b8] hover:text-[#334155] transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9]">
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">Bien *</label>
                <select 
                  value={formData.property_id}
                  onChange={(e) => setFormData({...formData, property_id: e.target.value})}
                  className={`${inputClass} bg-white`}
                  required
                >
                  <option value="">Sélectionner un bien</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">Montant (DH) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00" 
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">Date *</label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">Catégorie *</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className={`${inputClass} bg-white`}
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Décrire la dépense..." 
                  rows={3} 
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">Reçu (optionnel)</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer bg-gradient-to-r from-[#fafbfc] to-[#f8fafc] border border-[#e2e8f0] hover:border-[#10b981] text-[#334155] text-[12px] font-medium px-4 py-2 rounded-xl transition-all flex items-center gap-2">
                    <Upload size={14} />
                    Choisir un fichier
                    <input 
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setFormData({...formData, receipt: e.target.files?.[0] || null})}
                      className="hidden"
                    />
                  </label>
                  {formData.receipt && (
                    <span className="text-[11px] text-[#10b981] truncate flex-1">{formData.receipt.name}</span>
                  )}
                  {!formData.receipt && !editingExpense?.has_receipt && (
                    <span className="text-[11px] text-[#94a3b8]">Aucun fichier</span>
                  )}
                  {editingExpense?.has_receipt && !formData.receipt && (
                    <span className="text-[11px] text-[#64748b]">Reçu existant conservé</span>
                  )}
                </div>
                <p className="text-[10px] text-[#94a3b8] mt-1.5">PDF, PNG, JPG (max 10MB)</p>
              </div>

              <div className="flex gap-3 pt-5 border-t border-[#f1f5f9]">
                <button 
                  type="button"
                  onClick={resetForm} 
                  className="flex-1 py-2.5 rounded-xl border border-[#e2e8f0] text-[#64748b] font-semibold hover:bg-[#fafbfc] transition-all text-[13px]"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 className="animate-spin" size={16} />}
                  {submitting ? "Enregistrement..." : (editingExpense ? "Mettre à jour" : "Ajouter")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}