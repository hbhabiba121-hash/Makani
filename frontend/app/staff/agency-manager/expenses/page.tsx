"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingDown, Plus, Search, Filter, Download, RefreshCw,
  Calendar, Building2, AlertCircle, X, Loader2, Trash2, Edit, Eye,
  CheckCircle, Clock
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import api from "@/lib/axios";
import { useLang } from "@/app/components/contexts/LanguageContext";

const i18n = {
  fr: {
    expenses: "Gestion des Dépenses",
    subtitle: "Suivi des dépenses de l'agence",
    addExpense: "Ajouter une dépense",
    editExpense: "Modifier la dépense",
    deleteExpense: "Supprimer la dépense",
    approveExpense: "Approuver la dépense",
    totalExpenses: "Dépenses totales",
    pendingApproval: "En attente d'approbation",
    approvedExpenses: "Approuvées",
    averageExpense: "Dépense moyenne",
    expensesByCategory: "Dépenses par catégorie",
    expensesByProperty: "Dépenses par propriété",
    highestExpenseProperty: "Propriété la plus dépensière",
    recentExpenses: "Dépenses récentes",
    property: "Propriété",
    category: "Catégorie",
    description: "Description",
    amount: "Montant",
    date: "Date",
    receipt: "Reçu",
    status: "Statut",
    actions: "Actions",
    search: "Rechercher...",
    filterByStatus: "Filtrer par statut",
    allStatus: "Tous",
    pending: "En attente",
    approved: "Approuvé",
    rejected: "Rejeté",
    refresh: "Actualiser",
    save: "Enregistrer",
    cancel: "Annuler",
    loading: "Chargement...",
    noData: "Aucune donnée",
    propertyName: "Nom de la propriété",
    expenseCategory: "Catégorie",
    expenseDescription: "Description",
    expenseAmount: "Montant (MAD)",
    expenseDate: "Date",
    uploadReceipt: "Télécharger un reçu",
    confirmDelete: "Êtes-vous sûr de vouloir supprimer cette dépense ?",
    confirmApprove: "Êtes-vous sûr de vouloir approuver cette dépense ?",
    categories: {
      maintenance: "Maintenance",
      cleaning: "Nettoyage",
      utilities: "Charges",
      marketing: "Marketing",
      taxes: "Taxes",
      other: "Autre",
    },
  },
  ar: {
    expenses: "إدارة المصاريف",
    subtitle: "تتبع مصاريف الوكالة",
    addExpense: "إضافة مصروف",
    editExpense: "تعديل المصروف",
    deleteExpense: "حذف المصروف",
    approveExpense: "اعتماد المصروف",
    totalExpenses: "إجمالي المصاريف",
    pendingApproval: "قيد الاعتماد",
    approvedExpenses: "المعتمدة",
    averageExpense: "متوسط المصروف",
    expensesByCategory: "المصاريف حسب الفئة",
    expensesByProperty: "المصاريف حسب العقار",
    highestExpenseProperty: "العقار الأكثر إنفاقًا",
    recentExpenses: "المصاريف الأخيرة",
    property: "العقار",
    category: "الفئة",
    description: "الوصف",
    amount: "المبلغ",
    date: "التاريخ",
    receipt: "الإيصال",
    status: "الحالة",
    actions: "إجراءات",
    search: "بحث...",
    filterByStatus: "تصفية حسب الحالة",
    allStatus: "الجميع",
    pending: "قيد الانتظار",
    approved: "معتمد",
    rejected: "مرفوض",
    refresh: "تحديث",
    save: "حفظ",
    cancel: "إلغاء",
    loading: "جارٍ التحميل...",
    noData: "لا توجد بيانات",
    propertyName: "اسم العقار",
    expenseCategory: "الفئة",
    expenseDescription: "الوصف",
    expenseAmount: "المبلغ (MAD)",
    expenseDate: "التاريخ",
    uploadReceipt: "تحميل إيصال",
    confirmDelete: "هل أنت متأكد من حذف هذا المصروف؟",
    confirmApprove: "هل أنت متأكد من اعتماد هذا المصروف؟",
    categories: {
      maintenance: "صيانة",
      cleaning: "تنظيف",
      utilities: "فواتير",
      marketing: "تسويق",
      taxes: "ضرائب",
      other: "أخرى",
    },
  },
} as const;

