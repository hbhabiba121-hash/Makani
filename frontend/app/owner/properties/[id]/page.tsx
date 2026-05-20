"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, Calendar, Users, DollarSign, Wallet, TrendingDown, 
  Receipt, TrendingUp, Percent, AlertCircle,
  RefreshCw, ChevronDown, ChevronUp
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import api from "@/lib/axios";
import { useLang } from "../../contexts/LanguageContext";

type Lang = "fr" | "ar";

const t: Record<Lang, Record<string, string>> = {
  fr: {
    back:             "Retour aux propriétés",
    loading:          "Chargement des données...",
    not_found:        "Propriété introuvable",
    quick_snapshot:   "Aperçu rapide",
    total_revenue:    "Revenu total",
    your_earnings:    "Vos gains",
    agency_fee:       "Commission agence",
    total_expenses:   "Dépenses totales",
    occupancy_rate:   "Taux d'occupation",
    total_nights:     "Nuits totales",
    chart_title:      "📈 Revenu vs Dépenses vs Bénéfice net",
    chart_sub:        "Tendance mensuelle de performance",
    improving:        "En hausse",
    stable:           "Stable",
    needs_attention:  "Nécessite attention",
    bookings:         "📅 Réservations",
    bookings_sub:     "Séjours et transactions des clients",
    stays:            "séjours",
    avg_nights:       "Moy.",
    nights_label:     "nuits",
    guest:            "Client",
    source:           "Source",
    dates:            "Dates",
    nights:           "Nuits",
    price_night:      "Prix/Nuit",
    revenue:          "Revenu",
    commission:       "Commission",
    no_bookings:      "Aucune réservation pour",
    expenses_title:   "💸 Répartition des dépenses",
    expenses_sub:     "Coûts de maintenance et d'exploitation",
    total_label:      "total",
    top_label:        "Principal :",
    none_label:       "Aucun",
    by_category:      "Par catégorie",
    category:         "Catégorie",
    description:      "Description",
    date:             "Date",
    amount:           "Montant",
    receipt:          "Reçu",
    hide:             "Masquer",
    view:             "Voir",
    no_receipt:       "Pas de reçu",
    no_expenses:      "Aucune dépense enregistrée pour",
    fin_title:        "💰 Répartition financière",
    fin_sub:          "Comment votre revenu est distribué",
    total_revenue_fin:"Revenu total",
    agency_comm:      "− Commission agence",
    expenses_fin:     "− Dépenses",
    net_profit:       "= Vos gains (Bénéfice net)",
    profit_margin:    "Marge bénéficiaire",
    about_title:      "📝 À propos de cette propriété",
  },
  ar: {
    back:             "العودة إلى العقارات",
    loading:          "جارٍ تحميل البيانات...",
    not_found:        "العقار غير موجود",
    quick_snapshot:   "لمحة سريعة",
    total_revenue:    "إجمالي الإيراد",
    your_earnings:    "أرباحك",
    agency_fee:       "عمولة الوكالة",
    total_expenses:   "إجمالي المصاريف",
    occupancy_rate:   "نسبة الإشغال",
    total_nights:     "إجمالي الليالي",
    chart_title:      "📈 الإيراد مقابل المصاريف مقابل صافي الربح",
    chart_sub:        "الأداء الشهري",
    improving:        "في ارتفاع",
    stable:           "مستقر",
    needs_attention:  "يحتاج اهتماماً",
    bookings:         "📅 الحجوزات",
    bookings_sub:     "إقامات الضيوف والمعاملات",
    stays:            "إقامات",
    avg_nights:       "متوسط",
    nights_label:     "ليلة",
    guest:            "الضيف",
    source:           "المصدر",
    dates:            "التواريخ",
    nights:           "الليالي",
    price_night:      "السعر/الليلة",
    revenue:          "الإيراد",
    commission:       "العمولة",
    no_bookings:      "لا توجد حجوزات لعام",
    expenses_title:   "💸 تفصيل المصاريف",
    expenses_sub:     "تكاليف الصيانة والتشغيل",
    total_label:      "الإجمالي",
    top_label:        "الأعلى:",
    none_label:       "لا شيء",
    by_category:      "حسب الفئة",
    category:         "الفئة",
    description:      "الوصف",
    date:             "التاريخ",
    amount:           "المبلغ",
    receipt:          "الإيصال",
    hide:             "إخفاء",
    view:             "عرض",
    no_receipt:       "لا يوجد إيصال",
    no_expenses:      "لا توجد مصاريف مسجلة لعام",
    fin_title:        "💰 التفصيل المالي",
    fin_sub:          "كيف يتوزع إيرادك",
    total_revenue_fin:"إجمالي الإيراد",
    agency_comm:      "− عمولة الوكالة",
    expenses_fin:     "− المصاريف",
    net_profit:       "= أرباحك (صافي الربح)",
    profit_margin:    "هامش الربح",
    about_title:      "📝 عن هذا العقار",
  },
};

