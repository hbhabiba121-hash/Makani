"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, X, Upload, Loader2, FileText, Edit, Trash2, 
  Search, Filter, Download, DollarSign, TrendingUp, Receipt, 
  ChevronLeft, ChevronRight, Calendar, Building2, AlertCircle,
  Home, Wifi, Zap, Brush, Package, MoreHorizontal, RefreshCw
} from "lucide-react";
import api from "@/lib/axios";
import { useLang } from "@/app/components/contexts/LanguageContext";

const i18n = {
  fr: {
    title: "Gestion des Dépenses",
    subtitle: "Suivez et gérez toutes les dépenses de vos propriétés",
    addExpense: "Ajouter une dépense",
    editExpense: "Modifier la dépense",
    totalExpenses: "Total Dépenses",
    topCategory: "Catégorie Top",
    withReceipt: "Avec Reçu",
    average: "Moyenne",
    perExpense: "par dépense",
    records: "enregistrements",
    documents: "Documents joints",
    categoryBreakdown: "Répartition par catégorie",
    search: "Rechercher un bien ou une description...",
    allProperties: "Tous les biens",
    allCategories: "Toutes catégories",
    export: "Exporter",
    property: "Bien",
    category: "Catégorie",
    description: "Description",
    date: "Date",
    amount: "Montant",
    receipt: "Reçu",
    actions: "Actions",
    yes: "Oui",
    no: "Non",
    loading: "Chargement...",
    noData: "Aucune dépense trouvée",
    noDataOnPage: "Aucune donnée sur cette page",
    save: "Enregistrer",
    cancel: "Annuler",
    update: "Mettre à jour",
    add: "Ajouter",
    required: "Champ obligatoire",
    selectProperty: "Sélectionner un bien",
    selectCategory: "Sélectionner une catégorie",
    describeExpense: "Décrire la dépense...",
    receiptOptional: "Reçu (optionnel)",
    chooseFile: "Choisir un fichier",
    noFile: "Aucun fichier",
    receiptKept: "Reçu existant conservé",
    fileHint: "PDF, PNG, JPG (max 10MB)",
    deleteConfirm: "Êtes-vous sûr de vouloir supprimer cette dépense ?",
    result: "résultat",
    results: "résultats",
    page: "Page",
    of: "sur",
    previous: "Précédent",
    next: "Suivant",
    refresh: "Actualiser",
  },
  ar: {
    title: "إدارة المصروفات",
    subtitle: "تتبع وإدارة جميع مصروفات عقاراتك",
    addExpense: "إضافة مصروف",
    editExpense: "تعديل المصروف",
    totalExpenses: "إجمالي المصروفات",
    topCategory: "أعلى فئة",
    withReceipt: "مع إيصال",
    average: "المتوسط",
    perExpense: "لكل مصروف",
    records: "تسجيلات",
    documents: "مستندات مرفقة",
    categoryBreakdown: "توزيع الفئات",
    search: "بحث عن عقار أو وصف...",
    allProperties: "جميع العقارات",
    allCategories: "جميع الفئات",
    export: "تصدير",
    property: "العقار",
    category: "الفئة",
    description: "الوصف",
    date: "التاريخ",
    amount: "المبلغ",
    receipt: "الإيصال",
    actions: "إجراءات",
    yes: "نعم",
    no: "لا",
    loading: "جارٍ التحميل...",
    noData: "لم يتم العثور على مصروفات",
    noDataOnPage: "لا توجد بيانات في هذه الصفحة",
    save: "حفظ",
    cancel: "إلغاء",
    update: "تحديث",
    add: "إضافة",
    required: "حقل إجباري",
    selectProperty: "اختر عقاراً",
    selectCategory: "اختر فئة",
    describeExpense: "وصف المصروف...",
    receiptOptional: "إيصال (اختياري)",
    chooseFile: "اختر ملفاً",
    noFile: "لا يوجد ملف",
    receiptKept: "الإيصال الحالي محفوظ",
    fileHint: "PDF, PNG, JPG (الحد الأقصى 10 ميغابايت)",
    deleteConfirm: "هل أنت متأكد من حذف هذا المصروف؟",
    result: "نتيجة",
    results: "نتائج",
    page: "صفحة",
    of: "من",
    previous: "السابق",
    next: "التالي",
    refresh: "تحديث",
  },
};

