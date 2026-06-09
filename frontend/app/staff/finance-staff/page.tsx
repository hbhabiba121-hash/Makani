"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  DollarSign, TrendingUp, Calendar, Filter, 
  Building2, ArrowUp, ArrowDown, Minus, Download,
  RefreshCw, Receipt, Wallet, BarChart3, Eye,
  CreditCard, FileText, AlertCircle, PieChart as PieChartIcon,
  ArrowUpRight, ArrowDownRight, Clock, MoreHorizontal,
  Home, Wifi, Zap, Brush, Package, Briefcase
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, Legend
} from "recharts";
import api from "@/lib/axios";
import { useLang } from "@/app/components/contexts/LanguageContext";

const i18n = {
  fr: {
    filter: "Filtrer",
    totalRevenue: "Revenus totaux",
    totalExpenses: "Dépenses totales",
    netProfit: "Bénéfice net",
    pendingPayouts: "Paiements en attente",
    commissionCollected: "Commissions collectées",
    averageProfitPerProperty: "Profit moyen par propriété",
    revenueEvolution: "Évolution des revenus",
    revenueBySource: "Revenus par source",
    expensesByCategory: "Dépenses par catégorie",
    recentTransactions: "Transactions récentes",
    property: "Propriété",
    revenue: "Revenus",
    commission: "Commission",
    amountToReceive: "Montant à recevoir",
    category: "Catégorie",
    amount: "Montant",
    date: "Date",
    source: "Source",
    month: "Mois",
    quarter: "Trimestre",
    year: "Année",
    loading: "Chargement...",
    noData: "Aucune donnée",
    growing: "En croissance",
    stable: "Stable",
    declining: "En baisse",
    vsLastMonth: "vs mois dernier",
    refresh: "Actualiser",
    exportReport: "Exporter rapport",
    months: ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"],
    revenueVsExpenses: "Revenus vs Dépenses",
    topProperties: "Top Propriétés",
    quickStats: "Statistiques Rapides",
  },
  ar: {
    filter: "تصفية",
    totalRevenue: "إجمالي الإيرادات",
    totalExpenses: "إجمالي المصاريف",
    netProfit: "صافي الربح",
    pendingPayouts: "المدفوعات المعلقة",
    commissionCollected: "العمولات المحصلة",
    averageProfitPerProperty: "متوسط الربح لكل عقار",
    revenueEvolution: "تطور الإيرادات",
    revenueBySource: "الإيرادات حسب المصدر",
    expensesByCategory: "المصاريف حسب الفئة",
    recentTransactions: "المعاملات الأخيرة",
    property: "العقار",
    revenue: "الإيرادات",
    commission: "العمولة",
    amountToReceive: "المبلغ المستحق",
    category: "الفئة",
    amount: "المبلغ",
    date: "التاريخ",
    source: "المصدر",
    month: "شهر",
    quarter: "ربع سنة",
    year: "سنة",
    loading: "جارٍ التحميل...",
    noData: "لا توجد بيانات",
    growing: "في نمو",
    stable: "مستقر",
    declining: "في انخفاض",
    vsLastMonth: "مقارنة بالشهر الماضي",
    refresh: "تحديث",
    exportReport: "تصدير التقرير",
    months: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
    revenueVsExpenses: "الإيرادات مقابل المصاريف",
    topProperties: "أفضل العقارات",
    quickStats: "إحصائيات سريعة",
  },
} as const;

const GREEN = "#22c55e";
const GREEN_DARK = "#16a34a";
const GREEN_BG = "#f0fdf4";
const ORANGE = "#f59e0b";
const BLUE = "#3b82f6";
const RED = "#ef4444";
const PURPLE = "#8b5cf6";
const CYAN = "#06b6d4";
const INDIGO = "#6366f1";

const formatCurrency = (amount: number, lang: "fr" | "ar"): string => {
  return amount.toLocaleString(lang === "fr" ? "fr-FR" : "ar-MA") + " MAD";
};

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
      padding: "10px 14px", fontSize: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
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

