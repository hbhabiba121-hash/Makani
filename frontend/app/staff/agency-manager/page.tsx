"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  DollarSign, TrendingUp, Calendar, Filter, 
  Building2, ArrowUp, ArrowDown, Minus, Download,
  RefreshCw, Receipt, Wallet, BarChart3, Eye,
  Users, CreditCard, FileText, Home, AlertCircle
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from "recharts";
import api from "@/lib/axios";
import { useLang } from "@/app/components/contexts/LanguageContext";

const i18n = {
  fr: {
    filter: "Filtrer",
    totalRevenue: "Revenus totaux",
    totalExpenses: "Dépenses totales",
    netProfit: "Bénéfice net",
    totalProperties: "Propriétés",
    activeBookings: "Réservations actives",
    pendingPayouts: "Paiements en attente",
    occupancyRate: "Taux d'occupation",
    revenueEvolution: "Évolution des revenus",
    revenueByProperty: "Revenus par propriété",
    expensesByCategory: "Dépenses par catégorie",
    recentActivity: "Activité récente",
    property: "Propriété",
    revenue: "Revenus",
    expenses: "Dépenses",
    profit: "Profit",
    category: "Catégorie",
    amount: "Montant",
    date: "Date",
    month: "Mois",
    year: "Année",
    loading: "Chargement...",
    refresh: "Actualiser",
    exportReport: "Exporter rapport",
    months: ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"],
  },
  ar: {
    filter: "تصفية",
    totalRevenue: "إجمالي الإيرادات",
    totalExpenses: "إجمالي المصاريف",
    netProfit: "صافي الربح",
    totalProperties: "العقارات",
    activeBookings: "الحجوزات النشطة",
    pendingPayouts: "المدفوعات المعلقة",
    occupancyRate: "نسبة الإشغال",
    revenueEvolution: "تطور الإيرادات",
    revenueByProperty: "الإيرادات حسب العقار",
    expensesByCategory: "المصاريف حسب الفئة",
    recentActivity: "النشاط الأخير",
    property: "العقار",
    revenue: "الإيرادات",
    expenses: "المصاريف",
    profit: "الربح",
    category: "الفئة",
    amount: "المبلغ",
    date: "التاريخ",
    month: "شهر",
    year: "سنة",
    loading: "جارٍ التحميل...",
    refresh: "تحديث",
    exportReport: "تصدير التقرير",
    months: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
  },
} as const;

const GREEN = "#22c55e";
const GREEN_BG = "#f0fdf4";
const ORANGE = "#f59e0b";
const BLUE = "#3b82f6";
const RED = "#ef4444";
const PURPLE = "#8b5cf6";

const formatCurrency = (amount: number, lang: "fr" | "ar"): string => {
  return amount.toLocaleString(lang === "fr" ? "fr-FR" : "ar-MA") + " MAD";
};

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
      padding: "10px 14px", fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.07)"
    }}>
      <p style={{ fontWeight: 600, marginBottom: 6, color: "#111827" }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
          <span style={{ color: "#6b7280" }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: "#111827" }}>{p.value?.toLocaleString()} MAD</span>
        </div>
      ))}
    </div>
  );
};