const GREEN = "#22c55e";
const GREEN_BG = "#f0fdf4";
const BLUE = "#3b82f6";
const ORANGE = "#f59e0b";
const PURPLE = "#8b5cf6";
const RED = "#ef4444";

const formatCurrency = (amount: number, lang: "fr" | "ar"): string => {
  return amount.toLocaleString(lang === "fr" ? "fr-FR" : "ar-MA") + " MAD";
};

const CATEGORY_COLORS: Record<string, string> = {
  maintenance: RED,
  cleaning: BLUE,
  utilities: ORANGE,
  marketing: PURPLE,
  taxes: GREEN,
  other: "#6b7280",
};

interface Expense {
  id: number;
  property_name: string;
  property_id: number;
  category: string;
  description: string;
  amount: number;
  date: string;
  status: "pending" | "approved" | "rejected";
  receipt_url?: string;
  approved_by?: string;
  approved_at?: string;
}

interface Property {
  id: number;
  name: string;
}

export default function ExpensesPage() {
  const router = useRouter();
  const { lang } = useLang();
  const tx = i18n[lang];
  const isRTL = lang === "ar";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    pendingApproval: 0,
    approvedExpenses: 0,
    averageExpense: 0,
  });
  const [expensesByCategory, setExpensesByCategory] = useState<{ category: string; amount: number; color: string }[]>([]);
  const [expensesByProperty, setExpensesByProperty] = useState<{ name: string; amount: number }[]>([]);
  const [highestExpenseProperty, setHighestExpenseProperty] = useState<{ name: string; amount: number } | null>(null);
  const [form, setForm] = useState({
    property_id: "",
    category: "maintenance",
    description: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const token = localStorage.getItem("access");
    const role = localStorage.getItem("role");
    if (!token || role !== "agency_manager") {
      router.push("/login");
      return;
    }
    fetchData();
    fetchProperties();
  }, [router, statusFilter]);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const expensesRes = await api.get("/financials/expenses/");
      let expensesList = expensesRes.data.results || expensesRes.data;
      
      if (statusFilter !== "all") {
        expensesList = expensesList.filter((e: any) => e.status === statusFilter);
      }
      
      setExpenses(expensesList);

      const total = expensesList.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
      const pending = expensesList.filter((e: any) => e.status === "pending").length;
      const approved = expensesList.filter((e: any) => e.status === "approved").length;
      
      setStats({
        totalExpenses: total,
        pendingApproval: pending,
        approvedExpenses: approved,
        averageExpense: expensesList.length > 0 ? total / expensesList.length : 0,
      });

      const categoryMap = new Map<string, number>();
      expensesList.forEach((e: any) => {
        const cat = e.category || "other";
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + (e.amount || 0));
      });
      setExpensesByCategory(Array.from(categoryMap.entries()).map(([category, amount]) => ({
        category: tx.categories[category as keyof typeof tx.categories] || category,
        amount,
        color: CATEGORY_COLORS[category] || "#6b7280"
      })));

      const propertyMap = new Map<string, number>();
      expensesList.forEach((e: any) => {
        const name = e.property_name;
        propertyMap.set(name, (propertyMap.get(name) || 0) + (e.amount || 0));
      });
      const propertyExpenses = Array.from(propertyMap.entries()).map(([name, amount]) => ({ name, amount }));
      setExpensesByProperty(propertyExpenses);

      if (propertyExpenses.length > 0) {
        const top = propertyExpenses.reduce((max, curr) => curr.amount > max.amount ? curr : max, propertyExpenses[0]);
        setHighestExpenseProperty(top);
      }

    } catch (err) {
      console.error("Error fetching expenses:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await api.get("/api/properties/");
      const data = res.data.results || res.data;
      setProperties(data);
    } catch (err) {
      console.error("Error fetching properties:", err);
    }
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!form.property_id || !form.description || !form.amount) {
      setFormError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        property: parseInt(form.property_id),
        category: form.category,
        description: form.description,
        amount: parseFloat(form.amount),
        date: form.date,
        status: "pending",
      };
      if (selectedExpense) {
        await api.put(`/financials/expenses/${selectedExpense.id}/`, payload);
      } else {
        await api.post("/financials/expenses/", payload);
      }
      if (receiptFile) {
        const formData = new FormData();
        formData.append("receipt", receiptFile);
        const expenseId = selectedExpense?.id;
        if (expenseId) {
          await api.post(`/financials/expenses/${expenseId}/upload-receipt/`, formData);
        }
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedExpense) return;
    setSubmitting(true);
    try {
      await api.patch(`/financials/expenses/${selectedExpense.id}/`, { status: "approved" });
      setShowApproveModal(false);
      setSelectedExpense(null);
      fetchData();
    } catch (err) {
      console.error("Error approving expense:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedExpense) return;
    setSubmitting(true);
    try {
      await api.delete(`/financials/expenses/${selectedExpense.id}/`);
      setShowDeleteModal(false);
      setSelectedExpense(null);
      fetchData();
    } catch (err) {
      console.error("Error deleting expense:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      property_id: "",
      category: "maintenance",
      description: "",
      amount: "",
      date: new Date().toISOString().split('T')[0],
    });
    setReceiptFile(null);
    setSelectedExpense(null);
    setFormError("");
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setForm({
      property_id: expense.property_id.toString(),
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      date: expense.date,
    });
    setShowModal(true);
  };

  const getStatusBadge = (status: string) => {
    if (status === "approved") {
      return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, fontSize: 10.5, fontWeight: 500, background: GREEN_BG, color: GREEN }}><CheckCircle size={10} /> Approuvé</span>;
    } else if (status === "pending") {
      return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, fontSize: 10.5, fontWeight: 500, background: "#fff7ed", color: ORANGE }}><Clock size={10} /> En attente</span>;
    }
    return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, fontSize: 10.5, fontWeight: 500, background: "#fef2f2", color: RED }}><AlertCircle size={10} /> Rejeté</span>;
  };

  const inputClass = "w-full p-2.5 rounded-lg border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] text-[#334155] bg-[#f8fafc] text-[13px]";

  const filteredExpenses = expenses.filter(e =>
    e.property_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const kpiCards = [
    { label: tx.totalExpenses, value: formatCurrency(stats.totalExpenses, lang), icon: <TrendingDown size={18} />, color: RED, bg: "#fef2f2" },
    { label: tx.pendingApproval, value: stats.pendingApproval.toString(), icon: <Clock size={18} />, color: ORANGE, bg: "#fff7ed" },
    { label: tx.approvedExpenses, value: stats.approvedExpenses.toString(), icon: <CheckCircle size={18} />, color: GREEN, bg: GREEN_BG },
    { label: tx.averageExpense, value: formatCurrency(stats.averageExpense, lang), icon: <Calendar size={18} />, color: BLUE, bg: "#eff6ff" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: isRTL ? "'Cairo', system-ui" : "'Geist', system-ui",
      direction: isRTL ? "rtl" : "ltr",
      background: "#f9fafb",
      minHeight: "100vh",
      padding: "1.75rem 2rem"
    }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0 }}>{tx.expenses}</h1>
            <p style={{ fontSize: "0.875rem", color: "#6B7280", marginTop: "0.25rem" }}>{tx.subtitle}</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={fetchData} disabled={refreshing} style={{
              padding: "8px 16px", borderRadius: 9, border: "1.5px solid #e5e7eb",
              background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12.5
            }}>
              <RefreshCw size={14} className={refreshing ? "spin" : ""} /> {tx.refresh}
            </button>
            <button onClick={openAddModal} style={{
              padding: "8px 18px", borderRadius: 9, border: "none", background: GREEN,
              color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12.5
            }}>
              <Plus size={14} /> {tx.addExpense}
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          {kpiCards.map((k, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 12, padding: "1rem 1.125rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", color: k.color }}>
                  {k.icon}
                </div>
              </div>
              <p style={{ fontSize: 11.5, color: "#9ca3af", marginBottom: 3 }}>{k.label}</p>
              <p style={{ fontSize: 21, fontWeight: 700, color: "#111827" }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
          
          {/* Expenses by Category */}
          <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 12, padding: "1.25rem" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: "1rem" }}>{tx.expensesByCategory}</p>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expensesByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="amount" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {expensesByCategory.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value, lang)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expenses by Property */}
          <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 12, padding: "1.25rem" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: "1rem" }}>{tx.expensesByProperty}</p>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expensesByProperty} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: any) => formatCurrency(value, lang)} />
                  <Bar dataKey="amount" fill={RED} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Highest Expense Property */}
        {highestExpenseProperty && highestExpenseProperty.amount > 0 && (
          <div style={{ background: "linear-gradient(135deg, #fef2f2, #ffffff)", border: `1px solid ${RED}`, borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertCircle size={20} color={RED} />
              </div>
              <div>
                <p style={{ fontSize: 11, color: "#64748b" }}>{tx.highestExpenseProperty}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{highestExpenseProperty.name}</p>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 700, color: RED }}>{formatCurrency(highestExpenseProperty.amount, lang)}</p>
              <p style={{ fontSize: 11, color: "#64748b", textAlign: "right" }}>Total dépenses</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div className="relative">
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder={tx.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "8px 10px 8px 32px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12.5 }}
            />
          </div>
          <div>
            <select className={inputClass} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">{tx.allStatus}</option>
              <option value="pending">{tx.pending}</option>
              <option value="approved">{tx.approved}</option>
            </select>
          </div>
        </div>

        {/* Expenses Table */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b" }}>{tx.property}</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b" }}>{tx.category}</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b" }}>{tx.description}</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#64748b" }}>{tx.amount}</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b" }}>{tx.date}</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b" }}>{tx.status}</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 600, color: "#64748b" }}>{tx.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>{tx.noData}</td>
                  </tr>
                ) : (
                  filteredExpenses.map((e) => (
                    <tr key={e.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 500 }}>{e.property_name}</td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{tx.categories[e.category as keyof typeof tx.categories] || e.category}</td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{e.description}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, color: RED }}>{formatCurrency(e.amount, lang)}</td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{new Date(e.date).toLocaleDateString("fr-FR")}</td>
                      <td style={{ padding: "12px 16px" }}>{getStatusBadge(e.status)}</td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                          {e.status === "pending" && (
                            <button onClick={() => { setSelectedExpense(e); setShowApproveModal(true); }} style={{ background: "none", border: "none", cursor: "pointer", color: GREEN }}><CheckCircle size={14} /></button>
                          )}
                          <button onClick={() => openEditModal(e)} style={{ background: "none", border: "none", cursor: "pointer", color: BLUE }}><Edit size={14} /></button>
                          <button onClick={() => { setSelectedExpense(e); setShowDeleteModal(true); }} style={{ background: "none", border: "none", cursor: "pointer", color: RED }}><Trash2 size={14} /></button>
                        </div>
                       </td>
                     </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spin { animation: spin 1s linear infinite; }
        `}</style>
      </div>

      {/* Add/Edit Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-800">{selectedExpense ? tx.editExpense : tx.addExpense}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {formError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2"><AlertCircle size={14} />{formError}</div>}
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">{tx.propertyName} *</label>
                <select className={inputClass} value={form.property_id} onChange={e => setForm({ ...form, property_id: e.target.value })}>
                  <option value="">Sélectionner</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">{tx.expenseCategory}</label>
                <select className={inputClass} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="maintenance">{tx.categories.maintenance}</option>
                  <option value="cleaning">{tx.categories.cleaning}</option>
                  <option value="utilities">{tx.categories.utilities}</option>
                  <option value="marketing">{tx.categories.marketing}</option>
                  <option value="taxes">{tx.categories.taxes}</option>
                  <option value="other">{tx.categories.other}</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">{tx.expenseDescription} *</label>
                <input className={inputClass} placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">{tx.expenseAmount} *</label>
                  <input type="number" className={inputClass} placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">{tx.expenseDate}</label>
                  <input type="date" className={inputClass} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">{tx.uploadReceipt}</label>
                <input type="file" accept="image/*,application/pdf" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} className="text-sm" />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-semibold">{tx.cancel}</button>
              <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2">{submitting ? <Loader2 className="animate-spin" size={16} /> : tx.save}</button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedExpense && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 text-center mb-2">{tx.approveExpense}</h2>
            <p className="text-gray-500 text-sm text-center mb-5">{tx.confirmApprove}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowApproveModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-semibold">{tx.cancel}</button>
              <button onClick={handleApprove} disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-green-500 text-white font-semibold flex items-center justify-center gap-2">{submitting ? <Loader2 className="animate-spin" size={16} /> : tx.approveExpense}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedExpense && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 text-center mb-2">{tx.deleteExpense}</h2>
            <p className="text-gray-500 text-sm text-center mb-5">{tx.confirmDelete}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-semibold">{tx.cancel}</button>
              <button onClick={handleDelete} disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-red-500 text-white font-semibold flex items-center justify-center gap-2">{submitting ? <Loader2 className="animate-spin" size={16} /> : tx.deleteExpense}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}