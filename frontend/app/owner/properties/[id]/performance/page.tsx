"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, TrendingUp, Calendar, 
  Wallet, Home, BarChart3, 
  Percent, DollarSign, Briefcase, Award,
  AlertCircle, XCircle
} from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import api from "@/lib/axios";
import { useLang } from "../../../contexts/LanguageContext";

const i18n = {
  fr: {
    back:           "Retour aux propriétés",
    perfRating:     "Note de performance",
    basedOn:        (r: string) => `Basé sur ${r}% d'occupation`,
    netProfitLabel: (y: number) => `Bénéfice net (${y})`,
    profitMargin:   (p: string) => `${p}% de marge`,
    totalBookings:  "Réservations",
    nightsBooked:   (n: number) => `${n} nuit${n > 1 ? "s" : ""} réservée${n > 1 ? "s" : ""}`,
    avgNight:       "Prix moyen / Nuit",
    acrossStays:    (n: number) => `Sur ${n} séjour${n > 1 ? "s" : ""}`,
    occupancy:      "Taux d'occupation",
    ofYear:         (y: number) => `de ${y}`,
    revenueLabel:   (r: string) => `Revenus : ${r} MAD`,
    monthlyRevenue: "Revenus mensuels",
    bookingSources: "Sources de réservation",
    noBookingData:  "Aucune donnée de réservation",
    recentBookings: "Réservations récentes",
    latestStays:    "Derniers séjours enregistrés",
    noBookings:     (y: number) => `Aucune réservation pour ${y}`,
    perNight:       "MAD/nuit",
    insights:       "Analyse de performance",
    occ_title:      "📊 Analyse d'occupation",
    occ_excellent:  "✓ Excellente occupation ! Votre bien est très demandé.",
    occ_good:       "ℹ️ Bon taux. Optimisez vos photos pour attirer plus.",
    occ_low:        "⚠️ Faible occupation. Révisez votre stratégie tarifaire.",
    price_title:    "💰 Stratégie tarifaire",
    price_avg:      (p: string) => `Moyenne ${p} MAD/nuit`,
    price_premium:  " – Positionnement premium !",
    price_mid:      " – Prix compétitif.",
    price_low:      " – En dessous du marché.",
    opp_title:      "🎯 Opportunité de revenus",
    opp_text:       (v: string) => `${v} MAD de potentiel sur les nuits non réservées`,
    opp_focus:      " – Améliorez votre visibilité.",
    loading:        "Chargement des données...",
    notFound:       "Propriété introuvable",
    r_excellent:    "Excellent",
    r_good:         "Bon",
    r_average:      "Moyen",
    r_needs:        "À améliorer",
  },
  ar: {
    back:           "العودة إلى العقارات",
    perfRating:     "تقييم الأداء",
    basedOn:        (r: string) => `بناءً على نسبة إشغال ${r}%`,
    netProfitLabel: (y: number) => `صافي الربح (${y})`,
    profitMargin:   (p: string) => `هامش ربح ${p}%`,
    totalBookings:  "الحجوزات",
    nightsBooked:   (n: number) => `${n} ليلة محجوزة`,
    avgNight:       "متوسط السعر / ليلة",
    acrossStays:    (n: number) => `عبر ${n} إقامة`,
    occupancy:      "نسبة الإشغال",
    ofYear:         (y: number) => `من سنة ${y}`,
    revenueLabel:   (r: string) => `الإيرادات: ${r} درهم`,
    monthlyRevenue: "الإيرادات الشهرية",
    bookingSources: "مصادر الحجز",
    noBookingData:  "لا توجد بيانات حجز",
    recentBookings: "أحدث الحجوزات",
    latestStays:    "آخر الإقامات المسجلة",
    noBookings:     (y: number) => `لا توجد حجوزات لسنة ${y}`,
    perNight:       "درهم/ليلة",
    insights:       "تحليل الأداء",
    occ_title:      "📊 تحليل الإشغال",
    occ_excellent:  "✓ إشغال ممتاز! عقارك مطلوب جداً.",
    occ_good:       "ℹ️ نسبة جيدة. حسّن الصور لجذب المزيد.",
    occ_low:        "⚠️ نسبة منخفضة. راجع استراتيجية التسعير.",
    price_title:    "💰 استراتيجية التسعير",
    price_avg:      (p: string) => `المتوسط ${p} درهم/ليلة`,
    price_premium:  " – تموضع فاخر!",
    price_mid:      " – تسعير تنافسي.",
    price_low:      " – أقل من السوق.",
    opp_title:      "🎯 فرصة الإيرادات",
    opp_text:       (v: string) => `${v} درهم إيرادات محتملة`,
    opp_focus:      " – ركّز على تحسين الظهور.",
    loading:        "جار تحميل البيانات...",
    notFound:       "العقار غير موجود",
    r_excellent:    "ممتاز",
    r_good:         "جيد",
    r_average:      "متوسط",
    r_needs:        "يحتاج تحسيناً",
  },
} as const;