const toNum = (v: any): number => {
  if (v === null || v === undefined || v === "") return 0;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return isFinite(n) ? n : 0;
};

interface Property {
  id: number;
  name: string;
  location: string;
  property_type_display: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm: string;
  description: string;
  images_urls: string[];
}

interface Booking {
  id: number;
  guest_name: string;
  booking_source: string;
  nights: number;
  price_per_night: number;
  revenue: number;
  commission: number;
  net_profit: number;
  check_in: string;
  check_out: string;
  month: number;
  year: number;
  month_display: string;
}

interface Expense {
  id: number;
  category: string;
  amount: string;
  date: string;
  description: string;
  has_receipt: boolean;
  receipt: string | null;
}

interface OccupancyData {
  occupancy_rate: number;
  booked_days: number;
  total_days: number;
  total_revenue: number;
  total_stays: number;
  monthly_breakdown: Array<{
    month: number;
    month_name: string;
    year: number;
    booked_days: number;
    total_days: number;
    occupancy_rate: number;
  }>;
}

export default function OwnerPropertyDetailPage() {

  const router     = useRouter();
  const params     = useParams();
  const propertyId = params.id;

  const { lang } = useLang();
  const tr = (key: string) => t[lang][key] ?? key;
  const isAr = lang === "ar";

  const [property, setProperty]           = useState<Property | null>(null);
  const [bookings, setBookings]           = useState<Booking[]>([]);
  const [expenses, setExpenses]           = useState<Expense[]>([]);
  const [occupancyData, setOccupancyData] = useState<OccupancyData | null>(null);
  const [loading, setLoading]             = useState(true);
  const [selectedYear, setSelectedYear]   = useState(new Date().getFullYear());
  const [showExpenseReceipt, setShowExpenseReceipt] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    bookings: true, expenses: true, financials: true,
  });

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) router.push("/login");
  }, [router]);

  useEffect(() => {
    if (propertyId) fetchData();
  }, [propertyId, selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const propRes = await api.get(`/api/properties/${propertyId}/`);
      setProperty(propRes.data);

      const finRes = await api.get(`/api/financials/monthly-summary/${propertyId}/?year=${selectedYear}`);
      setBookings(finRes.data || []);

      try {
        const expRes = await api.get(`/api/financials/expenses/?property_id=${propertyId}`);
        setExpenses(expRes.data || []);
      } catch { setExpenses([]); }

      try {
        const occRes = await api.get(`/api/financials/property-occupancy/${propertyId}/?year=${selectedYear}`);
        setOccupancyData(occRes.data);
      } catch { setOccupancyData(null); }

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue    = bookings.reduce((sum, b) => sum + toNum(b.revenue), 0);
  const totalCommission = bookings.reduce((sum, b) => sum + toNum(b.commission), 0);
  const totalExpenses   = expenses.reduce((sum, e) => sum + toNum(e.amount), 0);
  const netProfit       = totalRevenue - totalCommission - totalExpenses;
  const occupancyRate   = toNum(occupancyData?.occupancy_rate);
  const totalBookings   = bookings.length;
  const totalNights     = bookings.reduce((sum, b) => sum + toNum(b.nights), 0);
  const avgStayDuration = totalBookings > 0 ? totalNights / totalBookings : 0;

  const monthlyChartData = (() => {
    const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    const data = months.map(month => ({ month, revenue: 0, commission: 0, netProfit: 0 }));
    bookings.forEach(booking => {
      const idx = (booking.month || 1) - 1;
      if (idx >= 0 && idx < 12) {
        data[idx].revenue    += toNum(booking.revenue);
        data[idx].commission += toNum(booking.commission);
        data[idx].netProfit  += toNum(booking.net_profit);
      }
    });
    return data;
  })();

  const expensesByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + toNum(e.amount);
    return acc;
  }, {} as Record<string, number>);

  const expenseCategories = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));
  const COLORS = ['#22c55e','#16a34a','#4ade80','#86efac','#bbf7d0','#dcfce7'];

  const toggleSection = (section: keyof typeof expandedSections) =>
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');

    .pd {
      --green:      #22c55e;
      --green-bg:   #f0fdf4;
      --green-text: #16a34a;
      --green-dim:  rgba(34,197,94,0.1);
      --ink:        #111827;
      --ink-2:      #374151;
      --ink-3:      #6b7280;
      --ink-4:      #9ca3af;
      --border:     #f3f4f6;
      --border-2:   #e5e7eb;
      --bg:         #f9fafb;
      --surface:    #ffffff;
      --f: ${isAr ? "'Cairo'" : "'Geist'"}, system-ui, sans-serif;

      font-family: var(--f);
      background:  var(--bg);
      min-height:  100vh;
      color:       var(--ink);
    }

    .pd-topbar {
      background: var(--surface);
      border-bottom: 1px solid var(--border-2);
      position: sticky; top: 0; z-index: 20;
      padding: 1rem 2rem;
    }
    .pd-back {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; color: var(--ink-3);
      background: none; border: none; cursor: pointer;
      font-family: var(--f); margin-bottom: 10px;
      transition: color 0.12s;
    }
    .pd-back:hover { color: var(--ink); }
    .pd-topbar-row { display: flex; justify-content: space-between; align-items: flex-start; }
    .pd-prop-name { font-size: 22px; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; }
    .pd-prop-meta { font-size: 13px; color: var(--ink-4); margin-top: 4px; display: flex; gap: 6px; align-items: center; }
    .pd-meta-dot  { color: var(--border-2); }

    .pd-topbar-actions { display: flex; align-items: center; gap: 10px; }
    .pd-year-select {
      padding: 7px 12px; border: 1px solid var(--border-2);
      border-radius: 8px; font-size: 13px; font-weight: 500;
      background: var(--surface); color: var(--ink);
      font-family: var(--f); cursor: pointer; outline: none;
      transition: border-color 0.12s;
    }
    .pd-year-select:focus { border-color: var(--green); }
    .pd-refresh {
      padding: 7px; border-radius: 8px; border: 1px solid var(--border-2);
      background: none; color: var(--ink-4); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: color 0.12s, border-color 0.12s;
    }
    .pd-refresh:hover { color: var(--green-text); border-color: var(--green); }

    .pd-body { padding: 2rem; }
    .pd-section-label {
      font-size: 11px; font-weight: 600; letter-spacing: 0.07em;
      color: var(--ink-4); text-transform: uppercase; margin-bottom: 1rem;
    }

    .pd-kpi-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 1rem; margin-bottom: 2rem;
    }
    @media(max-width:1100px){ .pd-kpi-grid { grid-template-columns: repeat(3,1fr); } }
    @media(max-width:640px) { .pd-kpi-grid { grid-template-columns: repeat(2,1fr); } }

    .pd-kpi {
      background: var(--surface);
      border: 1px solid var(--border-2);
      border-radius: 12px; padding: 1rem;
    }
    .pd-kpi-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 11px; color: var(--ink-4); margin-bottom: 8px;
    }
    .pd-kpi-val { font-size: 20px; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; }
    .pd-kpi-val.green  { color: var(--green-text); }
    .pd-kpi-val.red    { color: #ef4444; }
    .pd-kpi-val.orange { color: #f97316; }
    .pd-kpi-val.blue   { color: #2563eb; }

    .pd-card {
      background: var(--surface);
      border: 1px solid var(--border-2);
      border-radius: 16px; overflow: hidden;
      margin-bottom: 1.5rem;
    }
    .pd-chart-card {
      background: var(--surface);
      border: 1px solid var(--border-2);
      border-radius: 16px; padding: 1.5rem;
      margin-bottom: 2rem;
    }
    .pd-chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .pd-chart-title  { font-size: 16px; font-weight: 700; color: var(--ink); }
    .pd-chart-sub    { font-size: 12px; color: var(--ink-4); margin-top: 3px; }
    .pd-trend { display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 500; }

    .pd-toggle {
      width: 100%; display: flex; justify-content: space-between; align-items: center;
      padding: 1.25rem 1.5rem; background: none; border: none;
      cursor: pointer; font-family: var(--f); transition: background 0.12s;
    }
    .pd-toggle:hover { background: var(--bg); }
    .pd-toggle-title { font-size: 16px; font-weight: 700; color: var(--ink); text-align: ${isAr ? "right" : "left"}; }
    .pd-toggle-sub   { font-size: 12px; color: var(--ink-4); margin-top: 3px; }
    .pd-toggle-right { display: flex; align-items: center; gap: 14px; }
    .pd-toggle-stat  { font-size: 13px; font-weight: 600; color: var(--ink); text-align: right; }
    .pd-toggle-stat-sub { font-size: 11px; color: var(--ink-4); }

    .pd-table-wrap { overflow-x: auto; border-top: 1px solid var(--border); }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: var(--bg); }
    thead th {
      padding: 10px 20px; text-align: ${isAr ? "right" : "left"};
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.06em; color: var(--green-text);
    }
    tbody tr { border-top: 1px solid var(--border); transition: background 0.1s; }
    tbody tr:hover { background: var(--bg); }
    tbody td { padding: 12px 20px; font-size: 13px; color: var(--ink-2); }
    .td-bold  { font-weight: 600; color: var(--ink); }
    .td-muted { color: var(--ink-4); }
    .td-red   { color: #ef4444; }
    .td-green { color: var(--green-text); font-weight: 600; }
    .td-badge {
      display: inline-block; font-size: 11px; font-weight: 500;
      padding: 2px 8px; border-radius: 999px;
      background: var(--bg); color: var(--ink-3);
    }

    .pd-cols { display: grid; grid-template-columns: 1fr 340px; gap: 1.5rem; }
    @media(max-width:900px){ .pd-cols { grid-template-columns: 1fr; } }

    .pd-fin-body  { padding: 1.5rem; border-top: 1px solid var(--border); }
    .pd-fin-row   { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border); }
    .pd-fin-row:last-of-type { border-bottom: none; }
    .pd-fin-label { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--ink-2); }
    .pd-fin-dot   { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .pd-fin-val   { font-size: 13px; font-weight: 600; color: var(--ink); }
    .pd-fin-total { display: flex; justify-content: space-between; align-items: center; padding-top: 14px; margin-top: 4px; }
    .pd-fin-total-label { font-size: 14px; font-weight: 700; color: var(--ink); display: flex; align-items: center; gap: 10px; }
    .pd-fin-total-val   { font-size: 22px; font-weight: 700; color: var(--green-text); }

    .pd-margin-label { font-size: 12px; color: var(--ink-4); margin-bottom: 6px; display: flex; justify-content: space-between; }
    .pd-margin-bar   { height: 6px; background: var(--border-2); border-radius: 999px; overflow: hidden; margin-top: 14px; }
    .pd-margin-fill  { height: 100%; background: var(--green); border-radius: 999px; transition: width 0.4s; }

    .pd-exp-grid { display: grid; grid-template-columns: 180px 1fr; gap: 1.5rem; padding: 1.5rem; border-top: 1px solid var(--border); }
    @media(max-width:700px){ .pd-exp-grid { grid-template-columns: 1fr; } }

    .pd-about { background: var(--surface); border: 1px solid var(--border-2); border-radius: 16px; padding: 1.25rem 1.5rem; }
    .pd-about-title { font-size: 14px; font-weight: 600; color: var(--ink); margin-bottom: 8px; }
    .pd-about-text  { font-size: 13px; color: var(--ink-3); line-height: 1.65; }

    .pd-center { min-height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 12px; background: var(--bg); font-family: var(--f); }
    .pd-spinner { width: 44px; height: 44px; border-radius: 50%; border: 3px solid var(--green-bg); border-top: 3px solid var(--green); animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .pd-loading-text { font-size: 13px; color: var(--ink-4); }
  `;

  if (loading) return (
    <>
      <style>{css}</style>
      <div className="pd pd-center">
        <div className="pd-spinner" />
        <span className="pd-loading-text">{tr("loading")}</span>
      </div>
    </>
  );

  if (!property) return (
    <>
      <style>{css}</style>
      <div className="pd pd-center">
        <span className="pd-loading-text">{tr("not_found")}</span>
      </div>
    </>
  );

  const profitMarginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const commissionPct   = totalRevenue > 0 ? ((totalCommission / totalRevenue) * 100).toFixed(0) : 15;
  const occColor        = occupancyRate >= 50 ? "#16a34a" : occupancyRate >= 30 ? "#ca8a04" : "#ef4444";

  return (
    <>
      <style>{css}</style>
      <div className="pd" dir={isAr ? "rtl" : "ltr"}>

        <div className="pd-topbar">
          <button className="pd-back" onClick={() => router.back()}>
            <ArrowLeft size={15} strokeWidth={1.8} style={{ transform: isAr ? "scaleX(-1)" : undefined }} />
            {tr("back")}
          </button>
          <div className="pd-topbar-row">
            <div>
              <div className="pd-prop-name">{property.name}</div>
              <div className="pd-prop-meta">
                <span>{property.location}</span>
                <span className="pd-meta-dot">•</span>
                <span>{property.bedrooms} beds · {property.bathrooms} baths</span>
                {property.area_sqm && <><span className="pd-meta-dot">•</span><span>{property.area_sqm} m²</span></>}
              </div>
            </div>
            <div className="pd-topbar-actions">
              <select className="pd-year-select" value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}>
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
              <button className="pd-refresh" onClick={fetchData}>
                <RefreshCw size={16} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </div>

        <div className="pd-body">

          <div className="pd-section-label">{tr("quick_snapshot")}</div>
          <div className="pd-kpi-grid">
            <div className="pd-kpi">
              <div className="pd-kpi-label"><DollarSign size={14} color="var(--green-text)" />{tr("total_revenue")}</div>
              <div className="pd-kpi-val">{totalRevenue.toLocaleString()} MAD</div>
            </div>
            <div className="pd-kpi">
              <div className="pd-kpi-label"><Wallet size={14} color="#16a34a" />{tr("your_earnings")}</div>
              <div className="pd-kpi-val green">{netProfit.toLocaleString()} MAD</div>
            </div>
            <div className="pd-kpi">
              <div className="pd-kpi-label"><TrendingDown size={14} color="#ef4444" />{tr("agency_fee")}</div>
              <div className="pd-kpi-val red">{totalCommission.toLocaleString()} MAD</div>
            </div>
            <div className="pd-kpi">
              <div className="pd-kpi-label"><Receipt size={14} color="#f97316" />{tr("total_expenses")}</div>
              <div className="pd-kpi-val orange">{totalExpenses.toLocaleString()} MAD</div>
            </div>
            <div className="pd-kpi">
              <div className="pd-kpi-label"><Percent size={14} color="#2563eb" />{tr("occupancy_rate")}</div>
              <div className="pd-kpi-val" style={{ color: occColor }}>{occupancyRate.toFixed(1)}%</div>
            </div>
            <div className="pd-kpi">
              <div className="pd-kpi-label"><Users size={14} color="var(--ink-4)" />{tr("total_nights")}</div>
              <div className="pd-kpi-val">{totalNights}</div>
            </div>
          </div>

          <div className="pd-chart-card">
            <div className="pd-chart-header">
              <div>
                <div className="pd-chart-title">{tr("chart_title")}</div>
                <div className="pd-chart-sub">{tr("chart_sub")}</div>
              </div>
              {occupancyRate >= 50 ? (
                <span className="pd-trend" style={{ color: "#16a34a" }}><TrendingUp size={15} />{tr("improving")}</span>
              ) : occupancyRate >= 30 ? (
                <span className="pd-trend" style={{ color: "#ca8a04" }}><AlertCircle size={15} />{tr("stable")}</span>
              ) : (
                <span className="pd-trend" style={{ color: "#ef4444" }}><TrendingDown size={15} />{tr("needs_attention")}</span>
              )}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyChartData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} MAD`]} />
                <Area type="monotone" dataKey="revenue"    name={tr("revenue")}    stroke="#22c55e" strokeWidth={2} fill="url(#revGrad)" />
                <Area type="monotone" dataKey="commission" name={tr("commission")} stroke="#ef4444" strokeWidth={2} fill="none" strokeDasharray="5 5" />
                <Area type="monotone" dataKey="netProfit"  name={tr("net_profit")} stroke="#16a34a" strokeWidth={2} fill="url(#profGrad)" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="pd-cols">

            <div>
              <div className="pd-card">
                <button className="pd-toggle" onClick={() => toggleSection('bookings')}>
                  <div>
                    <div className="pd-toggle-title">{tr("bookings")}</div>
                    <div className="pd-toggle-sub">{tr("bookings_sub")}</div>
                  </div>
                  <div className="pd-toggle-right">
                    <div>
                      <div className="pd-toggle-stat">{totalBookings} {tr("stays")}</div>
                      <div className="pd-toggle-stat-sub">{tr("avg_nights")} {avgStayDuration.toFixed(1)} {tr("nights_label")}</div>
                    </div>
                    {expandedSections.bookings ? <ChevronUp size={18} color="var(--ink-4)" /> : <ChevronDown size={18} color="var(--ink-4)" />}
                  </div>
                </button>
                {expandedSections.bookings && (
                  <div className="pd-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>{tr("guest")}</th><th>{tr("source")}</th><th>{tr("dates")}</th>
                          <th>{tr("nights")}</th><th>{tr("price_night")}</th><th>{tr("revenue")}</th><th>{tr("commission")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map(b => (
                          <tr key={b.id}>
                            <td className="td-bold">{b.guest_name || 'Guest'}</td>
                            <td><span className="td-badge">{b.booking_source || 'Direct'}</span></td>
                            <td className="td-muted">
                              {b.check_in ? `${b.check_in} → ${b.check_out}` : `${b.month_display} ${b.year}`}
                            </td>
                            <td className="td-muted">{toNum(b.nights)}</td>
                            <td className="td-muted">{toNum(b.price_per_night).toLocaleString()} MAD</td>
                            <td style={{ fontWeight: 600 }}>{toNum(b.revenue).toLocaleString()} MAD</td>
                            <td className="td-red">{toNum(b.commission).toLocaleString()} MAD</td>
                          </tr>
                        ))}
                        {bookings.length === 0 && (
                          <tr>
                            <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--ink-4)" }}>
                              {tr("no_bookings")} {selectedYear}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="pd-card">
                <button className="pd-toggle" onClick={() => toggleSection('expenses')}>
                  <div>
                    <div className="pd-toggle-title">{tr("expenses_title")}</div>
                    <div className="pd-toggle-sub">{tr("expenses_sub")}</div>
                  </div>
                  <div className="pd-toggle-right">
                    <div>
                      <div className="pd-toggle-stat" style={{ color: "#ef4444" }}>
                        {totalExpenses.toLocaleString()} MAD {tr("total_label")}
                      </div>
                      <div className="pd-toggle-stat-sub">
                        {tr("top_label")} {Object.entries(expensesByCategory).sort((a,b)=>b[1]-a[1])[0]?.[0] || tr("none_label")}
                      </div>
                    </div>
                    {expandedSections.expenses ? <ChevronUp size={18} color="var(--ink-4)" /> : <ChevronDown size={18} color="var(--ink-4)" />}
                  </div>
                </button>
                {expandedSections.expenses && (
                  expenses.length > 0 ? (
                    <div className="pd-exp-grid">
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", marginBottom: 10 }}>{tr("by_category")}</div>
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie data={expenseCategories} cx="50%" cy="50%"
                              innerRadius={35} outerRadius={60} dataKey="value"
                              label={({ percent }) => `${(percent*100).toFixed(0)}%`}>
                              {expenseCategories.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={v => `${Number(v).toLocaleString()} MAD`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ overflowX: "auto" }}>
                        <table>
                          <thead>
                            <tr>
                              <th>{tr("category")}</th><th>{tr("description")}</th>
                              <th>{tr("date")}</th><th>{tr("amount")}</th><th>{tr("receipt")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {expenses.map(e => (
                              <tr key={e.id}>
                                <td>{e.category}</td>
                                <td className="td-muted">{e.description || '–'}</td>
                                <td className="td-muted">{e.date}</td>
                                <td className="td-red">{toNum(e.amount).toLocaleString()} MAD</td>
                                <td>
                                  {e.has_receipt ? (
                                    <button style={{ fontSize: 12, color: "var(--green-text)", background: "none", border: "none", cursor: "pointer" }}
                                      onClick={() => setShowExpenseReceipt(showExpenseReceipt === e.id ? null : e.id)}>
                                      {showExpenseReceipt === e.id ? tr("hide") : tr("view")}
                                    </button>
                                  ) : (
                                    <span className="td-muted" style={{ fontSize: 12 }}>{tr("no_receipt")}</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--ink-4)", fontSize: 13, borderTop: "1px solid var(--border)" }}>
                      {tr("no_expenses")} {selectedYear}
                    </div>
                  )
                )}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="pd-card" style={{ position: "sticky", top: 80 }}>
                <button className="pd-toggle" onClick={() => toggleSection('financials')}>
                  <div>
                    <div className="pd-toggle-title">{tr("fin_title")}</div>
                    <div className="pd-toggle-sub">{tr("fin_sub")}</div>
                  </div>
                  {expandedSections.financials ? <ChevronUp size={18} color="var(--ink-4)" /> : <ChevronDown size={18} color="var(--ink-4)" />}
                </button>
                {expandedSections.financials && (
                  <div className="pd-fin-body">
                    <div className="pd-fin-row">
                      <div className="pd-fin-label">
                        <div className="pd-fin-dot" style={{ background: "var(--green)" }} />
                        {tr("total_revenue_fin")}
                      </div>
                      <div className="pd-fin-val">{totalRevenue.toLocaleString()} MAD</div>
                    </div>
                    <div className="pd-fin-row" style={{ paddingLeft: 12 }}>
                      <div className="pd-fin-label">
                        <div className="pd-fin-dot" style={{ background: "#ef4444" }} />
                        <span style={{ color: "var(--ink-3)" }}>{tr("agency_comm")} ({commissionPct}%)</span>
                      </div>
                      <span style={{ color: "#ef4444", fontWeight: 600, fontSize: 13 }}>-{totalCommission.toLocaleString()} MAD</span>
                    </div>
                    <div className="pd-fin-row" style={{ paddingLeft: 12 }}>
                      <div className="pd-fin-label">
                        <div className="pd-fin-dot" style={{ background: "#f97316" }} />
                        <span style={{ color: "var(--ink-3)" }}>{tr("expenses_fin")}</span>
                      </div>
                      <span style={{ color: "#f97316", fontWeight: 600, fontSize: 13 }}>-{totalExpenses.toLocaleString()} MAD</span>
                    </div>
                    <div className="pd-fin-total">
                      <div className="pd-fin-total-label">
                        <div className="pd-fin-dot" style={{ background: "var(--green-text)" }} />
                        {tr("net_profit")}
                      </div>
                      <div className="pd-fin-total-val">{netProfit.toLocaleString()} MAD</div>
                    </div>
                    <div className="pd-margin-bar" style={{ marginTop: 20 }}>
                      <div className="pd-margin-fill" style={{ width: `${Math.max(0, Math.min(100, profitMarginPct))}%` }} />
                    </div>
                    <div className="pd-margin-label" style={{ marginTop: 6 }}>
                      <span>{tr("profit_margin")}</span>
                      <span style={{ color: "var(--green-text)", fontWeight: 600 }}>{profitMarginPct.toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </div>

              {property.description && (
                <div className="pd-about">
                  <div className="pd-about-title">{tr("about_title")}</div>
                  <div className="pd-about-text">{property.description}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}