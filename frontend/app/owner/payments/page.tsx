// frontend/app/owner/payments/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  DollarSign, Clock, Calendar, CheckCircle, XCircle, 
  AlertCircle, Download, Eye, Wallet, TrendingUp, 
  Building2, ChevronDown, ChevronUp, Receipt, Banknote,
  ArrowUpRight, ArrowDownRight, MessageCircle, RefreshCw,
  FileText, CreditCard
} from "lucide-react";
import api from "@/lib/axios";
import { useLang } from "@/app/components/contexts/LanguageContext";

const i18n = {
  fr: {
    title: "Paiements",
    subtitle: "Suivez vos paiements et transactions",
    pendingPayment: "Paiement en attente",
    pendingDesc: "Gagné mais pas encore payé",
    paidThisMonth: "Payé ce mois-ci",
    paidThisMonthDesc: "Déjà transféré ce mois",
    totalPaidYear: "Total payé cette année",
    totalPaidYearDesc: "Suivi annuel",
    nextPayout: "Prochain paiement",
    inDays: "dans",
    days: "jours",
    currentBalance: "Solde actuel",
    revenueGenerated: "Revenus générés",
    agencyCommission: "Commission agence",
    propertyExpenses: "Dépenses propriété",
    amountDue: "Montant dû",
    paymentStatus: "Statut du paiement",
    status: "Statut",
    pending: "En attente",
    scheduled: "Planifié",
    paid: "Payé",
    paymentHistory: "Historique des paiements",
    date: "Date",
    period: "Période",
    amount: "Montant",
    paymentDetails: "Détails du paiement",
    revenue: "Revenus",
    commission: "Commission",
    expenses: "Dépenses",
    netAmountPaid: "Net payé",
    transferDate: "Date de virement",
    reference: "Référence",
    downloadReceipt: "Télécharger le reçu",
    downloadStatement: "Télécharger le relevé",
    noPayments: "Aucun paiement trouvé",
    noPaymentsSub: "Les paiements apparaîtront ici une fois traités",
    contactSupport: "Contacter le support",
    contactMessage: "Une question sur vos paiements ? Notre équipe est là pour vous aider.",
    refresh: "Actualiser",
    viewDetails: "Voir détails",
    hideDetails: "Masquer détails",
  },
  ar: {
    title: "المدفوعات",
    subtitle: "تتبع مدفوعاتك ومعاملاتك",
    pendingPayment: "الدفعة المعلقة",
    pendingDesc: "تم الكسب ولكن لم يدفع بعد",
    paidThisMonth: "المدفوع هذا الشهر",
    paidThisMonthDesc: "تم تحويله هذا الشهر",
    totalPaidYear: "إجمالي المدفوع هذه السنة",
    totalPaidYearDesc: "متابعة سنوية",
    nextPayout: "الدفعة القادمة",
    inDays: "خلال",
    days: "أيام",
    currentBalance: "الرصيد الحالي",
    revenueGenerated: "الإيرادات المحققة",
    agencyCommission: "عمولة الوكالة",
    propertyExpenses: "مصروفات العقار",
    amountDue: "المبلغ المستحق",
    paymentStatus: "حالة الدفع",
    status: "الحالة",
    pending: "قيد الانتظار",
    scheduled: "مجدول",
    paid: "مدفوع",
    paymentHistory: "سجل المدفوعات",
    date: "التاريخ",
    period: "الفترة",
    amount: "المبلغ",
    paymentDetails: "تفاصيل الدفع",
    revenue: "الإيرادات",
    commission: "العمولة",
    expenses: "المصروفات",
    netAmountPaid: "الصافي المدفوع",
    transferDate: "تاريخ التحويل",
    reference: "المرجع",
    downloadReceipt: "تحميل الإيصال",
    downloadStatement: "تحميل كشف الحساب",
    noPayments: "لا توجد مدفوعات",
    noPaymentsSub: "ستظهر المدفوعات هنا بعد معالجتها",
    contactSupport: "اتصل بالدعم",
    contactMessage: "لديك سؤال حول مدفوعاتك؟ فريقنا هنا لمساعدتك.",
    refresh: "تحديث",
    viewDetails: "عرض التفاصيل",
    hideDetails: "إخفاء التفاصيل",
  },
} as const;

interface Payment {
  id: number;
  amount: number;
  payment_method: string;
  payment_method_display: string;
  payment_date: string;
  transaction_id: string;
  notes: string;
}

