"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard, Plus, Search, Download, RefreshCw,
  Calendar, Users, AlertCircle, X, Loader2, CheckCircle,
  Eye, Clock, Wallet, ArrowRight, Filter
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "@/lib/axios";
import { useLang } from "@/app/components/contexts/LanguageContext";

const i18n = {
  fr: {
    payments: "Gestion des Paiements",
    subtitle: "Suivi des paiements aux propriétaires",
    unpaidBalances: "Soldes impayés",
    totalUnpaid: "Total impayé",
    paidThisMonth: "Payé ce mois",
    pendingPayouts: "Paiements en attente",
    createPayment: "Créer un paiement",
    ownerBalances: "Soldes propriétaires",
    paymentHistory: "Historique des paiements",
    owner: "Propriétaire",
    amountDue: "Montant dû",
    amountPaid: "Montant payé",
    remaining: "Restant",
    date: "Date",
    amount: "Montant",
    method: "Méthode",
    reference: "Référence",
    status: "Statut",
    actions: "Actions",
    createNewPayment: "Nouveau paiement",
    selectOwner: "Sélectionner un propriétaire",
    selectMonth: "Sélectionner le mois",
    paymentAmount: "Montant du paiement",
    paymentMethod: "Méthode de paiement",
    bankTransfer: "Virement bancaire",
    cash: "Espèces",
    check: "Chèque",
    referenceNumber: "Numéro de référence",
    markAsPaid: "Marquer comme payé",
    generatePayouts: "Générer les paiements",
    search: "Rechercher...",
    filterByOwner: "Filtrer par propriétaire",
    allOwners: "Tous les propriétaires",
    refresh: "Actualiser",
    save: "Enregistrer",
    cancel: "Annuler",
    loading: "Chargement...",
    noData: "Aucune donnée",
    paid: "Payé",
    pending: "En attente",
    overdue: "En retard",
    paymentTrend: "Tendance des paiements",
    months: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
  },
  ar: {
    payments: "إدارة المدفوعات",
    subtitle: "تتبع مدفوعات المالكين",
    unpaidBalances: "الأرصدة غير المدفوعة",
    totalUnpaid: "إجمالي غير المدفوع",
    paidThisMonth: "المدفوع هذا الشهر",
    pendingPayouts: "المدفوعات المعلقة",
    createPayment: "إنشاء دفعة",
    ownerBalances: "أرصدة المالكين",
    paymentHistory: "سجل المدفوعات",
    owner: "المالك",
    amountDue: "المبلغ المستحق",
    amountPaid: "المبلغ المدفوع",
    remaining: "المتبقي",
    date: "التاريخ",
    amount: "المبلغ",
    method: "الطريقة",
    reference: "المرجع",
    status: "الحالة",
    actions: "إجراءات",
    createNewPayment: "دفعة جديدة",
    selectOwner: "اختر المالك",
    selectMonth: "اختر الشهر",
    paymentAmount: "مبلغ الدفعة",
    paymentMethod: "طريقة الدفع",
    bankTransfer: "تحويل بنكي",
    cash: "نقدي",
    check: "شيك",
    referenceNumber: "رقم المرجع",
    markAsPaid: "تحديد كمدفوع",
    generatePayouts: "إنشاء المدفوعات",
    search: "بحث...",
    filterByOwner: "تصفية حسب المالك",
    allOwners: "جميع المالكين",
    refresh: "تحديث",
    save: "حفظ",
    cancel: "إلغاء",
    loading: "جارٍ التحميل...",
    noData: "لا توجد بيانات",
    paid: "مدفوع",
    pending: "معلق",
    overdue: "متأخر",
    paymentTrend: "اتجاه المدفوعات",
    months: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
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

interface OwnerBalance {
  id: number;
  name: string;
  amount_due: number;
  amount_paid: number;
  remaining: number;
  properties_count?: number;
}

interface PaymentHistory {
  id: number;
  owner_name: string;
  owner_id: number;
  amount: number;
  date: string;
  method: string;
  reference: string;
  status: string;
}

interface PaymentTrend {
  month: string;
  amount: number;
}

export default function PaymentsPage() {
  const router = useRouter();
  const { lang } = useLang();
  const tx = i18n[lang];
  const isRTL = lang === "ar";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ownerBalances, setOwnerBalances] = useState<OwnerBalance[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<PaymentHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOwnerFilter, setSelectedOwnerFilter] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [stats, setStats] = useState({
    totalUnpaid: 0,
    paidThisMonth: 0,
    pendingPayouts: 0,
  });
  const [paymentTrends, setPaymentTrends] = useState<PaymentTrend[]>([]);
  const [owners, setOwners] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState({
    owner_id: "",
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    amount: "",
    method: "bank_transfer",
    reference: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("access");
    const role = localStorage.getItem("role");
    if (!token || role !== "agency_manager") {
      router.push("/login");
      return;
    }
    fetchData();
    fetchOwners();
  }, [router]);

  useEffect(() => {
    filterHistory();
  }, [searchQuery, selectedOwnerFilter, paymentHistory]);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const balancesRes = await api.get("/api/payouts/summary/");
      const balancesList = balancesRes.data.results || balancesRes.data;
      setOwnerBalances(balancesList);

      const historyRes = await api.get("/api/payments/history/");
      const historyList = historyRes.data.results || historyRes.data;
      setPaymentHistory(historyList);

      const totalUnpaid = balancesList.reduce((sum: number, b: any) => sum + (b.remaining || 0), 0);
      const paidThisMonth = historyList
        .filter((h: any) => new Date(h.date).getMonth() === new Date().getMonth())
        .reduce((sum: number, h: any) => sum + (h.amount || 0), 0);
      const pendingPayouts = balancesList.filter((b: any) => (b.remaining || 0) > 0).length;

      setStats({
        totalUnpaid,
        paidThisMonth,
        pendingPayouts,
      });

      const trends: PaymentTrend[] = [];
      for (let i = 5; i >= 0; i--) {
        const month = new Date();
        month.setMonth(month.getMonth() - i);
        const monthName = month.toLocaleString(lang === "fr" ? "fr-FR" : "ar-MA", { month: "short" });
        const monthPayments = historyList.filter((h: any) => {
          const hDate = new Date(h.date);
          return hDate.getMonth() === month.getMonth() && hDate.getFullYear() === month.getFullYear();
        }).reduce((sum: number, h: any) => sum + (h.amount || 0), 0);
        trends.push({ month: monthName, amount: monthPayments });
      }
      setPaymentTrends(trends);

    } catch (err) {
      console.error("Error fetching payments data:", err);
      setOwnerBalances([
        { id: 1, name: "Ahmed Benali", amount_due: 12500, amount_paid: 5000, remaining: 7500, properties_count: 3 },
        { id: 2, name: "Sara Tazi", amount_due: 9800, amount_paid: 5000, remaining: 4800, properties_count: 2 },
        { id: 3, name: "Mohamed Amrani", amount_due: 7200, amount_paid: 3000, remaining: 4200, properties_count: 1 },
      ]);
      setPaymentHistory([
        { id: 1, owner_name: "Ahmed Benali", owner_id: 1, amount: 8500, date: "2024-05-31", method: "Virement bancaire", reference: "TRX-001", status: "paid" },
        { id: 2, owner_name: "Sara Tazi", owner_id: 2, amount: 4200, date: "2024-05-30", method: "Chèque", reference: "CHQ-002", status: "paid" },
      ]);
      setStats({ totalUnpaid: 45200, paidThisMonth: 12500, pendingPayouts: 3 });
      setPaymentTrends([
        { month: "Jan", amount: 12500 },
        { month: "Fév", amount: 14800 },
        { month: "Mar", amount: 13200 },
        { month: "Avr", amount: 15600 },
        { month: "Mai", amount: 14200 },
        { month: "Juin", amount: 12500 },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchOwners = async () => {
    try {
      const res = await api.get("/api/owners/");
      const data = res.data.results || res.data;
      setOwners(data.map((o: any) => ({ id: o.id, name: o.full_name || o.name })));
    } catch (err) {
      console.error("Error fetching owners:", err);
    }
  };

  const filterHistory = () => {
    let filtered = [...paymentHistory];
    if (selectedOwnerFilter !== 0) {
      filtered = filtered.filter(h => h.owner_id === selectedOwnerFilter);
    }
    if (searchQuery) {
      filtered = filtered.filter(h =>
        h.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.reference.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredHistory(filtered);
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!form.owner_id || !form.amount) {
      setFormError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        owner: parseInt(form.owner_id),
        month: form.month + 1,
        year: form.year,
        amount: parseFloat(form.amount),
        payment_method: form.method,
        reference: form.reference,
      };
      await api.post("/api/payments/create/", payload);
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsPaid = async (paymentId: number) => {
    try {
      await api.patch(`/api/payments/${paymentId}/`, { status: "paid" });
      fetchData();
    } catch (err) {
      console.error("Error marking payment as paid:", err);
    }
  };

  const handleGeneratePayouts = async () => {
    try {
      await api.post("/api/payments/generate-from-financials/");
      fetchData();
    } catch (err) {
      console.error("Error generating payouts:", err);
    }
  };

  const resetForm = () => {
    setForm({
      owner_id: "",
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
      amount: "",
      method: "bank_transfer",
      reference: "",
    });
    setFormError("");
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const getStatusBadge = (status: string) => {
    if (status === "paid") {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, fontSize: 10.5, fontWeight: 500, background: GREEN_BG, color: GREEN }}>
          <CheckCircle size={10} /> {tx.paid}
        </span>
      );
    } else if (status === "overdue") {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, fontSize: 10.5, fontWeight: 500, background: "#fef2f2", color: RED }}>
          <AlertCircle size={10} /> {tx.overdue}
        </span>
      );
    }
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, fontSize: 10.5, fontWeight: 500, background: "#fff7ed", color: ORANGE }}>
        <Clock size={10} /> {tx.pending}
      </span>
    );
  };

  const kpiCards = [
    { label: tx.totalUnpaid, value: formatCurrency(stats.totalUnpaid, lang), icon: <Wallet size={18} />, color: ORANGE, bg: "#fff7ed" },
    { label: tx.paidThisMonth, value: formatCurrency(stats.paidThisMonth, lang), icon: <CheckCircle size={18} />, color: GREEN, bg: GREEN_BG },
    { label: tx.pendingPayouts, value: stats.pendingPayouts.toString(), icon: <Clock size={18} />, color: BLUE, bg: "#eff6ff" },
  ];

  const inputClass = "w-full p-2.5 rounded-lg border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] text-[#334155] bg-[#f8fafc] text-[13px]";

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
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0 }}>{tx.payments}</h1>
            <p style={{ fontSize: "0.875rem", color: "#6B7280", marginTop: "0.25rem" }}>{tx.subtitle}</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={fetchData} disabled={refreshing} style={{
              padding: "8px 16px", borderRadius: 9, border: "1.5px solid #e5e7eb",
              background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12.5
            }}>
              <RefreshCw size={14} className={refreshing ? "spin" : ""} /> {tx.refresh}
            </button>
            <button onClick={handleGeneratePayouts} style={{
              padding: "8px 16px", borderRadius: 9, border: "1.5px solid #e5e7eb",
              background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12.5
            }}>
              <ArrowRight size={14} /> {tx.generatePayouts}
            </button>
            <button onClick={openAddModal} style={{
              padding: "8px 18px", borderRadius: 9, border: "none", background: GREEN,
              color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12.5
            }}>
              <Plus size={14} /> {tx.createPayment}
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

        {/* Payment Trends Chart */}
        <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: "1rem" }}>{tx.paymentTrend}</p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={paymentTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: any) => formatCurrency(value, lang)} />
              <Line type="monotone" dataKey="amount" name="Paiements" stroke={GREEN} strokeWidth={2.5} dot={{ fill: GREEN, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Owner Balances Table */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: "1.5rem" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{tx.ownerBalances}</p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b" }}>{tx.owner}</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 600, color: "#64748b" }}>Propriétés</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#64748b" }}>{tx.amountDue}</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#64748b" }}>{tx.amountPaid}</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: ORANGE }}>{tx.remaining}</th>
                </tr>
              </thead>
              <tbody>
                {ownerBalances.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>{tx.noData}</td>
                  </tr>
                ) : (
                  ownerBalances.map((b) => (
                    <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 500 }}>{b.name}</td>
                      <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600, color: BLUE }}>{b.properties_count || 0}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>{formatCurrency(b.amount_due, lang)}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: GREEN }}>{formatCurrency(b.amount_paid, lang)}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, color: ORANGE }}>{formatCurrency(b.remaining, lang)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment History Filters */}
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
            <select className={inputClass} value={selectedOwnerFilter} onChange={e => setSelectedOwnerFilter(parseInt(e.target.value))}>
              <option value={0}>{tx.allOwners}</option>
              {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
        </div>

        {/* Payment History Table */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b" }}>{tx.owner}</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#64748b" }}>{tx.amount}</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b" }}>{tx.date}</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b" }}>{tx.method}</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b" }}>{tx.reference}</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b" }}>{tx.status}</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 600, color: "#64748b" }}>{tx.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>{tx.noData}</td>
                  </tr>
                ) : (
                  filteredHistory.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 500 }}>{p.owner_name}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>{formatCurrency(p.amount, lang)}</td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{new Date(p.date).toLocaleDateString("fr-FR")}</td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{p.method}</td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{p.reference}</td>
                      <td style={{ padding: "12px 16px" }}>{getStatusBadge(p.status)}</td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        {p.status !== "paid" && (
                          <button onClick={() => handleMarkAsPaid(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: GREEN }}>
                            <CheckCircle size={16} />
                          </button>
                        )}
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

      {/* Create Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-800">{tx.createNewPayment}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {formError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2"><AlertCircle size={14} />{formError}</div>}
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">{tx.selectOwner} *</label>
                <select className={inputClass} value={form.owner_id} onChange={e => setForm({ ...form, owner_id: e.target.value })}>
                  <option value="">Sélectionner</option>
                  {ownerBalances.map(o => <option key={o.id} value={o.id}>{o.name} - {formatCurrency(o.remaining, lang)}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">{tx.selectMonth}</label>
                  <select className={inputClass} value={form.month} onChange={e => setForm({ ...form, month: parseInt(e.target.value) })}>
                    {tx.months.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Année</label>
                  <select className={inputClass} value={form.year} onChange={e => setForm({ ...form, year: parseInt(e.target.value) })}>
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">{tx.paymentAmount} (MAD) *</label>
                <input type="number" className={inputClass} placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">{tx.paymentMethod}</label>
                <select className={inputClass} value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
                  <option value="bank_transfer">{tx.bankTransfer}</option>
                  <option value="cash">{tx.cash}</option>
                  <option value="check">{tx.check}</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">{tx.referenceNumber}</label>
                <input className={inputClass} placeholder="TRX-001" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-semibold">{tx.cancel}</button>
              <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2">{submitting ? <Loader2 className="animate-spin" size={16} /> : tx.save}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}