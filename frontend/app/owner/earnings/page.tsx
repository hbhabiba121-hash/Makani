"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, TrendingDown, Wallet, DollarSign, Receipt, Calendar, Filter } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import api from "@/lib/axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useLang } from "@/app/components/contexts/LanguageContext";

const i18n = {
  fr: {
    breadcrumb:       "Accueil › Revenus",
    title:            "Détail des revenus",
    subtitle:         "Suivez exactement d'où vient votre argent et où il va",
    filter:           "Filtrer",
    exportPDF:        "Exporter PDF",
    generating:       "Génération...",
    year:             "Année",
    month:            "Mois",
    resetFilters:     "Réinitialiser",
    totalRevenue:     "Revenus totaux",
    totalExpenses:    "Dépenses totales",
    opCosts:          "Coûts opérationnels",
    agencyComm:       "Commission agence",
    pctRevenue:       "% des revenus",
    netProfit:        "Votre bénéfice net",
    afterComm:        "Après commission & dépenses",
    monthlyTrend:     (y: number) => `📈 Tendance mensuelle des revenus (${y})`,
    revDist:          (l: string) => `🥧 Répartition des revenus (${l})`,
    expByCat:         (l: string) => `💸 Dépenses par catégorie (${l})`,
    finBreakdown:     (l: string) => `💰 Détail financier (${l})`,
    totalRevBook:     "Revenus totaux des réservations",
    agencyCommPct:    (p: string) => `− Commission agence (${p}%)`,
    expensesDetail:   "− Dépenses (Ménage, WiFi, Maintenance, etc.)",
    yourEarnings:     "= Vos revenus (Bénéfice net)",
    profitMargin:     "Marge bénéficiaire",
    ledger:           (l: string) => `📋 Grand livre des revenus (${l})`,
    searchPlaceholder:"Rechercher par propriété ou date...",
    date:             "Date",
    propName:         "Propriété",
    revenue:          "Revenus",
    expenses:         "Dépenses",
    commission:       "Commission",
    netToOwner:       "Net propriétaire",
    noEarnings:       (l: string) => `Aucun revenu trouvé pour ${l}`,
    totalRev:         "Revenus totaux",
    totalExp:         "Dépenses totales",
    fullYear:         (y: number) => `Année complète ${y}`,
    loading:          "Chargement des données...",
    yourEarningsLbl:  "Vos gains",
    agencyFee:        "Frais agence",
    expensesLbl:      "Dépenses",
    revenue_chart:    "Revenus",
    commission_chart: "Commission",
    expenses_chart:   "Dépenses",
    netProfit_chart:  "Bénéfice net",
    months: ["Tous les mois","Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"],
  },
  ar: {
    breadcrumb:       "الرئيسية › الإيرادات",
    title:            "تفاصيل الإيرادات",
    subtitle:         "تتبع مصادر أموالك ووجهاتها بدقة",
    filter:           "تصفية",
    exportPDF:        "تصدير PDF",
    generating:       "جارٍ التوليد...",
    year:             "السنة",
    month:            "الشهر",
    resetFilters:     "إعادة تعيين",
    totalRevenue:     "إجمالي الإيرادات",
    totalExpenses:    "إجمالي المصروفات",
    opCosts:          "التكاليف التشغيلية",
    agencyComm:       "عمولة الوكالة",
    pctRevenue:       "% من الإيرادات",
    netProfit:        "صافي ربحك",
    afterComm:        "بعد العمولة والمصروفات",
    monthlyTrend:     (y: number) => `📈 الاتجاه الشهري للإيرادات (${y})`,
    revDist:          (l: string) => `🥧 توزيع الإيرادات (${l})`,
    expByCat:         (l: string) => `💸 المصروفات حسب الفئة (${l})`,
    finBreakdown:     (l: string) => `💰 التفاصيل المالية (${l})`,
    totalRevBook:     "إجمالي إيرادات الحجوزات",
    agencyCommPct:    (p: string) => `− عمولة الوكالة (${p}%)`,
    expensesDetail:   "− المصروفات (تنظيف، واي فاي، صيانة، إلخ)",
    yourEarnings:     "= أرباحك (صافي الربح)",
    profitMargin:     "هامش الربح",
    ledger:           (l: string) => `📋 سجل الإيرادات التفصيلي (${l})`,
    searchPlaceholder:"بحث بالعقار أو التاريخ...",
    date:             "التاريخ",
    propName:         "العقار",
    revenue:          "الإيرادات",
    expenses:         "المصروفات",
    commission:       "العمولة",
    netToOwner:       "صافي المالك",
    noEarnings:       (l: string) => `لا توجد إيرادات لـ ${l}`,
    totalRev:         "إجمالي الإيرادات",
    totalExp:         "إجمالي المصروفات",
    fullYear:         (y: number) => `السنة الكاملة ${y}`,
    loading:          "جارٍ تحميل البيانات...",
    yourEarningsLbl:  "أرباحك",
    agencyFee:        "رسوم الوكالة",
    expensesLbl:      "المصروفات",
    revenue_chart:    "الإيرادات",
    commission_chart: "العمولة",
    expenses_chart:   "المصروفات",
    netProfit_chart:  "صافي الربح",
    months: ["كل الأشهر","يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"],
  },
} as const;