const categories = [
  { id: "Cleaning", name: "Cleaning", icon: Brush, color: "#3b82f6", bg: "#dbeafe" },
  { id: "WiFi", name: "WiFi", icon: Wifi, color: "#7c3aed", bg: "#ede9fe" },
  { id: "Electricity", name: "Electricity", icon: Zap, color: "#f59e0b", bg: "#fef3c7" },
  { id: "Maintenance", name: "Maintenance", icon: Home, color: "#ef4444", bg: "#fee2e2" },
  { id: "Supplies", name: "Supplies", icon: Package, color: "#10b981", bg: "#d1fae5" },
  { id: "Other", name: "Other", icon: MoreHorizontal, color: "#64748b", bg: "#f1f5f9" },
];

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  Cleaning: { bg: "bg-blue-100", text: "text-blue-600", border: "border-blue-600" },
  WiFi: { bg: "bg-purple-100", text: "text-purple-600", border: "border-purple-600" },
  Electricity: { bg: "bg-amber-100", text: "text-amber-600", border: "border-amber-600" },
  Maintenance: { bg: "bg-red-100", text: "text-red-600", border: "border-red-600" },
  Supplies: { bg: "bg-emerald-100", text: "text-emerald-600", border: "border-emerald-600" },
  Other: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-600" },
};

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
  receipt?: string | null;
}

const ITEMS_PER_PAGE = 10;