type Lang = "fr" | "ar";

const toNum = (v: any): number => {
  if (v === null || v === undefined || v === "") return 0;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return isFinite(n) ? n : 0;
};

interface Property {
  id: number; name: string; location: string;
  property_type_display: string; monthly_rent: string;
  area_sqm: string; bedrooms: number; bathrooms: number; status_display: string;
}
interface Booking {
  id: number; guest_name: string; booking_source: string;
  nights: number; price_per_night: number; revenue: number;
  commission: number; net_profit: number;
  check_in: string; check_out: string;
  month: number; year: number; month_display: string;
}
interface Expense {
  id: number; category: string; amount: string;
  date: string; description: string; property_name: string;
}
interface OccupancyData {
  occupancy_rate: number; booked_days: number; total_days: number;
  total_revenue: number; total_stays: number;
  monthly_breakdown: Array<{
    month: number; month_name: string; year: number;
    booked_days: number; total_days: number; occupancy_rate: number;
  }>;
}

export default function PropertyPerformancePage() {

  const router     = useRouter();
  const params     = useParams();
  const propertyId = params.id;

  const { lang } = useLang();
  const tx    = i18n[lang];
  const isRTL = lang === "ar";

  const [property, setProperty]           = useState<Property | null>(null);
  const [bookings, setBookings]           = useState<Booking[]>([]);
  const [expenses, setExpenses]           = useState<Expense[]>([]);
  const [occupancyData, setOccupancyData] = useState<OccupancyData | null>(null);
  const [loading, setLoading]             = useState(true);
  const [selectedYear, setSelectedYear]   = useState(new Date().getFullYear());

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) router.push("/login");
  }, [router]);

  useEffect(() => { if (propertyId) fetchData(); }, [propertyId, selectedYear]);

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
    } catch (err) { console.error("Error:", err); }
    finally { setLoading(false); }
  };

  const totalBookings   = bookings.length;
  const totalNights     = bookings.reduce((s, b) => s + toNum(b.nights), 0);
  const totalRevenue    = bookings.reduce((s, b) => s + toNum(b.revenue), 0);
  const totalCommission = bookings.reduce((s, b) => s + toNum(b.commission), 0);
  const totalExpenses   = expenses.reduce((s, e) => s + toNum(e.amount), 0);
  const netProfit       = totalRevenue - totalCommission - totalExpenses;
  const profitMargin    = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const occupancyRate   = toNum(occupancyData?.occupancy_rate) || (totalNights / 365) * 100;

  const avgPricePerNight = totalNights > 0
    ? totalRevenue / totalNights
    : toNum(property?.monthly_rent) / 30;

  const platformDistribution: { [k: string]: number } = {};
  bookings.forEach(b => {
    const src = b.booking_source || "Direct";
    platformDistribution[src] = (platformDistribution[src] || 0) + 1;
  });

  const monthlyChartData = (() => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const data = months.map(month => ({ month, revenue: 0, bookings: 0, nights: 0, avgPrice: 0 }));
    bookings.forEach(b => {
      const idx = (b.month || 1) - 1;
      if (idx >= 0 && idx < 12) {
        data[idx].revenue  += toNum(b.revenue);
        data[idx].bookings += 1;
        data[idx].nights   += toNum(b.nights);
      }
    });
    data.forEach(d => { d.avgPrice = d.nights > 0 ? d.revenue / d.nights : 0; });
    return data;
  })();

  const platformData = Object.entries(platformDistribution).map(([name, value]) => ({ name, value }));
  const COLORS       = ["#22c55e","#16a34a","#4ade80","#86efac","#bbf7d0"];

  const getRating = (rate: number) => {
    if (rate >= 70) return { text: tx.r_excellent, iconBg: "#ffffff", iconColor: "#16a34a", icon: Award };
    if (rate >= 50) return { text: tx.r_good,      iconBg: "#ffffff", iconColor: "#2563eb", icon: TrendingUp };
    if (rate >= 30) return { text: tx.r_average,   iconBg: "#ffffff", iconColor: "#ca8a04", icon: AlertCircle };
    return             { text: tx.r_needs,      iconBg: "#ffffff", iconColor: "#ef4444", icon: XCircle };
  };

  const rating   = getRating(occupancyRate);
  const RIcon    = rating.icon;
  const occColor = occupancyRate >= 50 ? "#16a34a" : occupancyRate >= 30 ? "#ca8a04" : "#ef4444";

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');
    .pp {
      --green:#22c55e;--green-bg:#f0fdf4;--green-text:#16a34a;--green-dim:rgba(34,197,94,0.1);
      --ink:#111827;--ink-2:#374151;--ink-3:#6b7280;--ink-4:#9ca3af;
      --border:#f3f4f6;--border-2:#e5e7eb;--bg:#f9fafb;--surface:#ffffff;
      --f:${isRTL ? "'Cairo'" : "'Geist'"},system-ui,sans-serif;
      font-family:var(--f);direction:${isRTL ? "rtl" : "ltr"};background:var(--bg);min-height:100vh;padding:2rem;color:var(--ink);
    }
    .pp-back{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--ink-3);font-weight:500;background:none;border:none;cursor:pointer;font-family:var(--f);margin-bottom:1rem;transition:color .12s;${isRTL ? "flex-direction:row-reverse;" : ""}}
    .pp-back:hover{color:var(--ink);}
    .pp-header{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem;}
    .pp-title{font-size:22px;font-weight:700;color:var(--ink);letter-spacing:-.02em;}
    .pp-sub{font-size:13px;color:var(--ink-4);margin-top:4px;}
    .pp-meta{font-size:12px;color:var(--ink-4);margin-top:4px;}
    .pp-year-sel{padding:7px 12px;border:1px solid var(--border-2);border-radius:8px;font-size:13px;font-weight:500;background:var(--surface);color:var(--ink);font-family:var(--f);cursor:pointer;outline:none;}
    .pp-year-sel:focus{border-color:var(--green);}
    .pp-score{
      background:linear-gradient(135deg,#14532d 0%,#166534 60%,#15803d 100%);
      border-radius:16px;padding:1.5rem 2rem;
      display:flex;justify-content:space-between;align-items:center;
      flex-wrap:wrap;gap:1.25rem;margin-bottom:2rem;
      box-shadow:0 4px 20px rgba(22,163,74,.25);
      ${isRTL ? "flex-direction:row-reverse;" : ""}
    }
    .pp-score-l{display:flex;align-items:center;gap:1.25rem;${isRTL ? "flex-direction:row-reverse;" : ""}}
    .pp-score-icon{width:60px;height:60px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .pp-score-lbl{font-size:13px;color:rgba(255,255,255,.65);margin-bottom:4px;}
    .pp-score-txt{font-size:24px;font-weight:700;color:#ffffff;}
    .pp-score-hint{font-size:12px;color:rgba(255,255,255,.55);margin-top:4px;}
    .pp-score-r{text-align:${isRTL ? "left" : "right"};}
    .pp-score-r-lbl{font-size:13px;color:rgba(255,255,255,.65);}
    .pp-score-r-val{font-size:32px;font-weight:700;color:#fff;letter-spacing:-.03em;}
    .pp-score-r-sub{font-size:12px;color:rgba(255,255,255,.55);margin-top:4px;}
    .pp-kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:2rem;}
    @media(max-width:900px){.pp-kpi-grid{grid-template-columns:repeat(2,1fr);}}
    @media(max-width:480px){.pp-kpi-grid{grid-template-columns:1fr;}}
    .pp-kpi{background:var(--surface);border:1px solid var(--border-2);border-radius:14px;padding:1.25rem;}
    .pp-kpi-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;${isRTL ? "flex-direction:row-reverse;" : ""}}
    .pp-kpi-icon{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;}
    .pp-kpi-lbl{font-size:11px;color:var(--ink-4);}
    .pp-kpi-val{font-size:22px;font-weight:700;color:var(--ink);letter-spacing:-.02em;}
    .pp-kpi-sub{font-size:11px;color:var(--ink-4);margin-top:4px;}
    .pp-charts{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:2rem;}
    @media(max-width:768px){.pp-charts{grid-template-columns:1fr;}}
    .pp-chart-card{background:var(--surface);border:1px solid var(--border-2);border-radius:16px;padding:1.5rem;}
    .pp-chart-title{font-size:15px;font-weight:700;color:var(--ink);margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center;${isRTL ? "flex-direction:row-reverse;" : ""}}
    .pp-book-card{background:var(--surface);border:1px solid var(--border-2);border-radius:16px;overflow:hidden;margin-bottom:1.5rem;}
    .pp-book-head{padding:1.25rem 1.5rem;border-bottom:1px solid var(--border);}
    .pp-book-title{font-size:15px;font-weight:700;color:var(--ink);}
    .pp-book-sub{font-size:12px;color:var(--ink-4);margin-top:3px;}
    .pp-book-row{padding:1rem 1.5rem;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start;transition:background .1s;${isRTL ? "flex-direction:row-reverse;" : ""}}
    .pp-book-row:hover{background:var(--bg);}
    .pp-book-name{font-size:14px;font-weight:600;color:var(--ink);}
    .pp-book-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:4px;${isRTL ? "flex-direction:row-reverse;" : ""}}
    .pp-book-badge{font-size:11px;background:var(--bg);color:var(--ink-3);padding:2px 8px;border-radius:999px;border:1px solid var(--border-2);}
    .pp-book-dot{color:var(--border-2);font-size:11px;}
    .pp-book-info{font-size:11px;color:var(--ink-4);}
    .pp-book-date{font-size:11px;color:var(--ink-4);margin-top:3px;}
    .pp-book-rev{font-size:15px;font-weight:700;color:var(--green-text);text-align:${isRTL ? "left" : "right"};}
    .pp-book-month{font-size:11px;color:var(--ink-4);text-align:${isRTL ? "left" : "right"};margin-top:3px;}
    .pp-empty{padding:3rem;text-align:center;color:var(--ink-4);display:flex;flex-direction:column;align-items:center;gap:10px;border-top:1px solid var(--border);}
    .pp-empty-txt{font-size:13px;}
    .pp-insights{background:var(--green-bg);border:1px solid rgba(34,197,94,.2);border-radius:16px;padding:1.5rem;}
    .pp-ins-title{font-size:14px;font-weight:600;color:var(--ink);display:flex;align-items:center;gap:8px;margin-bottom:1rem;${isRTL ? "flex-direction:row-reverse;" : ""}}
    .pp-ins-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;}
    @media(max-width:768px){.pp-ins-grid{grid-template-columns:1fr;}}
    .pp-ins-box{background:rgba(255,255,255,.7);border-radius:12px;padding:1rem;}
    .pp-ins-box-title{font-size:13px;font-weight:600;color:var(--ink);margin-bottom:6px;}
    .pp-ins-box-text{font-size:12px;color:var(--ink-3);line-height:1.6;}
    .pp-center{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:var(--bg);font-family:var(--f);}
    .pp-spinner{width:44px;height:44px;border-radius:50%;border:3px solid var(--green-bg);border-top:3px solid var(--green);animation:spin .8s linear infinite;}
    @keyframes spin{to{transform:rotate(360deg);}}
    .pp-center-txt{font-size:13px;color:var(--ink-4);}
  `;

  if (loading) return (
    <><style>{css}</style>
      <div className="pp pp-center">
        <div className="pp-spinner"/><span className="pp-center-txt">{tx.loading}</span>
      </div></>
  );

  if (!property) return (
    <><style>{css}</style>
      <div className="pp pp-center">
        <Home size={48} color="var(--border-2)"/>
        <span className="pp-center-txt">{tx.notFound}</span>
        <button className="pp-back" onClick={() => router.push("/owner/properties")}>← {tx.back}</button>
      </div></>
  );

  return (
    <><style>{css}</style>
    <div className="pp">

      <button className="pp-back" onClick={() => router.back()}>
        <ArrowLeft size={15} strokeWidth={1.8}/> {tx.back}
      </button>

      <div className="pp-header">
        <div>
          <div className="pp-title">{property.name}</div>
          <div className="pp-sub">{property.location} · {property.property_type_display}</div>
          <div className="pp-meta">{property.bedrooms} beds · {property.bathrooms} baths{property.area_sqm && ` · ${property.area_sqm} m²`}</div>
        </div>
        <select className="pp-year-sel" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
          <option value={2024}>2024</option>
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>
      </div>

      {/* Score banner */}
      <div className="pp-score">
        <div className="pp-score-l">
          <div className="pp-score-icon" style={{ background: rating.iconBg }}>
            <RIcon size={28} color={rating.iconColor}/>
          </div>
          <div>
            <div className="pp-score-lbl">{tx.perfRating}</div>
            <div className="pp-score-txt">{rating.text}</div>
            <div className="pp-score-hint">{tx.basedOn(occupancyRate.toFixed(0))}</div>
          </div>
        </div>
        <div className="pp-score-r">
          <div className="pp-score-r-lbl">{tx.netProfitLabel(selectedYear)}</div>
          <div className="pp-score-r-val">{Math.round(netProfit).toLocaleString()} MAD</div>
          <div className="pp-score-r-sub">{tx.profitMargin(profitMargin.toFixed(1))}</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="pp-kpi-grid">
        <div className="pp-kpi">
          <div className="pp-kpi-top">
            <div className="pp-kpi-icon" style={{background:"var(--green-dim)"}}><Calendar size={18} color="var(--green-text)"/></div>
            <span className="pp-kpi-lbl">{tx.totalBookings}</span>
          </div>
          <div className="pp-kpi-val">{totalBookings}</div>
          <div className="pp-kpi-sub">{tx.nightsBooked(totalNights)}</div>
        </div>
        <div className="pp-kpi">
          <div className="pp-kpi-top">
            <div className="pp-kpi-icon" style={{background:"#f0fdf4"}}><DollarSign size={18} color="#16a34a"/></div>
            <span className="pp-kpi-lbl">{tx.avgNight}</span>
          </div>
          <div className="pp-kpi-val">
            {totalNights > 0 ? Math.round(avgPricePerNight).toLocaleString() : "—"} MAD
          </div>
          <div className="pp-kpi-sub">{tx.acrossStays(totalBookings)}</div>
        </div>
        <div className="pp-kpi">
          <div className="pp-kpi-top">
            <div className="pp-kpi-icon" style={{background:"#eff6ff"}}><Percent size={18} color="#2563eb"/></div>
            <span className="pp-kpi-lbl">{tx.occupancy}</span>
          </div>
          <div className="pp-kpi-val" style={{color:occColor}}>{occupancyRate.toFixed(1)}%</div>
          <div className="pp-kpi-sub">{tx.ofYear(selectedYear)}</div>
        </div>
        <div className="pp-kpi">
          <div className="pp-kpi-top">
            <div className="pp-kpi-icon" style={{background:"var(--green-dim)"}}><Wallet size={18} color="var(--green-text)"/></div>
            <span className="pp-kpi-lbl">{tx.netProfitLabel(selectedYear)}</span>
          </div>
          <div className="pp-kpi-val" style={{color:"var(--green-text)"}}>{Math.round(netProfit).toLocaleString()} MAD</div>
          <div className="pp-kpi-sub">{tx.revenueLabel(Math.round(totalRevenue).toLocaleString())}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="pp-charts">
        <div className="pp-chart-card">
          <div className="pp-chart-title">{tx.monthlyRevenue}<TrendingUp size={16} color="var(--ink-4)"/></div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="month" tick={{fontSize:11,fill:"#9ca3af"}}/>
              <YAxis tick={{fontSize:11,fill:"#9ca3af"}} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={v=>[`${Number(v).toLocaleString()} MAD`, lang==="ar"?"الإيرادات":"Revenus"]}/>
              <Bar dataKey="revenue" fill="#22c55e" radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="pp-chart-card">
          <div className="pp-chart-title">{tx.bookingSources}<Briefcase size={16} color="var(--ink-4)"/></div>
          {platformData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={platformData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value"
                  label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                  {platformData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie>
                <Tooltip/>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{height:260,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,color:"var(--ink-4)"}}>
              <Briefcase size={40} color="var(--border-2)"/>
              <span style={{fontSize:13}}>{tx.noBookingData}</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent bookings */}
      <div className="pp-book-card">
        <div className="pp-book-head">
          <div className="pp-book-title">{tx.recentBookings}</div>
          <div className="pp-book-sub">{tx.latestStays}</div>
        </div>
        {bookings.length > 0 ? bookings.slice(0,10).map(b=>(
          <div key={b.id} className="pp-book-row">
            <div>
              <div className="pp-book-name">{b.guest_name||"Guest"}</div>
              <div className="pp-book-meta">
                <span className="pp-book-badge">{b.booking_source||"Direct"}</span>
                <span className="pp-book-dot">·</span>
                <span className="pp-book-info">{toNum(b.nights)} {lang==="ar"?"ليلة":"nuits"}</span>
                <span className="pp-book-dot">·</span>
                <span className="pp-book-info">{toNum(b.price_per_night)} {tx.perNight}</span>
              </div>
              {b.check_in&&<div className="pp-book-date">{b.check_in} → {b.check_out}</div>}
            </div>
            <div>
              <div className="pp-book-rev">{toNum(b.revenue).toLocaleString()} MAD</div>
              <div className="pp-book-month">{b.month_display} {b.year}</div>
            </div>
          </div>
        )) : (
          <div className="pp-empty">
            <Calendar size={40} color="var(--border-2)"/>
            <span className="pp-empty-txt">{tx.noBookings(selectedYear)}</span>
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="pp-insights">
        <div className="pp-ins-title"><BarChart3 size={16} color="var(--green-text)"/>{tx.insights}</div>
        <div className="pp-ins-grid">
          <div className="pp-ins-box">
            <div className="pp-ins-box-title">{tx.occ_title}</div>
            <div className="pp-ins-box-text">
              {occupancyRate>=60?tx.occ_excellent:occupancyRate>=40?tx.occ_good:tx.occ_low}
            </div>
          </div>
          <div className="pp-ins-box">
            <div className="pp-ins-box-title">{tx.price_title}</div>
            <div className="pp-ins-box-text">
              {tx.price_avg(totalNights > 0 ? Math.round(avgPricePerNight).toLocaleString() : "—")}
              {avgPricePerNight>600?tx.price_premium:avgPricePerNight>350?tx.price_mid:tx.price_low}
            </div>
          </div>
          <div className="pp-ins-box">
            <div className="pp-ins-box-title">{tx.opp_title}</div>
            <div className="pp-ins-box-text">
              {tx.opp_text(Math.round((365-totalNights)*avgPricePerNight*0.85).toLocaleString())}
              {occupancyRate<50&&tx.opp_focus}
            </div>
          </div>
        </div>
      </div>

    </div></>
  );
}