interface PayoutSummary {
  id: string;
  owner_name: string;
  property_name: string;
  month: number;
  year: number;
  month_display: string;
  total_revenue: number;
  commission: number;
  expenses: number;
  net_owner_earnings: number;
  amount_paid: number;
  remaining_balance: number;
  status: string;
  status_display: string;
  due_date: string;
  paid_date: string | null;
  completion_percentage: number;
  payments: Payment[];
}

interface KPIs {
  total_pending_payouts: number;
  total_paid_this_month: number;
  total_owner_earnings: number;
  unpaid_balances: number;
  upcoming_payments: number;
}

const GREEN = "#22c55e";
const GREEN_DARK = "#16a34a";
const GREEN_BG = "#f0fdf4";
const ORANGE = "#f59e0b";
const ORANGE_BG = "#fffbeb";
const BLUE = "#3b82f6";
const BLUE_BG = "#eff6ff";
const RED = "#ef4444";
const RED_BG = "#fef2f2";
const PURPLE = "#8b5cf6";

const formatCurrency = (amount: number, lang: "fr" | "ar"): string => {
  if (!amount && amount !== 0) return "0 MAD";
  return amount.toLocaleString(lang === "fr" ? "fr-FR" : "ar-MA") + " MAD";
};

const formatDate = (dateStr: string, lang: "fr" | "ar"): string => {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(lang === "fr" ? "fr-FR" : "ar-MA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "paid":
      return { bg: GREEN_BG, text: GREEN, icon: CheckCircle, label: "Payé" };
    case "scheduled":
      return { bg: BLUE_BG, text: BLUE, icon: Calendar, label: "Planifié" };
    case "partial":
      return { bg: BLUE_BG, text: BLUE, icon: AlertCircle, label: "Partiel" };
    default:
      return { bg: ORANGE_BG, text: ORANGE, icon: Clock, label: "En attente" };
  }
};