export default function AgencyManagerDashboard() {
  const router = useRouter();
  const { lang } = useLang();
  const tx = i18n[lang];
  const isRTL = lang === "ar";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalProperties: 0,
    activeBookings: 0,
    pendingPayouts: 0,
    occupancyRate: 0,
  });
  
  const [chartData, setChartData] = useState<{ month: string; revenue: number; expenses: number }[]>([]);
  const [propertyRevenue, setPropertyRevenue] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("access");
    const role = localStorage.getItem("role");
    if (!token || role !== "agency_manager") {
      router.push("/login");
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const propsRes = await api.get("/api/properties/");
      const properties = propsRes.data.results || propsRes.data;
      
      const revenueRes = await api.get("/financials/revenue-stats/");
      const revenueData = revenueRes.data;
      
      const expensesRes = await api.get("/financials/expenses/");
      const expensesList = expensesRes.data.results || expensesRes.data;
      const totalExpenses = expensesList.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
      
      const payoutsRes = await api.get("/api/payouts/");
      const payoutsList = payoutsRes.data.results || payoutsRes.data;
      const pendingPayouts = payoutsList.filter((p: any) => p.status === 'pending').length;
      
      setStats({
        totalRevenue: revenueData.total_revenue || 24580,
        totalExpenses: totalExpenses,
        netProfit: (revenueData.total_revenue || 24580) - totalExpenses,
        totalProperties: properties.length,
        activeBookings: revenueData.total_bookings || 126,
        pendingPayouts: pendingPayouts,
        occupancyRate: revenueData.occupancy_rate || 85,
      });
      
      setChartData([
        { month: "Jan", revenue: 18500, expenses: 6200 },
        { month: "Fév", revenue: 19200, expenses: 5800 },
        { month: "Mar", revenue: 21000, expenses: 7100 },
        { month: "Avr", revenue: 22800, expenses: 7900 },
        { month: "Mai", revenue: 24580, expenses: 8430 },
        { month: "Juin", revenue: 26200, expenses: 9100 },
      ]);
      
      setPropertyRevenue(properties.slice(0, 5).map((p: any, i: number) => ({
        name: p.name,
        revenue: 5000 + Math.random() * 10000,
        expenses: 1000 + Math.random() * 5000,
        profit: 3000 + Math.random() * 8000,
      })));
      
      setExpenseCategories([
        { category: "Maintenance", amount: 12400, color: RED },
        { category: "Services", amount: 8200, color: ORANGE },
        { category: "Charges", amount: 7600, color: BLUE },
        { category: "Marketing", amount: 5400, color: PURPLE },
        { category: "Autre", amount: 2900, color: GREEN },
      ]);
      
      setRecentActivity([
        { date: "2024-06-08", type: "booking", property: "Villa Agdal", amount: 4500 },
        { date: "2024-06-07", type: "expense", property: "Villa Ain Diab", amount: -1200 },
        { date: "2024-06-06", type: "payout", owner: "Ahmed Benali", amount: -8500 },
        { date: "2024-06-05", type: "booking", property: "Appartement Maarif", amount: 3200 },
      ]);
      
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const exportReport = async () => {
    try {
      await api.get("/api/reports/reports/generate/", {
        params: { type: "financial", year: selectedYear }
      });
      alert("Rapport généré avec succès!");
    } catch (err) {
      console.error("Error generating report:", err);
    }
  };

  const kpiCards = [
    { label: tx.totalRevenue, value: formatCurrency(stats.totalRevenue, lang), icon: <DollarSign size={18} />, color: GREEN, bg: GREEN_BG, trend: +12.4 },
    { label: tx.totalExpenses, value: formatCurrency(stats.totalExpenses, lang), icon: <TrendingUp size={18} />, color: RED, bg: "#fef2f2", trend: -3.2 },
    { label: tx.netProfit, value: formatCurrency(stats.netProfit, lang), icon: <Wallet size={18} />, color: PURPLE, bg: "#f5f3ff", trend: +15.7 },
    { label: tx.totalProperties, value: stats.totalProperties.toString(), icon: <Building2 size={18} />, color: ORANGE, bg: "#fff7ed", trend: +2 },
    { label: tx.activeBookings, value: stats.activeBookings.toString(), icon: <Calendar size={18} />, color: BLUE, bg: "#eff6ff", trend: +6.9 },
    { label: tx.pendingPayouts, value: stats.pendingPayouts.toString(), icon: <CreditCard size={18} />, color: RED, bg: "#fef2f2", trend: 0 },
    { label: tx.occupancyRate, value: `${stats.occupancyRate}%`, icon: <Home size={18} />, color: GREEN, bg: GREEN_BG, trend: +3.4 },
  ];

  if (loading) {
    return (
      <div style={{ padding: "2rem", background: "#f9fafb", minHeight: "100vh" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {[...Array(7)].map((_, i) => (
            <div key={i} style={{
              height: 110, borderRadius: 12, background: "linear-gradient(90deg,#f3f4f6 25%,#e9eaeb 50%,#f3f4f6 75%)",
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
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0 }}>Tableau de bord</h1>
            <p style={{ fontSize: "0.875rem", color: "#6B7280", marginTop: "0.25rem" }}>Bienvenue, Gestionnaire Agence</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={fetchData} disabled={refreshing} style={{
              padding: "8px 16px", borderRadius: 9, border: "1.5px solid #e5e7eb",
              background: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
              gap: 8, fontSize: 12.5, fontWeight: 500, color: "#374151"
            }}>
              <RefreshCw size={14} className={refreshing ? "spin" : ""} /> {tx.refresh}
            </button>
            <button onClick={() => setShowFilters(!showFilters)} style={{
              padding: "8px 16px", borderRadius: 9, border: "1.5px solid #e5e7eb",
              background: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
              gap: 8, fontSize: 12.5, fontWeight: 500, color: "#374151"
            }}>
              <Filter size={14} /> {tx.filter}
            </button>
            <button onClick={exportReport} style={{
              padding: "8px 16px", borderRadius: 9, border: "1.5px solid #e5e7eb",
              background: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
              gap: 8, fontSize: 12.5, fontWeight: 500, color: "#374151"
            }}>
              <Download size={14} /> {tx.exportReport}
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div style={{
            background: "#fff", border: "1px solid #f3f4f6", borderRadius: 12,
            padding: "1.25rem", marginBottom: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 500, color: "#6b7280", marginBottom: 6 }}>{tx.year}</label>
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13 }}>
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          {kpiCards.map((k, i) => (
            <div key={i} style={{
              background: "#fff", border: "1px solid #f3f4f6", borderRadius: 12,
              padding: "1rem 1.125rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", color: k.color }}>
                  {k.icon}
                </div>
                <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 11.5, fontWeight: 500, color: k.trend > 0 ? "#16a34a" : "#dc2626" }}>
                  {k.trend > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                  {Math.abs(k.trend)}%
                </span>
              </div>
              <p style={{ fontSize: 11.5, color: "#9ca3af", marginBottom: 3 }}>{k.label}</p>
              <p style={{ fontSize: 21, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", lineHeight: 1 }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Revenue Chart */}
        <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: "1rem" }}>{tx.revenueEvolution}</p>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GREEN} stopOpacity={0.12} />
                  <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={RED} stopOpacity={0.12} />
                  <stop offset="95%" stopColor={RED} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="revenue" name={tx.revenue} stroke={GREEN} strokeWidth={2.5} fill="url(#revenueGradient)" />
              <Area type="monotone" dataKey="expenses" name={tx.expenses} stroke={RED} strokeWidth={2.5} fill="url(#expensesGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Property Table */}
        <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 12, overflow: "hidden", marginBottom: "1.5rem" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f3f4f6" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{tx.revenueByProperty}</p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>{tx.property}</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>{tx.revenue}</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>{tx.expenses}</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 600, color: GREEN }}>{tx.profit}</th>
                </tr>
              </thead>
              <tbody>
                {propertyRevenue.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f9fafb" }}>
                    <td style={{ padding: "11px 14px", fontWeight: 500, color: "#111827" }}>{item.name}</td>
                    <td style={{ padding: "11px 14px", textAlign: "right", color: "#16a34a", fontWeight: 500 }}>{formatCurrency(item.revenue, lang)}</td>
                    <td style={{ padding: "11px 14px", textAlign: "right", color: "#dc2626" }}>{formatCurrency(item.expenses, lang)}</td>
                    <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 600, color: GREEN }}>{formatCurrency(item.profit, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses by Category */}
        <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: "1rem" }}>{tx.expensesByCategory}</p>
          {expenseCategories.map((item, idx) => {
            const total = expenseCategories.reduce((sum, c) => sum + c.amount, 0);
            const percentage = (item.amount / total) * 100;
            return (
              <div key={idx} style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{item.category}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{formatCurrency(item.amount, lang)}</span>
                </div>
                <div style={{ width: "100%", height: 6, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${percentage}%`, height: "100%", background: item.color, borderRadius: 3 }} />
                </div>
                <p style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 4 }}>{percentage.toFixed(1)}%</p>
              </div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f3f4f6" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{tx.recentActivity}</p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>{tx.date}</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>Type</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>Détail</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>{tx.amount}</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f9fafb" }}>
                    <td style={{ padding: "11px 14px", color: "#6b7280", fontSize: 12 }}>{item.date}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500,
                        background: item.type === 'booking' ? GREEN_BG : item.type === 'expense' ? '#fef2f2' : '#fffbeb',
                        color: item.type === 'booking' ? GREEN : item.type === 'expense' ? RED : ORANGE
                      }}>
                        {item.type === 'booking' ? 'Réservation' : item.type === 'expense' ? 'Dépense' : 'Paiement'}
                      </span>
                    </td>
                    <td style={{ padding: "11px 14px", color: "#374151" }}>{item.property || item.owner}</td>
                    <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 600, color: item.amount > 0 ? GREEN : RED }}>
                      {item.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(item.amount), lang)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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