export default function ExpensesPage() {
  const router = useRouter();
  const { lang } = useLang();
  const tx = i18n[lang];
  const isRTL = lang === "ar";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  
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
    const token = localStorage.getItem("access");
    const role = localStorage.getItem("role");
    if (!token || role !== "property_staff") {
      router.push("/login");
      return;
    }
    fetchProperties();
    fetchExpenses();
  }, [router]);

  useEffect(() => {
    setCurrentPage(1);
    fetchExpenses();
  }, [selectedProperty, selectedCategory]);

  const fetchProperties = async () => {
    try {
      setLoadingProps(true);
      const res = await api.get("/financials/properties/");
      const data = Array.isArray(res.data) ? res.data : [];
      setProperties(data);
    } catch (err: any) {
      console.error("Error fetching properties:", err);
      setError(err.response?.data?.error || "Failed to load properties");
    } finally {
      setLoadingProps(false);
    }
  };

  const fetchExpenses = async () => {
    setLoadingExpenses(true);
    setError(null);
    try {
      const params: any = {};
      if (selectedProperty) params.property_id = selectedProperty;
      if (selectedCategory) params.category = selectedCategory;
      
      const res = await api.get("/financials/expenses/", { params });
      
      let expensesList = Array.isArray(res.data) ? res.data : [];
      
      const mappedExpenses = expensesList.map((exp: any) => ({
        id: exp.id,
        property: exp.property,
        property_name: exp.property_name || exp.property?.name || `Property ${exp.property}`,
        category: exp.category,
        description: exp.description || "",
        date: exp.date,
        amount: exp.amount,
        has_receipt: exp.has_receipt || false,
        receipt: exp.receipt || null
      }));
      
      setExpenses(mappedExpenses);
      calculateStats(mappedExpenses);
    } catch (err: any) {
      console.error("Error fetching expenses:", err);
      setError(err.response?.data?.error || "Failed to load expenses");
    } finally {
      setLoadingExpenses(false);
    }
  };

  const calculateStats = (expensesData: Expense[]) => {
    const total = expensesData.reduce((sum, exp) => sum + parseFloat(exp.amount || "0"), 0);
    const categoryTotals: Record<string, number> = {};
    
    expensesData.forEach(exp => {
      if (exp.category) {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + parseFloat(exp.amount || "0");
      }
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
      alert(tx.required);
      return;
    }
    
    setSubmitting(true);
    try {
      if (editingExpense) {
        const updateData = {
          property_id: parseInt(formData.property_id),
          category: formData.category,
          description: formData.description,
          date: formData.date,
          amount: parseFloat(formData.amount),
        };
        
        await api.put(`/financials/expenses/${editingExpense.id}/`, updateData);
        
        if (formData.receipt) {
          const fileData = new FormData();
          fileData.append('receipt', formData.receipt);
          try {
            await api.post(`/financials/expenses/${editingExpense.id}/upload-receipt/`, fileData);
          } catch (fileErr) {
            console.warn("Could not upload receipt file:", fileErr);
          }
        }
      } else {
        const submitData = new FormData();
        submitData.append("property_id", formData.property_id);
        submitData.append("category", formData.category);
        submitData.append("description", formData.description);
        submitData.append("date", formData.date);
        submitData.append("amount", formData.amount);
        if (formData.receipt) {
          submitData.append("receipt", formData.receipt);
        }
        
        await api.post("/financials/expenses/", submitData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      
      resetForm();
      fetchExpenses();
    } catch (err: any) {
      console.error("Error saving expense:", err);
      alert(err.response?.data?.error || "Failed to save expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm(tx.deleteConfirm)) {
      try {
        await api.delete(`/financials/expenses/${id}/`);
        fetchExpenses();
      } catch (err: any) {
        console.error("Error deleting expense:", err);
        alert(err.response?.data?.error || "Failed to delete expense");
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
      const matchesSearch = (exp.property_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                            (exp.description?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [expenses, searchTerm]);

  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredExpenses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredExpenses, currentPage]);

  const inputClass = "w-full p-2.5 rounded-lg border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] text-[#334155] bg-[#f8fafc] focus:bg-white transition-all text-[13px] font-medium";

  const statsCards = [
    { label: tx.totalExpenses, value: `${stats.totalExpenses.toLocaleString()} DH`, icon: DollarSign, accent: "#ef4444", sub: `${stats.totalRecords} ${tx.records}` },
    { label: tx.topCategory, value: stats.topCategory, icon: TrendingUp, accent: "#8b5cf6", sub: tx.perExpense },
    { label: tx.withReceipt, value: stats.withReceipts, icon: FileText, accent: "#10b981", sub: tx.documents },
    { label: tx.average, value: `${stats.totalRecords > 0 ? Math.round(stats.totalExpenses / stats.totalRecords).toLocaleString() : 0} DH`, icon: Receipt, accent: "#f59e0b", sub: tx.perExpense },
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
      <div className="flex items-center justify-between px-4 py-3 border-t border-[#f1f5f9] bg-[#fafbfc]">
        <p className="text-[11px] text-[#94a3b8]">
          {filteredExpenses.length} {filteredExpenses.length > 1 ? tx.results : tx.result} • {tx.page} {currentPage} {tx.of} {totalPages}
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

  if (loadingExpenses && expenses.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]" dir={isRTL ? "rtl" : "ltr"}>
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-[1.75rem] font-bold text-[#111827] tracking-tight">{tx.title}</h1>
              <p className="text-[0.875rem] text-[#64748b] mt-1">{tx.subtitle}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchExpenses}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#e2e8f0] rounded-lg text-[13px] font-medium text-[#64748b] hover:bg-[#f8fafc] transition-all"
              >
                <RefreshCw size={14} className={loadingExpenses ? "animate-spin" : ""} />
                {tx.refresh}
              </button>
              <button
                onClick={() => { resetForm(); setIsModalOpen(true); }}
                className="flex items-center gap-1.5 bg-[#10b981] text-white px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-[#059669] transition-all shadow-sm"
              >
                <Plus size={16} />
                {tx.addExpense}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statsCards.map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#e2e8f0] p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-[#64748b] font-medium uppercase tracking-wider">{s.label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.accent + "12" }}>
                  <s.icon size={16} style={{ color: s.accent }} />
                </div>
              </div>
              <p className="text-[22px] font-bold text-[#1e293b] tracking-tight">{s.value}</p>
              <p className="text-[10px] text-[#94a3b8] mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Category Filters */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 mb-6">
          <h2 className="font-bold text-[#1e293b] text-[14px] mb-4">{tx.categoryBreakdown}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {categories.map(cat => {
              const amount = stats.categoryBreakdown[cat.name] || 0;
              const colors = categoryColors[cat.name] || categoryColors.Other;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === cat.name ? "" : cat.name)}
                  className={`p-3 rounded-xl border transition-all text-left ${
                    selectedCategory === cat.name 
                      ? `${colors.bg} ${colors.border} border-2` 
                      : "bg-[#fafbfc] border-[#e2e8f0] hover:border-[#10b981] hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={14} className={colors.text} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
                      {cat.name}
                    </span>
                  </div>
                  <p className="text-[15px] font-bold text-[#1e293b]">{amount.toLocaleString()} DH</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input 
                type="text" 
                placeholder={tx.search} 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-9 pr-3 py-2 bg-[#fafbfc] border border-[#e2e8f0] rounded-lg text-[13px] text-[#334155] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" 
              />
            </div>
            <div className="relative sm:w-56">
              <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <select 
                value={selectedProperty} 
                onChange={(e) => setSelectedProperty(e.target.value)} 
                className="w-full pl-9 pr-8 py-2 bg-[#fafbfc] border border-[#e2e8f0] rounded-lg text-[13px] text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] appearance-none cursor-pointer"
              >
                <option value="">{tx.allProperties}</option>
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
                className="w-full pl-9 pr-8 py-2 bg-[#fafbfc] border border-[#e2e8f0] rounded-lg text-[13px] text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] appearance-none cursor-pointer"
              >
                <option value="">{tx.allCategories}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => {
                if (filteredExpenses.length === 0) return;
                const data = filteredExpenses.map(exp => ({
                  Property: exp.property_name,
                  Category: exp.category,
                  Description: exp.description,
                  Date: exp.date,
                  Amount: exp.amount,
                  Has_Receipt: exp.has_receipt ? "Yes" : "No"
                }));
                const headers = Object.keys(data[0]);
                const csv = [
                  headers.join(","),
                  ...data.map(row => headers.map(h => JSON.stringify(row[h as keyof typeof row] || "")).join(","))
                ].join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#fafbfc] border border-[#e2e8f0] text-[#334155] rounded-lg text-[12px] font-medium hover:bg-[#f1f5f9] transition-all"
            >
              <Download size={14} />
              {tx.export}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500" />
              <p className="text-red-600 text-[13px]">{error}</p>
            </div>
          </div>
        )}

        {/* Expenses Table */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#fafbfc]">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{tx.property}</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider hidden sm:table-cell">{tx.category}</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider hidden md:table-cell">{tx.description}</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider hidden lg:table-cell">{tx.date}</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{tx.amount}</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{tx.receipt}</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{tx.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {loadingExpenses ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Loader2 className="animate-spin text-[#10b981] mx-auto mb-2" size={24} />
                      <p className="text-[#64748b] text-[13px]">{tx.loading}</p>
                    </td>
                  </tr>
                ) : paginatedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Receipt size={32} className="mx-auto mb-3 text-[#cbd5e1]" />
                      <p className="text-[#94a3b8] text-[13px]">
                        {searchTerm || selectedProperty || selectedCategory ? "Aucun résultat pour ces filtres" : tx.noData}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedExpenses.map((exp) => {
                    const colors = categoryColors[exp.category] || categoryColors.Other;
                    const CategoryIcon = categories.find(c => c.name === exp.category)?.icon || MoreHorizontal;
                    return (
                      <tr key={exp.id} className="hover:bg-[#fafbfc] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Building2 size={14} className="text-[#94a3b8] flex-shrink-0" />
                            <span className="font-medium text-[#1e293b] text-[13px] truncate max-w-[150px]" title={exp.property_name}>
                              {exp.property_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            <CategoryIcon size={11} className={colors.text} />
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                              {exp.category}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-[12px] text-[#64748b] truncate max-w-[200px] block" title={exp.description}>
                            {exp.description || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 text-[12px] text-[#64748b]">
                            <Calendar size={12} />
                            <span>{exp.date ? new Date(exp.date).toLocaleDateString('fr-FR') : '—'}</span>
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
                              <FileText size={10} /> {tx.yes}
                            </span>
                          ) : (
                            <span className="text-[#94a3b8] text-[11px]">{tx.no}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              onClick={() => handleEdit(exp)}
                              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f1f5f9] text-[#64748b] transition-colors"
                              title={tx.editExpense}
                            >
                              <Edit size={13} />
                            </button>
                            <button 
                              onClick={() => handleDelete(exp.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 text-red-500 transition-colors"
                              title={tx.delete}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#f1f5f9] px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-[16px] font-bold text-[#1e293b]">{editingExpense ? tx.editExpense : tx.addExpense}</h2>
                <p className="text-[11px] text-[#94a3b8] mt-0.5">{editingExpense ? tx.update : tx.add}</p>
              </div>
              <button onClick={resetForm} className="text-[#94a3b8] hover:text-[#334155] transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">{tx.property} *</label>
                <select 
                  value={formData.property_id}
                  onChange={(e) => setFormData({...formData, property_id: e.target.value})}
                  className={`${inputClass} bg-white`}
                  required
                >
                  <option value="">{tx.selectProperty}</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">{tx.amount} *</label>
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
                  <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">{tx.date} *</label>
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
                <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">{tx.category} *</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className={`${inputClass} bg-white`}
                  required
                >
                  <option value="">{tx.selectCategory}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">{tx.description}</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder={tx.describeExpense} 
                  rows={3} 
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">{tx.receiptOptional}</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer bg-[#fafbfc] border border-[#e2e8f0] hover:border-[#10b981] text-[#334155] text-[12px] font-medium px-3 py-2 rounded-lg transition-all flex items-center gap-1.5">
                    <Upload size={14} />
                    {tx.chooseFile}
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
                    <span className="text-[11px] text-[#94a3b8]">{tx.noFile}</span>
                  )}
                  {editingExpense?.has_receipt && !formData.receipt && (
                    <span className="text-[11px] text-[#64748b]">{tx.receiptKept}</span>
                  )}
                </div>
                <p className="text-[10px] text-[#94a3b8] mt-1.5">{tx.fileHint}</p>
              </div>

              <div className="flex gap-3 pt-5 border-t border-[#f1f5f9]">
                <button 
                  type="button"
                  onClick={resetForm} 
                  className="flex-1 py-2.5 rounded-lg border border-[#e2e8f0] text-[#64748b] font-semibold hover:bg-[#fafbfc] transition-all text-[13px]"
                >
                  {tx.cancel}
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-[#10b981] text-white font-semibold hover:bg-[#059669] transition-all flex items-center justify-center gap-2 shadow-sm text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 className="animate-spin" size={16} />}
                  {submitting ? tx.loading : (editingExpense ? tx.update : tx.add)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}