export default function OwnerPaymentsPage() {
  const router = useRouter();
  const { lang } = useLang();
  const tx = i18n[lang];
  const isRTL = lang === "ar";

  const [payouts, setPayouts] = useState<PayoutSummary[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) router.push("/login");
  }, [router]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      // Fetch KPIs
      const kpisRes = await api.get("/api/payments/kpis/");
      setKpis(kpisRes.data);

      // Fetch payouts summary
      const payoutsRes = await api.get("/api/payments/payouts/summary/");
      const payoutsData = payoutsRes.data || [];
      setPayouts(payoutsData);

    } catch (err) {
      console.error("Error fetching payment data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDownloadStatement = async (payoutId: string, propertyName: string, period: string) => {
    try {
      // Find the actual payout ID from the summary
      const payout = payouts.find(p => p.id === payoutId);
      if (!payout) return;
      
      // Call API to get statement (you'll need to implement this endpoint)
      // For now, just show an alert
      alert(`Téléchargement du relevé pour ${propertyName} - ${period}`);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const contactAgency = () => {
    window.open(`https://wa.me/212600000000?text=Bonjour%2C%20j%27ai%20une%20question%20concernant%20mes%20paiements`, "_blank");
  };

  const getDaysUntil = (dateStr: string) => {
    if (!dateStr) return null;
    const today = new Date();
    const targetDate = new Date(dateStr);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate summary values from payouts data
  const pendingAmount = payouts
    .filter(p => p.status === "pending")
    .reduce((sum, p) => sum + (p.remaining_balance || p.net_owner_earnings - p.amount_paid), 0);
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const paidThisMonthAmount = payouts
    .filter(p => p.status === "paid" && p.paid_date)
    .filter(p => {
      const paidDate = new Date(p.paid_date!);
      return paidDate.getMonth() + 1 === currentMonth && paidDate.getFullYear() === currentYear;
    })
    .reduce((sum, p) => sum + p.amount_paid, 0);
  
  const totalPaidYear = payouts
    .filter(p => p.status === "paid" && p.paid_date)
    .filter(p => new Date(p.paid_date!).getFullYear() === currentYear)
    .reduce((sum, p) => sum + p.amount_paid, 0);
  
  const nextPendingPayout = payouts.find(p => p.status === "pending");
  const nextPayoutDate = nextPendingPayout?.due_date || null;
  
  // Calculate current balance
  const totalRevenue = payouts.reduce((sum, p) => sum + p.total_revenue, 0);
  const totalCommission = payouts.reduce((sum, p) => sum + p.commission, 0);
  const totalExpenses = payouts.reduce((sum, p) => sum + p.expenses, 0);
  const totalDue = payouts
    .filter(p => p.status !== "paid")
    .reduce((sum, p) => sum + (p.remaining_balance || p.net_owner_earnings - p.amount_paid), 0);

  const currentStatus = nextPendingPayout ? "pending" : 
                        payouts.find(p => p.status === "partial") ? "partial" : "paid";
  const statusConfig = getStatusConfig(currentStatus);

  const kpiCards = [
    { 
      label: tx.pendingPayment, 
      value: kpis ? formatCurrency(kpis.unpaid_balances || pendingAmount, lang) : formatCurrency(pendingAmount, lang), 
      desc: tx.pendingDesc,
      icon: <Clock size={20} />, 
      color: ORANGE, 
      bg: ORANGE_BG,
    },
    { 
      label: tx.paidThisMonth, 
      value: kpis ? formatCurrency(kpis.total_paid_this_month, lang) : formatCurrency(paidThisMonthAmount, lang), 
      desc: tx.paidThisMonthDesc,
      icon: <DollarSign size={20} />, 
      color: GREEN, 
      bg: GREEN_BG,
    },
    { 
      label: tx.totalPaidYear, 
      value: formatCurrency(totalPaidYear, lang), 
      desc: tx.totalPaidYearDesc,
      icon: <TrendingUp size={20} />, 
      color: PURPLE, 
      bg: "#f3e8ff",
    },
    { 
      label: tx.nextPayout, 
      value: nextPayoutDate ? formatDate(nextPayoutDate, lang) : "—", 
      desc: nextPayoutDate && getDaysUntil(nextPayoutDate) 
        ? `${tx.inDays} ${getDaysUntil(nextPayoutDate)} ${tx.days}` 
        : "Aucun",
      icon: <Calendar size={20} />, 
      color: BLUE, 
      bg: BLUE_BG,
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: "2rem", background: "#f9fafb", minHeight: "100vh" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{
              height: 120, borderRadius: 16, background: "linear-gradient(90deg,#f3f4f6 25%,#e9eaeb 50%,#f3f4f6 75%)",
              backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite"
            }} />
          ))}
        </div>
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
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
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", margin: 0, letterSpacing: "-0.02em" }}>
                {tx.title}
              </h1>
              <p style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: 4 }}>{tx.subtitle}</p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={fetchData} disabled={refreshing} style={{
                padding: "8px 16px", borderRadius: 10, border: "1.5px solid #e5e7eb",
                background: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
                gap: 8, fontSize: 13, fontWeight: 500, color: "#374151"
              }}>
                <RefreshCw size={14} className={refreshing ? "spin" : ""} /> {tx.refresh}
              </button>
              <button onClick={contactAgency} style={{
                padding: "8px 18px", borderRadius: 10, border: "none", background: GREEN,
                color: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
                gap: 8, fontSize: 13, fontWeight: 500
              }}>
                <MessageCircle size={14} />
                {tx.contactSupport}
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.25rem", marginBottom: "1.5rem" }}>
          {kpiCards.map((k, i) => (
            <div key={i} style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: "1.25rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", color: k.color }}>
                  {k.icon}
                </div>
              </div>
              <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>{k.label}</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: k.color === GREEN ? GREEN : "#111827", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                {k.value}
              </p>
              <p style={{ fontSize: 11, color: "#d1d5db", marginTop: 4 }}>{k.desc}</p>
            </div>
          ))}
        </div>

        {/* Current Balance - Large Card */}
        <div style={{
          background: "linear-gradient(135deg, #f0fdf4, #ffffff)",
          border: `2px solid ${GREEN}`,
          borderRadius: 20,
          padding: "1.75rem",
          marginBottom: "1.5rem",
          boxShadow: "0 4px 12px rgba(34,197,94,0.15)"
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: 8 }}>
            <Wallet size={20} color={GREEN} />
            {tx.currentBalance}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid #e5e7eb" }}>
              <span style={{ fontSize: 15, color: "#374151" }}>{tx.revenueGenerated}</span>
              <span style={{ fontSize: 18, fontWeight: 600, color: "#111827" }}>{formatCurrency(totalRevenue, lang)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid #e5e7eb" }}>
              <span style={{ fontSize: 15, color: "#374151" }}>{tx.agencyCommission}</span>
              <span style={{ fontSize: 18, fontWeight: 600, color: RED }}>- {formatCurrency(totalCommission, lang)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid #e5e7eb" }}>
              <span style={{ fontSize: 15, color: "#374151" }}>{tx.propertyExpenses}</span>
              <span style={{ fontSize: 18, fontWeight: 600, color: ORANGE }}>- {formatCurrency(totalExpenses, lang)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", marginTop: "0.5rem", borderTop: "2px solid #e5e7eb" }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{tx.amountDue}</span>
              <span style={{ fontSize: 28, fontWeight: 700, color: GREEN }}>{formatCurrency(totalDue, lang)}</span>
            </div>
          </div>
        </div>

        {/* Payment Status Card */}
        <div style={{
          background: statusConfig.bg,
          border: `1px solid ${statusConfig.text}`,
          borderRadius: 16,
          padding: "1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <statusConfig.icon size={28} color={statusConfig.text} />
            <div>
              <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>{tx.paymentStatus}</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: statusConfig.text }}>{statusConfig.label}</p>
            </div>
          </div>
          {currentStatus === "pending" && nextPayoutDate && (
            <div style={{ textAlign: isRTL ? "left" : "right" }}>
              <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>{tx.nextPayout}</p>
              <p style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>{formatDate(nextPayoutDate, lang)}</p>
              {getDaysUntil(nextPayoutDate) && (
                <p style={{ fontSize: 12, color: ORANGE }}>{tx.inDays} {getDaysUntil(nextPayoutDate)} {tx.days}</p>
              )}
            </div>
          )}
        </div>

        {/* Payment History Table */}
        <div style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
        }}>
          <div style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid #e5e7eb",
            background: "#fafafa"
          }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111827", margin: 0 }}>
              {tx.paymentHistory}
            </h3>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>{tx.period}</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>{tx.property}</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>{tx.amount}</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>{tx.status}</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}></th>
                </tr>
              </thead>
              <tbody>
                {payouts.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "3rem", textAlign: "center" }}>
                      <Receipt size={48} style={{ color: "#d1d5db", marginBottom: "1rem" }} />
                      <p style={{ color: "#9ca3af", fontWeight: 500 }}>{tx.noPayments}</p>
                      <p style={{ fontSize: 12, color: "#d1d5db", marginTop: 4 }}>{tx.noPaymentsSub}</p>
                    </td>
                  </tr>
                ) : (
                  payouts.map((payout) => {
                    const payoutStatusConfig = getStatusConfig(payout.status);
                    const StatusIcon = payoutStatusConfig.icon;
                    const isExpanded = expandedPayment === payout.id;
                    const periodName = payout.month_display ? 
                      `${payout.month_display} ${payout.year}` : 
                      `Mois ${payout.month} ${payout.year}`;
                    
                    return (
                      <React.Fragment key={payout.id}>
                        <tr style={{ borderBottom: "1px solid #f0f0f0", transition: "background 0.2s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "14px 16px", fontWeight: 500, color: "#111827" }}>{periodName}</td>
                          <td style={{ padding: "14px 16px", color: "#6b7280", fontSize: 13 }}>{payout.property_name}</td>
                          <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 600, color: GREEN }}>
                            {formatCurrency(payout.net_owner_earnings, lang)}
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500,
                              background: payoutStatusConfig.bg, color: payoutStatusConfig.text
                            }}>
                              <StatusIcon size={11} />
                              {payout.status_display}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px", textAlign: "right" }}>
                            <button
                              onClick={() => setExpandedPayment(isExpanded ? null : payout.id)}
                              style={{
                                padding: "6px 12px",
                                borderRadius: 8,
                                border: "1px solid #e5e7eb",
                                background: "#fff",
                                cursor: "pointer",
                                fontSize: 11,
                                fontWeight: 500,
                                color: GREEN,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4
                              }}
                            >
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              {isExpanded ? tx.hideDetails : tx.viewDetails}
                            </button>
                          </td>
                        </tr>
                        
                        {/* Expanded Payment Details */}
                        {isExpanded && (
                          <tr style={{ background: "#fafafa" }}>
                            <td colSpan={5} style={{ padding: "1.25rem", borderBottom: "1px solid #e5e7eb" }}>
                              <div style={{ 
                                display: "grid", 
                                gridTemplateColumns: isRTL ? "1fr 1fr" : "1fr 1fr", 
                                gap: "1.5rem"
                              }}>
                                <div>
                                  <h4 style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: "1rem" }}>
                                    {tx.paymentDetails}
                                  </h4>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                      <span style={{ fontSize: 13, color: "#6b7280" }}>{tx.revenue}</span>
                                      <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{formatCurrency(payout.total_revenue, lang)}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                      <span style={{ fontSize: 13, color: "#6b7280" }}>{tx.commission}</span>
                                      <span style={{ fontSize: 13, fontWeight: 500, color: RED }}>- {formatCurrency(payout.commission, lang)}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                      <span style={{ fontSize: 13, color: "#6b7280" }}>{tx.expenses}</span>
                                      <span style={{ fontSize: 13, fontWeight: 500, color: ORANGE }}>- {formatCurrency(payout.expenses, lang)}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid #e5e7eb" }}>
                                      <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{tx.netAmountPaid}</span>
                                      <span style={{ fontSize: 16, fontWeight: 700, color: GREEN }}>{formatCurrency(payout.net_owner_earnings, lang)}</span>
                                    </div>
                                    {payout.amount_paid > 0 && (
                                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: 13, color: "#6b7280" }}>Montant payé</span>
                                        <span style={{ fontSize: 13, fontWeight: 500, color: GREEN }}>{formatCurrency(payout.amount_paid, lang)}</span>
                                      </div>
                                    )}
                                    {payout.remaining_balance > 0 && (
                                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: 13, color: "#6b7280" }}>Reste à payer</span>
                                        <span style={{ fontSize: 13, fontWeight: 500, color: ORANGE }}>{formatCurrency(payout.remaining_balance, lang)}</span>
                                      </div>
                                    )}
                                    {payout.completion_percentage > 0 && (
                                      <div style={{ marginTop: "0.5rem" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                          <span style={{ fontSize: 11, color: "#6b7280" }}>Progression</span>
                                          <span style={{ fontSize: 11, fontWeight: 500, color: GREEN }}>{payout.completion_percentage}%</span>
                                        </div>
                                        <div style={{ width: "100%", height: 4, background: "#e5e7eb", borderRadius: 2, overflow: "hidden" }}>
                                          <div style={{ width: `${payout.completion_percentage}%`, height: "100%", background: GREEN, borderRadius: 2 }} />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <h4 style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: "1rem" }}>
                                    Information
                                  </h4>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                      <span style={{ fontSize: 13, color: "#6b7280" }}>{tx.transferDate}</span>
                                      <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
                                        {payout.paid_date ? formatDate(payout.paid_date, lang) : "En attente"}
                                      </span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                      <span style={{ fontSize: 13, color: "#6b7280" }}>Date d'échéance</span>
                                      <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
                                        {formatDate(payout.due_date, lang)}
                                      </span>
                                    </div>
                                    <div style={{ marginTop: "0.5rem" }}>
                                      <button
                                        onClick={() => handleDownloadStatement(payout.id, payout.property_name, periodName)}
                                        style={{
                                          width: "100%",
                                          padding: "8px 16px",
                                          borderRadius: 8,
                                          border: "none",
                                          background: GREEN,
                                          color: "#fff",
                                          cursor: "pointer",
                                          fontSize: 12,
                                          fontWeight: 500,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: 6
                                        }}
                                      >
                                        <Download size={14} />
                                        {payout.status === "paid" ? tx.downloadReceipt : tx.downloadStatement}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Payments List within Payout */}
                              {payout.payments && payout.payments.length > 0 && (
                                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
                                  <h4 style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: "0.75rem" }}>
                                    Transactions de paiement
                                  </h4>
                                  {payout.payments.map((payment, idx) => (
                                    <div key={payment.id} style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      padding: "0.5rem 0",
                                      borderBottom: idx < payout.payments.length - 1 ? "1px solid #f0f0f0" : "none"
                                    }}>
                                      <div>
                                        <span style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>
                                          {formatCurrency(payment.amount, lang)}
                                        </span>
                                        <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 8 }}>
                                          {payment.payment_method_display}
                                        </span>
                                      </div>
                                      <span style={{ fontSize: 11, color: "#6b7280" }}>
                                        {formatDate(payment.payment_date, lang)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Contact Support Section */}
        <div style={{
          background: "linear-gradient(135deg, #f0fdf4, #ffffff)",
          border: `1px solid ${GREEN}`,
          borderRadius: 16,
          padding: "1.5rem",
          textAlign: "center"
        }}>
          <MessageCircle size={32} color={GREEN} style={{ marginBottom: "0.75rem" }} />
          <p style={{ fontSize: 14, color: "#374151", marginBottom: "0.5rem" }}>
            {tx.contactMessage}
          </p>
          <button
            onClick={contactAgency}
            style={{
              marginTop: "0.5rem",
              padding: "8px 20px",
              borderRadius: 10,
              border: "none",
              background: GREEN,
              color: "#fff",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              fontWeight: 500
            }}
            onMouseEnter={e => e.currentTarget.style.background = GREEN_DARK}
            onMouseLeave={e => e.currentTarget.style.background = GREEN}
          >
            <MessageCircle size={14} />
            {tx.contactSupport}
          </button>
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spin {
            animation: spin 1s linear infinite;
          }
        `}</style>
      </div>
    </div>
  );
}

import React from "react";