export default function FinanceStaffDashboard() {
  const router = useRouter();
  const { lang } = useLang();
  const tx = i18n[lang];
  const isRTL = lang === "ar";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    pendingPayouts: 0,
    commissionCollected: 0,
    averageProfitPerProperty: 0,
  });
  
  const [chartData, setChartData] = useState<{ month: string; revenue: number; expenses: number; profit: number }[]>([]);
  const [revenueBySource, setRevenueBySource] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [totalProperties, setTotalProperties] = useState(0);
  const [topProperties, setTopProperties] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("access");
    const role = localStorage.getItem("role");
    if (!token || role !== "finance_staff") {
      router.push("/login");
      return;
    }
    fetchData();
  }, [router, selectedYear]);

  const fetchData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      console.log("Fetching data for year:", selectedYear);
      
      const revenueStatsRes = await api.get("/financials/revenue-stats/");
      console.log("Revenue Stats Response:", revenueStatsRes.data);
      const revenueStats = revenueStatsRes.data;
      
      const revenueSummaryRes = await api.get("/financials/revenue-summary/", {
        params: { year: selectedYear }
      });
      console.log("Revenue Summary Response:", revenueSummaryRes.data);
      const monthlyData = revenueSummaryRes.data;
      
      const expensesRes = await api.get("/financials/expenses/");
      console.log("Expenses Response:", expensesRes.data);
      let expensesList = [];
      if (Array.isArray(expensesRes.data)) {
        expensesList = expensesRes.data;
      } else if (expensesRes.data.results) {
        expensesList = expensesRes.data.results;
      }
      
      const propertiesRes = await api.get("/financials/properties/");
      console.log("Properties Response:", propertiesRes.data);
      let propertiesList = [];
      if (Array.isArray(propertiesRes.data)) {
        propertiesList = propertiesRes.data;
      } else if (propertiesRes.data.results) {
        propertiesList = propertiesRes.data.results;
      }
      setProperties(propertiesList);
      setTotalProperties(propertiesList.length);
      
      const totalExpenses = expensesList.reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0);
      
      let totalRevenue = 0;
      if (revenueStats.totalRevenue !== undefined) {
        totalRevenue = revenueStats.totalRevenue;
      } else if (revenueStats.total_revenue !== undefined) {
        totalRevenue = revenueStats.total_revenue;
      } else if (revenueStats.total) {
        totalRevenue = revenueStats.total;
      }
      
      const commissionCollected = totalRevenue * 0.2;
      const averageProfitPerProperty = totalProperties > 0 
        ? (totalRevenue - totalExpenses) / totalProperties 
        : 0;
      
      setStats({
        totalRevenue: totalRevenue,
        totalExpenses: totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        pendingPayouts: 0,
        commissionCollected: commissionCollected,
        averageProfitPerProperty: averageProfitPerProperty,
      });
      
      if (Array.isArray(monthlyData) && monthlyData.length > 0) {
        const transformedChartData = monthlyData.map((item: any) => ({
          month: tx.months[(item.month || item.month_num || 1) - 1],
          revenue: item.revenue || 0,
          expenses: item.expenses || 0,
          profit: item.net_profit || item.profit || 0,
        }));
        setChartData(transformedChartData);
      } else {
        const sampleData = tx.months.map(month => ({
          month,
          revenue: 0,
          expenses: 0,
          profit: 0,
        }));
        setChartData(sampleData);
      }
      
      const sourceMap = new Map();
      if (revenueStats.transactions && Array.isArray(revenueStats.transactions)) {
        revenueStats.transactions.forEach((transaction: any) => {
          const source = transaction.source || transaction.booking_source || "Autre";
          const amount = transaction.amount || transaction.revenue || 0;
          sourceMap.set(source, (sourceMap.get(source) || 0) + amount);
        });
      }
      
      if (revenueStats.revenue_records && Array.isArray(revenueStats.revenue_records)) {
        revenueStats.revenue_records.forEach((record: any) => {
          const source = record.source || record.booking_source || "Autre";
          const amount = record.amount || record.revenue || 0;
          sourceMap.set(source, (sourceMap.get(source) || 0) + amount);
        });
      }
      
      const sourceColors: { [key: string]: string } = {
        "Airbnb": RED,
        "Booking.com": BLUE,
        "Vrbo": GREEN,
        "Direct": ORANGE,
      };
      
      let revenueBySourceData = Array.from(sourceMap.entries()).map(([name, value]) => ({
        name,
        value: typeof value === 'number' ? value : 0,
        color: sourceColors[name] || PURPLE,
      }));
      
      if (revenueBySourceData.length === 0) {
        revenueBySourceData = [{ name: "Aucune donnée", value: 1, color: "#9ca3af" }];
      }
      setRevenueBySource(revenueBySourceData);
      
      const categoryMap = new Map();
      expensesList.forEach((expense: any) => {
        const category = expense.category || "Autre";
        const amount = parseFloat(expense.amount) || 0;
        categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
      });
      
      const categoryColors: { [key: string]: string } = {
        "Maintenance": RED,
        "Services": ORANGE,
        "Charges": BLUE,
        "Marketing": PURPLE,
        "Cleaning": CYAN,
        "Utilities": GREEN,
      };
      
      let expenseCategoriesData = Array.from(categoryMap.entries()).map(([category, amount]) => ({
        category,
        amount: typeof amount === 'number' ? amount : 0,
        color: categoryColors[category] || "#9ca3af",
      }));
      
      expenseCategoriesData.sort((a, b) => b.amount - a.amount);
      setExpenseCategories(expenseCategoriesData);
      
      const transactions: any[] = [];
      
      if (revenueStats.transactions && Array.isArray(revenueStats.transactions)) {
        revenueStats.transactions.slice(0, 5).forEach((transaction: any) => {
          transactions.push({
            date: transaction.date || transaction.check_in || new Date().toISOString().split('T')[0],
            type: "revenue",
            property: transaction.property || transaction.property_name || "N/A",
            source: transaction.source || transaction.booking_source || "N/A",
            amount: transaction.amount || transaction.revenue || 0,
            commission: transaction.commission || (transaction.amount || transaction.revenue || 0) * 0.2,
          });
        });
      }
      
      expensesList.slice(0, 5).forEach((expense: any) => {
        transactions.push({
          date: expense.date || new Date().toISOString().split('T')[0],
          type: "expense",
          property: expense.property?.name || expense.property_name || "N/A",
          category: expense.category,
          amount: -Math.abs(parseFloat(expense.amount) || 0),
        });
      });
      
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentTransactions(transactions.slice(0, 10));
      
      const propMap = new Map<string, { revenue: number; expenses: number }>();
      if (revenueStats.transactions) {
        revenueStats.transactions.forEach((t: any) => {
          const propName = t.property || t.property_name || "N/A";
          const amt = t.amount || t.revenue || 0;
          if (!propMap.has(propName)) propMap.set(propName, { revenue: 0, expenses: 0 });
          propMap.get(propName)!.revenue += amt;
        });
      }
      expensesList.forEach((e: any) => {
        const propName = e.property?.name || e.property_name || "N/A";
        const amt = parseFloat(e.amount) || 0;
        if (!propMap.has(propName)) propMap.set(propName, { revenue: 0, expenses: 0 });
        propMap.get(propName)!.expenses += amt;
      });
      
      const topProps = Array.from(propMap.entries())
        .map(([name, data]) => ({ name, profit: data.revenue - data.expenses, revenue: data.revenue }))
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 3);
      setTopProperties(topProps);
      
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to load data");
      setFallbackData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const setFallbackData = () => {
    setStats({
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      pendingPayouts: 0,
      commissionCollected: 0,
      averageProfitPerProperty: 0,
    });
    
    const sampleData = tx.months.map(month => ({
      month,
      revenue: 0,
      expenses: 0,
      profit: 0,
    }));
    setChartData(sampleData);
    setRevenueBySource([{ name: "Aucune donnée", value: 1, color: "#9ca3af" }]);
    setExpenseCategories([]);
    setRecentTransactions([]);
    setTopProperties([]);
  };

  const exportReport = async () => {
    try {
      const response = await api.get("/financials/get-reports/", {
        params: { year: selectedYear }
      });
      const dataStr = JSON.stringify(response.data, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `financial_report_${selectedYear}.json`;
      link.click();
      URL.revokeObjectURL(url);
      alert("Rapport exporté avec succès!");
    } catch (err) {
      console.error("Error generating report:", err);
      alert("Erreur lors de l'export du rapport");
    }
  };

  const kpiCards = [
    { label: tx.totalRevenue, value: formatCurrency(stats.totalRevenue, lang), icon: <DollarSign size={18} />, color: GREEN, bg: GREEN_BG, trend: stats.totalRevenue > 0 ? 12.4 : 0 },
    { label: tx.commissionCollected, value: formatCurrency(stats.commissionCollected, lang), icon: <CreditCard size={18} />, color: BLUE, bg: "#eff6ff", trend: stats.commissionCollected > 0 ? 8.1 : 0 },
    { label: tx.totalExpenses, value: formatCurrency(stats.totalExpenses, lang), icon: <TrendingUp size={18} />, color: RED, bg: "#fef2f2", trend: -3.2 },
    { label: tx.netProfit, value: formatCurrency(stats.netProfit, lang), icon: <Wallet size={18} />, color: PURPLE, bg: "#f5f3ff", trend: stats.netProfit > 0 ? 15.7 : 0 },
    { label: tx.pendingPayouts, value: stats.pendingPayouts.toString(), icon: <AlertCircle size={18} />, color: ORANGE, bg: "#fff7ed", trend: 0 },
    { label: tx.averageProfitPerProperty, value: formatCurrency(stats.averageProfitPerProperty, lang), icon: <Building2 size={18} />, color: CYAN, bg: "#ecfeff", trend: stats.averageProfitPerProperty > 0 ? 5.2 : 0 },
  ];

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#10b981]/10 flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#10b981]"></div>
          </div>
          <p className="text-[#64748b] text-[13px] font-medium">{tx.loading}</p>
        </div>
      </div>
    );
  }

  const COLORS = [RED, BLUE, GREEN, ORANGE, PURPLE, CYAN];
  const totalSourceValue = revenueBySource.reduce((sum, s) => sum + (s.value || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]" dir={isRTL ? "rtl" : "ltr"}>
      <div className="p-6 max-w-[1400px] mx-auto">
        
        {/* Header */}
        <div className="relative mb-8">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#10b981]/5 rounded-full blur-3xl -z-10"></div>
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-[1.75rem] font-bold bg-gradient-to-r from-[#111827] to-[#10b981] bg-clip-text text-transparent tracking-tight">
                Finance Dashboard
              </h1>
              <p className="text-[0.875rem] text-[#64748b] mt-1">
                Suivi des revenus, dépenses et bénéfices - {selectedYear}
              </p>
            </div>
            <div className="flex gap-3">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 cursor-pointer"
              >
                <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                <option value={new Date().getFullYear() - 2}>{new Date().getFullYear() - 2}</option>
              </select>
              <button onClick={fetchData} disabled={refreshing} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-[13px] font-medium text-[#64748b] hover:bg-[#f8fafc] transition-all">
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> {tx.refresh}
              </button>
              <button onClick={exportReport} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#10b981] to-[#059669] text-white rounded-xl text-[13px] font-medium hover:shadow-lg transition-all">
                <Download size={14} /> {tx.exportReport}
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500" />
                <p className="text-red-600 text-[13px]">{error}</p>
              </div>
              <button onClick={fetchData} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-[12px] hover:bg-red-600 transition-colors">
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* KPI Cards - Modern Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {kpiCards.map((k, i) => (
            <div key={i} className="group bg-white rounded-2xl border border-[#e2e8f0] p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all group-hover:scale-110" style={{ backgroundColor: k.color + "12" }}>
                  <span style={{ color: k.color }}>{k.icon}</span>
                </div>
                {k.trend !== 0 && (
                  <div className={`flex items-center gap-1 text-[11px] font-medium ${k.trend > 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    {k.trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {Math.abs(k.trend)}%
                  </div>
                )}
              </div>
              <p className="text-[11px] text-[#64748b] font-medium uppercase tracking-wider">{k.label}</p>
              <p className="text-[20px] font-bold text-[#1e293b] tracking-tight mt-1">{k.value}</p>
              <p className="text-[9px] text-[#94a3b8] mt-1">{tx.vsLastMonth}</p>
            </div>
          ))}
        </div>

        {/* Two Column Layout for Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Revenue Chart - Takes 2 columns */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-[#1e293b] text-[15px]">{tx.revenueEvolution}</h2>
                <p className="text-[11px] text-[#94a3b8] mt-0.5">{tx.revenueVsExpenses}</p>
              </div>
              {totalProperties > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f1f5f9]">
                  <Building2 size={12} className="text-[#64748b]" />
                  <span className="text-[11px] text-[#64748b]">{totalProperties} propriétés</span>
                </div>
              )}
            </div>
            {chartData.some(d => d.revenue > 0 || d.expenses > 0) ? (
              <ResponsiveContainer width="100%" height={340}>
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="revenue" name={tx.revenue} stroke={GREEN} strokeWidth={2.5} fill="url(#revenueGradient)" />
                  <Area type="monotone" dataKey="expenses" name={tx.expenses} stroke={RED} strokeWidth={2.5} fill="url(#expensesGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[340px] flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 size={48} className="mx-auto text-[#cbd5e1] mb-3" />
                  <p className="text-[#94a3b8] text-[13px]">{tx.noData} - Aucune transaction pour {selectedYear}</p>
                </div>
              </div>
            )}
          </div>

          {/* Top Properties Sidebar */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-[#1e293b] text-[15px]">{tx.topProperties}</h2>
                <p className="text-[11px] text-[#94a3b8] mt-0.5">Par bénéfice net</p>
              </div>
              <TrendingUp size={18} className="text-[#94a3b8]" />
            </div>
            <div className="space-y-3">
              {topProperties.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 size={32} className="mx-auto text-[#cbd5e1] mb-2" />
                  <p className="text-[12px] text-[#94a3b8]">Aucune donnée disponible</p>
                </div>
              ) : (
                topProperties.map((prop, idx) => (
                  <div key={prop.name} className="flex items-center justify-between p-3 rounded-xl bg-[#fafbfc] hover:bg-[#f8fafc] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${idx === 0 ? 'bg-[#fef3c7]' : idx === 1 ? 'bg-[#f1f5f9]' : 'bg-[#fef2f2]'}`}>
                        <span className={`text-[12px] font-bold ${idx === 0 ? 'text-[#f59e0b]' : idx === 1 ? 'text-[#64748b]' : 'text-[#ef4444]'}`}>
                          #{idx + 1}
                        </span>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-[#1e293b]">{prop.name}</p>
                        <p className="text-[10px] text-[#94a3b8]">Revenu: {formatCurrency(prop.revenue, lang)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-bold text-[#10b981]">{formatCurrency(prop.profit, lang)}</p>
                      <p className="text-[9px] text-[#94a3b8]">bénéfice</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Revenue by Source & Expenses by Category */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Revenue by Source - Modern Pie Chart Card */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-[#f0fdf4] flex items-center justify-center">
                <PieChartIcon size={16} className="text-[#10b981]" />
              </div>
              <div>
                <h2 className="font-bold text-[#1e293b] text-[15px]">{tx.revenueBySource}</h2>
                <p className="text-[11px] text-[#94a3b8] mt-0.5">Répartition des revenus</p>
              </div>
            </div>
            {revenueBySource.length > 0 && revenueBySource[0].name !== "Aucune donnée" && totalSourceValue > 1 ? (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={revenueBySource} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: "#cbd5e1", strokeWidth: 1 }}>
                      {revenueBySource.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: any) => `${formatCurrency(value, lang)}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-4 pt-3 border-t border-[#f1f5f9]">
                  {revenueBySource.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
                      <span className="text-[11px] text-[#64748b]">{item.name}</span>
                      <span className="text-[11px] font-semibold text-[#1e293b]">{((item.value / totalSourceValue) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[240px] flex items-center justify-center">
                <div className="text-center">
                  <DollarSign size={40} className="mx-auto text-[#cbd5e1] mb-2" />
                  <p className="text-[#94a3b8] text-[13px]">{tx.noData}</p>
                </div>
              </div>
            )}
          </div>

          {/* Expenses by Category - Modern Progress Bars */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f1f5f9] bg-gradient-to-r from-[#fafbfc] to-[#f8fafc]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#fef2f2] flex items-center justify-center">
                  <Receipt size={16} className="text-[#ef4444]" />
                </div>
                <div>
                  <h2 className="font-bold text-[#1e293b] text-[15px]">{tx.expensesByCategory}</h2>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5">Détail des dépenses</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              {expenseCategories.length > 0 ? (
                expenseCategories.map((item, idx) => {
                  const total = expenseCategories.reduce((sum, c) => sum + c.amount, 0);
                  const percentage = total > 0 ? (item.amount / total) * 100 : 0;
                  return (
                    <div key={idx} className="mb-4">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[12px] font-medium text-[#334155]">{item.category}</span>
                        <span className="text-[12px] font-semibold text-[#1e293b]">{formatCurrency(item.amount, lang)}</span>
                      </div>
                      <div className="w-full h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, background: item.color }} />
                      </div>
                      <p className="text-[10px] text-[#94a3b8] mt-1">{percentage.toFixed(1)}% du total</p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Receipt size={32} className="mx-auto text-[#cbd5e1] mb-2" />
                  <p className="text-[#94a3b8] text-[13px]">{tx.noData}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Transactions Table - Modern Design */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#f1f5f9] bg-gradient-to-r from-[#fafbfc] to-[#f8fafc]">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[#10b981]" />
              <h2 className="font-bold text-[#1e293b] text-[15px]">{tx.recentTransactions}</h2>
            </div>
          </div>
          {recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#f1f5f9] bg-[#fafbfc]">
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{tx.date}</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Type</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Détail</th>
                    <th className="text-right px-6 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{tx.amount}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {recentTransactions.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#fafbfc] transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={11} className="text-[#94a3b8]" />
                          <span className="text-[12px] text-[#64748b]">{item.date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          item.type === 'revenue' 
                            ? 'bg-[#f0fdf4] text-[#10b981]' 
                            : 'bg-[#fef2f2] text-[#ef4444]'
                        }`}>
                          {item.type === 'revenue' ? <TrendingUp size={10} /> : <ArrowDownRight size={10} />}
                          {item.type === 'revenue' ? 'Revenu' : 'Dépense'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div>
                          <p className="text-[13px] font-medium text-[#1e293b]">{item.property}</p>
                          {item.source && (
                            <p className="text-[10px] text-[#94a3b8] mt-0.5">via {item.source}</p>
                          )}
                          {item.commission && (
                            <p className="text-[10px] text-[#10b981] mt-0.5">Commission: {formatCurrency(item.commission, lang)}</p>
                          )}
                          {item.category && (
                            <p className="text-[10px] text-[#94a3b8] mt-0.5">Catégorie: {item.category}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className={`font-bold text-[14px] ${item.amount > 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                          {item.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(item.amount), lang)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Receipt size={48} className="mx-auto text-[#cbd5e1] mb-3" />
              <p className="text-[#94a3b8] text-[13px] font-medium">{tx.noData}</p>
              <p className="text-[11px] text-[#cbd5e1] mt-1">Aucune transaction récente trouvée</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}