type Lang = "fr" | "ar";

interface Financial {
  id: number;
  property: { id: number; name: string };
  month: number;
  month_display: string;
  year: number;
  revenue: string;
  expenses: string;
  commission?: string | number;
  owner_payout?: string | number;
  net_profit?: string | number;
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
}

interface Property {
  id: number;
  name: string;
  monthly_rent?: string;
}

export default function OwnerEarningsPage() {

  const router = useRouter();
  const { lang } = useLang();
  const tx    = i18n[lang];
  const isRTL = lang === "ar";

  const [financials, setFinancials]   = useState<Financial[]>([]);
  const [properties, setProperties]   = useState<Property[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [exporting, setExporting]     = useState(false);
  const [selectedYear, setSelectedYear]   = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [showFilters, setShowFilters]     = useState(false);

  const MONTHS = tx.months.map((label, value) => ({ value, label }));

  const getExpensesForMonth = (month: number, year: number) =>
    allExpenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      })
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) router.push("/login");
  }, [router]);

  useEffect(() => { fetchData(); }, [selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const propsRes  = await api.get("/api/properties/");
      const propsData = Array.isArray(propsRes.data) ? propsRes.data : propsRes.data.results ?? [];
      setProperties(propsData);

      const allFinancials: Financial[] = [];
      for (const prop of propsData) {
        try {
          const finRes = await api.get(`/api/financials/monthly-summary/${prop.id}/?year=${selectedYear}`);
          let finData  = Array.isArray(finRes.data) ? finRes.data : [];
          if (selectedMonth !== 0)
            finData = finData.filter((item: any) => item.month === selectedMonth);
          const processed = finData.map((item: any) => ({
            ...item,
            revenue:      item.revenue    || 0,
            expenses:     item.expenses   || 0,
            commission:   item.commission || (Number(item.revenue) * 0.15),
            owner_payout: item.net_profit || (Number(item.revenue) * 0.85),
          }));
          allFinancials.push(...processed);
        } catch { console.warn(`No financial data for property ${prop.id}`); }
      }
      allFinancials.sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);
      setFinancials(allFinancials);

      const allExpData: Expense[] = [];
      for (const prop of propsData) {
        try {
          const expRes = await api.get(`/api/financials/expenses/?property_id=${prop.id}`);
          let expData  = expRes.data || [];
          if (selectedMonth !== 0) {
            expData = expData.filter((e: Expense) => {
              const d = new Date(e.date);
              return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
            });
          } else {
            expData = expData.filter((e: Expense) => new Date(e.date).getFullYear() === selectedYear);
          }
          allExpData.push(...expData);
        } catch { console.warn(`No expenses for property ${prop.id}`); }
      }
      setAllExpenses(allExpData);

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (!loading) fetchData(); }, [selectedMonth]);

  const handleExportPDF = () => {
    setExporting(true);
    try {
      const doc        = new jsPDF();
      const monthLabel = selectedMonth === 0
        ? tx.fullYear(selectedYear)
        : `${MONTHS[selectedMonth]?.label} ${selectedYear}`;

      doc.setFontSize(18); doc.setTextColor(22, 163, 74);
      doc.text("Makani — " + tx.title, 14, 20);
      doc.setFontSize(11); doc.setTextColor(100);
      doc.text(monthLabel, 14, 28);
      doc.setFontSize(12); doc.setTextColor(0);
      doc.text(`${tx.totalRevenue}: ${totalRevenue.toLocaleString()} MAD`, 14, 40);
      doc.text(`${tx.agencyComm}: -${totalCommission.toLocaleString()} MAD`, 14, 48);
      doc.text(`${tx.totalExpenses}: -${totalExpenses.toLocaleString()} MAD`, 14, 56);
      doc.setTextColor(22, 163, 74);
      doc.text(`${tx.netProfit}: ${totalNetProfit.toLocaleString()} MAD`, 14, 64);
      doc.setTextColor(0);

      const tableData = financials.map(f => {
        const rowExp = getExpensesForMonth(f.month, f.year); 
        return [
          `${f.month_display} ${f.year}`,
          f.property.name,
          `${Number(f.revenue).toLocaleString()} MAD`,
          `${rowExp.toLocaleString()} MAD`,
          `-${Number(f.commission).toLocaleString()} MAD`,
          `${Number(f.owner_payout || f.net_profit || 0).toLocaleString()} MAD`,
        ];
      });

      autoTable(doc, {
        startY: 72,
        head: [[tx.date, tx.propName, tx.revenue, tx.expenses, tx.commission, tx.netToOwner]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [22, 163, 74], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
      });

      doc.save(`Earnings_${selectedYear}${selectedMonth ? `_${MONTHS[selectedMonth]?.label}` : ""}.pdf`);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const totalRevenue    = financials.reduce((s, f) => s + Number(f.revenue    || 0), 0);
  const totalExpenses   = allExpenses.reduce((s, e) => s + Number(e.amount    || 0), 0);
  const totalCommission = financials.reduce((s, f) => s + Number(f.commission || 0), 0);
  const totalNetProfit  = financials.reduce((s, f) => s + Number(f.owner_payout || f.net_profit || 0), 0);

  const monthlyChartData = (() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const data   = months.map(m => ({ month: m, revenue: 0, commission: 0, expenses: 0, netProfit: 0 }));
    financials.forEach(f => {
      const i = (f.month || 1) - 1;
      if (i >= 0 && i < 12) {
        data[i].revenue    += Number(f.revenue    || 0);
        data[i].commission += Number(f.commission || 0);
        data[i].netProfit  += Number(f.owner_payout || f.net_profit || 0);
      }
    });
    allExpenses.forEach(e => {
      const d = new Date(e.date);
      const i = d.getMonth();
      if (i >= 0 && i < 12 && d.getFullYear() === selectedYear)
        data[i].expenses += Number(e.amount || 0);
    });
    return data;
  })();

  const expensesByCategory = allExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {} as Record<string, number>);
  const expenseCategories = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));
  const COLORS = ['#22c55e','#16a34a','#4ade80','#86efac','#bbf7d0','#dcfce7'];

  const revenueBreakdown = [
    { name: tx.yourEarningsLbl, value: totalNetProfit,  color: '#22c55e' },
    { name: tx.agencyFee,       value: totalCommission, color: '#ef4444' },
    { name: tx.expensesLbl,     value: totalExpenses,   color: '#f97316' },
  ].filter(item => item.value > 0);

  const filtered = financials.filter(f =>
    f.property.name.toLowerCase().includes(search.toLowerCase()) ||
    f.month_display?.toLowerCase().includes(search.toLowerCase())
  );

  const getMonthLabel = () =>
    selectedMonth === 0 ? tx.fullYear(selectedYear) : `${MONTHS[selectedMonth]?.label} ${selectedYear}`;

  const dir = isRTL ? "rtl" : "ltr";
  const ff  = isRTL ? "'Cairo'" : "'Geist'";
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');
    .oe { font-family: ${ff}, system-ui, sans-serif; direction: ${dir}; }
  `;

  if (loading) return (
    <div className="p-8 bg-[#f9fafb] min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22c55e] mx-auto" />
        <p className="mt-4 text-gray-600">{tx.loading}</p>
      </div>
    </div>
  );

  return (
    <>
      <style>{css}</style>
      <div className="oe p-8 bg-[#f9fafb] min-h-screen">

        <div className={`flex justify-between items-start mb-8 flex-wrap gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div>
            <p className="text-sm text-gray-400 mb-1">{tx.breadcrumb}</p>
            <h1 className="text-2xl font-bold text-gray-900">{tx.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{tx.subtitle}</p>
          </div>
          <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 transition-colors ${isRTL ? "flex-row-reverse" : ""}`}>
              <Filter size={16} />{tx.filter}
            </button>
            <button onClick={handleExportPDF} disabled={exporting || financials.length === 0}
              className={`flex items-center gap-2 bg-[#22c55e] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#16a34a] transition-all disabled:opacity-70 ${isRTL ? "flex-row-reverse" : ""}`}>
              {exporting
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <FileText size={16} />}
              {exporting ? tx.generating : tx.exportPDF}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8">
            <div className={`flex flex-wrap gap-4 items-end ${isRTL ? "flex-row-reverse" : ""}`}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{tx.year}</label>
                <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium bg-white focus:outline-none focus:border-[#22c55e]">
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{tx.month}</label>
                <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium bg-white min-w-[140px] focus:outline-none focus:border-[#22c55e]">
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <button onClick={() => { setSelectedYear(new Date().getFullYear()); setSelectedMonth(0); }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                {tx.resetFilters}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className={`flex items-center gap-2 mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <DollarSign size={18} className="text-[#22c55e]" />
              <span className="text-xs text-gray-400">{tx.totalRevenue}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalRevenue.toLocaleString()} MAD</p>
            <p className="text-xs text-gray-400 mt-1">{getMonthLabel()}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className={`flex items-center gap-2 mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <Receipt size={18} className="text-orange-500" />
              <span className="text-xs text-gray-400">{tx.totalExpenses}</span>
            </div>
            <p className="text-2xl font-bold text-orange-500">{totalExpenses.toLocaleString()} MAD</p>
            <p className="text-xs text-gray-400 mt-1">{tx.opCosts}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className={`flex items-center gap-2 mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <TrendingDown size={18} className="text-red-500" />
              <span className="text-xs text-gray-400">{tx.agencyComm}</span>
            </div>
            <p className="text-2xl font-bold text-red-500">{totalCommission.toLocaleString()} MAD</p>
            <p className="text-xs text-gray-400 mt-1">
              {totalRevenue > 0 ? ((totalCommission/totalRevenue)*100).toFixed(0) : 0}{tx.pctRevenue}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className={`flex items-center gap-2 mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <Wallet size={18} className="text-[#22c55e]" />
              <span className="text-xs text-gray-400">{tx.netProfit}</span>
            </div>
            <p className="text-2xl font-bold text-[#22c55e]">{totalNetProfit.toLocaleString()} MAD</p>
            <p className="text-xs text-gray-400 mt-1">{tx.afterComm}</p>
          </div>
        </div>

        {selectedMonth === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8">
            <h2 className="font-bold text-gray-900 text-lg mb-4">{tx.monthlyTrend(selectedYear)}</h2>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={monthlyChartData}>
                <defs>
                  <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => [`${Number(v).toLocaleString()} MAD`]} />
                <Area type="monotone" dataKey="revenue"    name={tx.revenue_chart}    stroke="#22c55e" strokeWidth={2} fill="url(#rGrad)" />
                <Area type="monotone" dataKey="commission" name={tx.commission_chart} stroke="#ef4444" strokeWidth={2} fill="none" strokeDasharray="5 5" />
                <Area type="monotone" dataKey="expenses"   name={tx.expenses_chart}   stroke="#f97316" strokeWidth={2} fill="none" strokeDasharray="5 5" />
                <Area type="monotone" dataKey="netProfit"  name={tx.netProfit_chart}  stroke="#16a34a" strokeWidth={2} fill="url(#pGrad)" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {revenueBreakdown.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8">
            <h2 className="font-bold text-gray-900 text-lg mb-4">{tx.revDist(getMonthLabel())}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={revenueBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                    {revenueBreakdown.map((item, i) => <Cell key={i} fill={item.color} />)}
                  </Pie>
                  <Tooltip formatter={v => `${Number(v).toLocaleString()} MAD`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {revenueBreakdown.map(item => (
                  <div key={item.name} className={`flex justify-between items-center p-3 border-b border-gray-100 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{item.value.toLocaleString()} MAD</span>
                  </div>
                ))}
                <div className="pt-3 mt-2 border-t-2 border-gray-200">
                  <div className={`flex justify-between items-center ${isRTL ? "flex-row-reverse" : ""}`}>
                    <span className="font-bold text-gray-900">{tx.totalRev}</span>
                    <span className="font-bold text-gray-900">{totalRevenue.toLocaleString()} MAD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {expenseCategories.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8">
            <h2 className="font-bold text-gray-900 text-lg mb-4">{tx.expByCat(getMonthLabel())}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={expenseCategories}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => `${Number(v).toLocaleString()} MAD`} />
                  <Bar dataKey="value" fill="#22c55e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {expenseCategories.map(cat => (
                  <div key={cat.name} className={`flex justify-between items-center p-2 border-b border-gray-100 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <span className="text-sm text-gray-600">{cat.name}</span>
                    <span className="font-semibold text-orange-500">{cat.value.toLocaleString()} MAD</span>
                  </div>
                ))}
                <div className="pt-2 mt-2 border-t-2 border-gray-200">
                  <div className={`flex justify-between items-center ${isRTL ? "flex-row-reverse" : ""}`}>
                    <span className="font-bold text-gray-900">{tx.totalExp}</span>
                    <span className="font-bold text-orange-500">{totalExpenses.toLocaleString()} MAD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-[#f0fdf4] rounded-2xl p-6 mb-8 border border-green-100">
          <h2 className="font-bold text-gray-900 text-lg mb-4">{tx.finBreakdown(getMonthLabel())}</h2>
          <div className="space-y-3 max-w-2xl">
            <div className={`flex justify-between items-center pb-3 border-b border-green-200 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className="w-2 h-2 bg-[#22c55e] rounded-full" />
                <span className="text-gray-700">{tx.totalRevBook}</span>
              </div>
              <span className="font-semibold text-gray-900">{totalRevenue.toLocaleString()} MAD</span>
            </div>
            <div className={`flex justify-between items-center pb-3 border-b border-green-200 ${isRTL ? "pr-6 flex-row-reverse" : "pl-6"}`}>
              <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-gray-600">
                  {tx.agencyCommPct(totalRevenue > 0 ? ((totalCommission/totalRevenue)*100).toFixed(0) : "0")}
                </span>
              </div>
              <span className="text-red-500">-{totalCommission.toLocaleString()} MAD</span>
            </div>
            <div className={`flex justify-between items-center pb-3 border-b border-green-200 ${isRTL ? "pr-6 flex-row-reverse" : "pl-6"}`}>
              <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                <span className="text-gray-600">{tx.expensesDetail}</span>
              </div>
              <span className="text-orange-500">-{totalExpenses.toLocaleString()} MAD</span>
            </div>
            <div className={`flex justify-between items-center pt-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className="w-2 h-2 bg-[#22c55e] rounded-full" />
                <span className="font-bold text-gray-900">{tx.yourEarnings}</span>
              </div>
              <span className="text-xl font-bold text-[#22c55e]">{totalNetProfit.toLocaleString()} MAD</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-green-200">
            <div className={`flex justify-between items-center mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <span className="text-sm text-gray-500">{tx.profitMargin}</span>
              <span className="text-sm font-semibold text-[#22c55e]">
                {totalRevenue > 0 ? ((totalNetProfit/totalRevenue)*100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-[#22c55e] h-2 rounded-full transition-all"
                style={{ width: `${totalRevenue > 0 ? Math.min((totalNetProfit/totalRevenue)*100, 100) : 0}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className={`p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isRTL ? "sm:flex-row-reverse" : ""}`}>
            <h2 className="font-bold text-gray-900 text-lg">{tx.ledger(getMonthLabel())}</h2>
            <div className="relative">
              <span className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-gray-400`}>
                <Search size={16} />
              </span>
              <input type="text" placeholder={tx.searchPlaceholder} value={search}
                onChange={e => setSearch(e.target.value)}
                className={`w-64 ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"} py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#22c55e] bg-gray-50`}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ direction: dir }}>
              <thead>
                <tr className="border-t border-gray-100 bg-gray-50">
                  {[tx.date, tx.propName, tx.revenue, tx.expenses, tx.commission, tx.netToOwner].map(h => (
                    <th key={h} className="px-6 py-3 text-sm font-semibold text-[#22c55e]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                      {tx.noEarnings(getMonthLabel())}
                    </td>
                  </tr>
                ) : filtered.map((f, i) => {
                  const rowExpenses = getExpensesForMonth(f.month, f.year);
                  return (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        <div className={`flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                          <Calendar size={12} />
                          {f.month_display} {f.year}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{f.property.name}</td>
                      <td className="px-6 py-4 text-gray-700 font-semibold">{Number(f.revenue).toLocaleString()} MAD</td>
                      <td className="px-6 py-4 text-orange-500">
                        {rowExpenses > 0 ? rowExpenses.toLocaleString() : "0"} MAD
                      </td>
                      <td className="px-6 py-4 text-red-500">{Number(f.commission).toLocaleString()} MAD</td>
                      <td className="px-6 py-4 font-bold text-[#22c55e]">
                        {Number(f.owner_payout || f.net_profit || 0).toLocaleString()} MAD
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}