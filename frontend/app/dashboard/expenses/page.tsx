"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  Plus, X, Upload, ChevronDown, Loader2, FileText, Edit, Trash2, 
  Search, Filter, Download, DollarSign, TrendingUp, Receipt, 
  ChevronLeft, ChevronRight, Calendar, Building2
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

const ITEMS_PER_PAGE = 10;
const categories = ["Cleaning", "WiFi", "Electricity", "Maintenance", "Supplies", "Other"];

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  Cleaning: { bg: "bg-[#dbeafe]", text: "text-[#3b82f6]", border: "border-[#3b82f6]" },
  WiFi: { bg: "bg-[#ede9fe]", text: "text-[#7c3aed]", border: "border-[#7c3aed]" },
  Electricity: { bg: "bg-[#fef3c7]", text: "text-[#f59e0b]", border: "border-[#f59e0b]" },
  Maintenance: { bg: "bg-[#fee2e2]", text: "text-[#ef4444]", border: "border-[#ef4444]" },
  Supplies: { bg: "bg-[#d1fae5]", text: "text-[#10b981]", border: "border-[#10b981]" },
  Other: { bg: "bg-[#f1f5f9]", text: "text-[#64748b]", border: "border-[#94a3b8]" },
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
  
  // Filter states
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  
  // Form state
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

  // Filter expenses by search term
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchesSearch = exp.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            exp.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [expenses, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredExpenses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredExpenses, currentPage]);

  const inputClass = "w-full p-2.5 rounded-lg border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] text-[#334155] bg-[#f8fafc] focus:bg-white transition-all text-[13px] font-medium";

  const statsCards = [
    { label: "Total Dépenses", value: `${stats.totalExpenses.toLocaleString()} DH`, icon: DollarSign, accent: "#ef4444", sub: `${stats.totalRecords} enregistrements` },
    { label: "Catégorie Top", value: stats.topCategory, icon: TrendingUp, accent: "#6366f1", sub: "Plus de dépenses" },
    { label: "Avec Reçu", value: stats.withReceipts, icon: FileText, accent: "#10b981", sub: "Documents joints" },
    { label: "Moyenne", value: `${stats.totalRecords > 0 ? Math.round(stats.totalExpenses / stats.totalRecords).toLocaleString() : 0} DH`, icon: Receipt, accent: "#f59e0b", sub: "Par dépense" },
  ];

  // Pagination Controls Component
  const PaginationControls = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-[#f1f5f9] bg-[#f8fafc]">
        <p className="text-[11px] text-[#94a3b8]">
          {filteredExpenses.length} résultat{filteredExpenses.length > 1 ? 's' : ''} • Page {currentPage} / {totalPages}
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

  return (
    <div className="min-h-screen bg-[#f4f7f6]">
      <div className="p-4 max-w-[1280px] mx-auto">

        {/* Action Button */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center gap-1.5 bg-[#10b981] text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#059669] transition-all shadow-[0_1px_2px_rgba(16,185,129,0.25)]"
          >
            <Plus size={14} />
            Ajouter
          </button>
        </div>

        {/* Stats Cards */}
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

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 mb-4">
          <h2 className="font-bold text-[#1e293b] text-[14px] mb-3">Répartition par catégorie</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {categories.map(cat => {
              const amount = stats.categoryBreakdown[cat] || 0;
              const colors = categoryColors[cat] || categoryColors.Other;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? "" : cat)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    selectedCategory === cat 
                      ? `${colors.bg} ${colors.border} border-2` 
                      : "bg-[#f8fafc] border-[#e2e8f0] hover:border-[#10b981]"
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
                    {cat}
                  </span>
                  <p className="text-[16px] font-bold text-[#1e293b] mt-1">{amount.toLocaleString()} DH</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input 
                type="text" 
                placeholder="Rechercher un bien ou une description..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-9 pr-3 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[13px] text-[#334155] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" 
              />
            </div>
            <div className="relative sm:w-48">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <select 
                value={selectedProperty} 
                onChange={(e) => setSelectedProperty(e.target.value)} 
                className="w-full pl-9 pr-8 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[13px] text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] appearance-none cursor-pointer"
              >
                <option value="">Tous les biens</option>
                {properties.map(prop => (
                  <option key={prop.id} value={prop.id}>{prop.name}</option>
                ))}
              </select>
            </div>
            <div className="relative sm:w-48">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)} 
                className="w-full pl-9 pr-8 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[13px] text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] appearance-none cursor-pointer"
              >
                <option value="">Toutes catégories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] text-[#334155] rounded-lg text-[12px] font-medium hover:bg-[#f1f5f9] transition-all">
              <Download size={14} />
              Exporter
            </button>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e2e8f0]">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Bien</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider hidden sm:table-cell">Catégorie</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider hidden md:table-cell">Description</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider hidden lg:table-cell">Date</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Montant</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Reçu</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {loadingExpenses ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Loader2 className="animate-spin text-[#10b981] mx-auto mb-2" size={24} />
                      <p className="text-[#64748b] text-[13px]">Chargement...</p>
                    </td>
                  </tr>
                ) : paginatedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-[#94a3b8] text-[13px]">
                      {filteredExpenses.length === 0 ? "Aucune dépense trouvée" : "Aucune donnée sur cette page"}
                    </td>
                  </tr>
                ) : (
                  paginatedExpenses.map((exp) => {
                    const colors = categoryColors[exp.category] || categoryColors.Other;
                    return (
                      <tr key={exp.id} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Building2 size={14} className="text-[#94a3b8] flex-shrink-0" />
                            <span className="font-medium text-[#1e293b] text-[13px] truncate max-w-[120px]" title={exp.property_name}>
                              {exp.property_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${colors.bg} ${colors.text}`}>
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-[12px] text-[#64748b] truncate max-w-[150px] block" title={exp.description}>
                            {exp.description || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 text-[12px] text-[#64748b]">
                            <Calendar size={12} />
                            <span>{new Date(exp.date).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-[#ef4444] text-[13px] whitespace-nowrap">
                            {parseFloat(exp.amount).toLocaleString()} DH
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {exp.has_receipt ? (
                            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                              <FileText size={10} /> Oui
                            </span>
                          ) : (
                            <span className="text-[#94a3b8] text-[11px]">Non</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              onClick={() => handleEdit(exp)}
                              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f1f5f9] text-[#64748b] transition-colors"
                              title="Modifier"
                            >
                              <Edit size={13} />
                            </button>
                            <button 
                              onClick={() => handleDelete(exp.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#fef2f2] text-[#ef4444] transition-colors"
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
          
          {/* Pagination Controls */}
          <PaginationControls />
        </div>

      </div>

      {/* Add/Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#f1f5f9] px-5 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-[16px] font-bold text-[#1e293b]">{editingExpense ? 'Modifier' : 'Ajouter'} une dépense</h2>
                <p className="text-[12px] text-[#94a3b8] mt-0.5">{editingExpense ? 'Mettre à jour' : 'Nouvel enregistrement'}</p>
              </div>
              <button onClick={resetForm} className="text-[#94a3b8] hover:text-[#334155] transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              {/* Property */}
              <div>
                <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Bien *</label>
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

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Montant (DH) *</label>
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
                  <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Date *</label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Catégorie *</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className={`${inputClass} bg-white`}
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Décrire la dépense..." 
                  rows={2} 
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Receipt Upload */}
              <div>
                <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Reçu (optionnel)</label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#10b981] text-[#334155] text-[12px] font-medium px-3 py-2 rounded-lg transition-all flex items-center gap-1.5">
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
                <p className="text-[10px] text-[#94a3b8] mt-1">PDF, PNG, JPG (max 10MB)</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-2.5 pt-4 border-t border-[#f1f5f9]">
                <button 
                  type="button"
                  onClick={resetForm} 
                  className="flex-1 py-2.5 rounded-lg border border-[#e2e8f0] text-[#64748b] font-semibold hover:bg-[#f8fafc] transition-all text-[13px]"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-[#10b981] text-white font-semibold hover:bg-[#059669] transition-all flex items-center justify-center gap-1.5 shadow-[0_1px_2px_rgba(16,185,129,0.25)] text-[13px] disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
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