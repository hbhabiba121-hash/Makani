"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  DollarSign, TrendingUp, Calendar, Filter, 
  Building2, ArrowUp, ArrowDown, Minus, Download,
  RefreshCw, Receipt, Wallet, BarChart3, Eye,
  MessageCircle
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import api from "@/lib/axios";
import { useLang } from "@/app/components/contexts/LanguageContext";

const i18n = {
  fr: {
    filter: "Filtrer",
    totalRevenue: "Revenus totaux",
    guestPayments: "Paiements clients avant commission",
    amountToReceive: "Montant à recevoir",
    afterCommission: "Revenu - Commission",
    totalBookings: "Réservations totales",
    occupancyRate: "Taux d'occupation",
    revenueEvolution: "Évolution des revenus",
    revenueByProperty: "Revenus par propriété",
    revenueByPlatform: "Revenus par plateforme",
    recentActivity: "Activité récente",
    property: "Propriété",
    revenue: "Revenus",
    commission: "Commission",
    amountToReceiveCol: "Montant à recevoir",
    platform: "Plateforme",
    date: "Date",
    guest: "Client",
    allProperties: "Toutes les propriétés",
    month: "Mois",
    quarter: "Trimestre",
    year: "Année",
    custom: "Personnalisé",
    loading: "Chargement...",
    noData: "Aucune donnée",
    growing: "En croissance",
    stable: "Stable",
    declining: "En baisse",
    vsLastMonth: "vs mois dernier",
    contactAgency: "Contacter l'agence",
    contactSupport: "Contacter le support",
    contactMessage: "Vous avez une question sur vos revenus ? Notre équipe est là pour vous aider.",
    refresh: "Actualiser",
    months: ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"],
  },
  ar: {
    filter: "تصفية",
    totalRevenue: "إجمالي الإيرادات",
    guestPayments: "مدفوعات الضيف قبل العمولة",
    amountToReceive: "المبلغ المستحق",
    afterCommission: "الإيرادات - العمولة",
    totalBookings: "إجمالي الحجوزات",
    occupancyRate: "نسبة الإشغال",
    revenueEvolution: "تطور الإيرادات",
    revenueByProperty: "الإيرادات حسب العقار",
    revenueByPlatform: "الإيرادات حسب المنصة",
    recentActivity: "النشاط الأخير",
    property: "العقار",
    revenue: "الإيرادات",
    commission: "العمولة",
    amountToReceiveCol: "المبلغ المستحق",
    platform: "المنصة",
    date: "التاريخ",
    guest: "الضيف",
    allProperties: "جميع العقارات",
    month: "شهر",
    quarter: "ربع سنة",
    year: "سنة",
    custom: "مخصص",
    loading: "جارٍ التحميل...",
    noData: "لا توجد بيانات",
    growing: "في نمو",
    stable: "مستقر",
    declining: "في انخفاض",
    vsLastMonth: "مقارنة بالشهر الماضي",
    contactAgency: "اتصل بالوكالة",
    contactSupport: "اتصل بالدعم",
    contactMessage: "هل لديك سؤال حول إيراداتك؟ فريقنا هنا لمساعدتك.",
    refresh: "تحديث",
    months: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
  },
} as const;

type Period = "month" | "quarter" | "year" | "custom";

interface Property {
  id: number;
  name: string;
  location: string;
}

interface Booking {
  id: number;
  property: number;
  property_name?: string;
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

interface PropertyRevenue {
  propertyId: number;
  propertyName: string;
  revenue: number;
  commission: number;
  amountToReceive: number;
}

interface PlatformRevenue {
  platform: string;
  revenue: number;
}

interface RecentActivity {
  date: string;
  propertyName: string;
  guestName: string;
  revenue: number;
}

const GREEN = "#22c55e";
const GREEN_DARK = "#16a34a";
const GREEN_BG = "#f0fdf4";
const ORANGE = "#f59e0b";
const BLUE = "#3b82f6";
const RED = "#ef4444";

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

export default function RevenuePage() {
  const router = useRouter();
  const { lang } = useLang();
  const tx = i18n[lang];
  const isRTL = lang === "ar";

  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<number>(0);
  const [period, setPeriod] = useState<Period>("year");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor((new Date().getMonth() + 1 - 1) / 3) + 1);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const contactAgency = () => {
    window.open(`https://wa.me/212600000000?text=Bonjour%2C%20j%27ai%20une%20question%20concernant%20mes%20revenus%20immobiliers`, "_blank");
  };

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) router.push("/login");
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [selectedProperty, selectedYear, selectedMonth, selectedQuarter, period, customStartDate, customEndDate]);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const propsRes = await api.get("/api/properties/");
      const propsData = Array.isArray(propsRes.data) ? propsRes.data : propsRes.data.results ?? [];
      setProperties(propsData);

      const allBookings: Booking[] = [];
      const propertiesToFetch = selectedProperty === 0 
        ? propsData 
        : propsData.filter((p: Property) => p.id === selectedProperty);

      for (const prop of propertiesToFetch) {
        try {
          const finRes = await api.get(`/api/financials/monthly-summary/${prop.id}/`);
          const finData = Array.isArray(finRes.data) ? finRes.data : [];
          
          let filtered = finData;
          const now = new Date();
          
          if (period === "month") {
            filtered = finData.filter((item: any) => item.year === selectedYear && item.month === selectedMonth);
          } else if (period === "quarter") {
            const quarterMonths = { 1: [1, 2, 3], 2: [4, 5, 6], 3: [7, 8, 9], 4: [10, 11, 12] };
            const months = quarterMonths[selectedQuarter as keyof typeof quarterMonths];
            filtered = finData.filter((item: any) => item.year === selectedYear && months.includes(item.month));
          } else if (period === "year") {
            filtered = finData.filter((item: any) => item.year === selectedYear);
          } else if (period === "custom" && customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            filtered = finData.filter((item: any) => {
              const itemDate = new Date(item.year, item.month - 1);
              return itemDate >= start && itemDate <= end;
            });
          }
          
          const bookingsWithProp = filtered.map((item: any) => ({
            ...item,
            property: prop.id,
            property_name: prop.name,
            revenue: Number(item.revenue) || 0,
            commission: Number(item.commission) || (Number(item.revenue) * 0.15),
            net_profit: Number(item.net_profit) || (Number(item.revenue) * 0.85),
          }));
          allBookings.push(...bookingsWithProp);
        } catch (err) {
          console.warn(`No booking data for property ${prop.id}`);
        }
      }
      
      setBookings(allBookings);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const totalRevenue = bookings.reduce((sum, b) => sum + b.revenue, 0);
  const totalCommission = bookings.reduce((sum, b) => sum + b.commission, 0);
  const amountToReceive = totalRevenue - totalCommission;
  const totalBookings = bookings.length;
  const totalNights = bookings.reduce((sum, b) => sum + (b.nights || 0), 0);
  const occupancyRate = totalNights > 0 && bookings.length > 0 ? (totalNights / (bookings.length * 30)) * 100 : 0;

  const monthlyRevenueData = () => {
    const months = tx.months;
    const data = months.map((month, index) => {
      const monthNum = index + 1;
      const monthBookings = bookings.filter(b => b.month === monthNum && b.year === selectedYear);
      const revenue = monthBookings.reduce((sum, b) => sum + b.revenue, 0);
      return { month, revenue };
    });
    
    const last3Months = data.slice(-3).filter(m => m.revenue > 0);
    const previous3Months = data.slice(-6, -3).filter(m => m.revenue > 0);
    let trend: "growing" | "stable" | "declining" = "stable";
    if (last3Months.length > 0 && previous3Months.length > 0) {
      const lastAvg = last3Months.reduce((sum, m) => sum + m.revenue, 0) / last3Months.length;
      const prevAvg = previous3Months.reduce((sum, m) => sum + m.revenue, 0) / previous3Months.length;
      if (lastAvg > prevAvg) trend = "growing";
      else if (lastAvg < prevAvg) trend = "declining";
    }
    
    return { data, trend };
  };

  const { data: chartData, trend } = monthlyRevenueData();

  const revenueByProperty = () => {
    const propertyMap = new Map<number, PropertyRevenue>();
    bookings.forEach(booking => {
      const existing = propertyMap.get(booking.property);
      if (existing) {
        existing.revenue += booking.revenue;
        existing.commission += booking.commission;
        existing.amountToReceive += (booking.revenue - booking.commission);
      } else {
        propertyMap.set(booking.property, {
          propertyId: booking.property,
          propertyName: booking.property_name || `Property ${booking.property}`,
          revenue: booking.revenue,
          commission: booking.commission,
          amountToReceive: booking.revenue - booking.commission,
        });
      }
    });
    return Array.from(propertyMap.values());
  };

  const revenueByPlatform = () => {
    const platformMap = new Map<string, number>();
    bookings.forEach(booking => {
      const source = booking.booking_source || "Direct";
      platformMap.set(source, (platformMap.get(source) || 0) + booking.revenue);
    });
    return Array.from(platformMap.entries()).map(([platform, revenue]) => ({ platform, revenue }));
  };

  const recentActivity = () => {
    return bookings
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      })
      .slice(0, 10)
      .map(booking => ({
        date: `${booking.month_display} ${booking.year}`,
        propertyName: booking.property_name || `Property ${booking.property}`,
        guestName: booking.guest_name || "Guest",
        revenue: booking.revenue,
      }));
  };

  const COLORS = [GREEN, BLUE, ORANGE, RED, "#8b5cf6", "#06b6d4"];

  const getTrendIcon = () => {
    if (trend === "growing") return <ArrowUp size={16} />;
    if (trend === "declining") return <ArrowDown size={16} />;
    return <Minus size={16} />;
  };

  const getTrendColor = () => {
    if (trend === "growing") return "#16a34a";
    if (trend === "declining") return "#dc2626";
    return "#f59e0b";
  };

  const getTrendText = () => {
    if (trend === "growing") return tx.growing;
    if (trend === "declining") return tx.declining;
    return tx.stable;
  };

  const kpiCards = [
    { label: tx.totalRevenue, value: formatCurrency(totalRevenue, lang), subtext: tx.guestPayments, icon: <DollarSign size={18} />, color: GREEN, bg: GREEN_BG },
    { label: tx.amountToReceive, value: formatCurrency(amountToReceive, lang), subtext: tx.afterCommission, icon: <Wallet size={18} />, color: GREEN, bg: GREEN_BG, highlight: true },
    { label: tx.totalBookings, value: totalBookings.toString(), subtext: "réservations", icon: <Calendar size={18} />, color: BLUE, bg: "#eff6ff" },
    { label: tx.occupancyRate, value: `${Math.round(occupancyRate)}%`, subtext: "taux d'occupation", icon: <Building2 size={18} />, color: ORANGE, bg: "#fff7ed" },
  ];

  if (loading) {
    return (
      <div style={{ padding: "2rem", background: "#f9fafb", minHeight: "100vh" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {[...Array(4)].map((_, i) => (
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
        {/* Header with actions only */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
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
            <button onClick={contactAgency} style={{
              padding: "8px 18px", borderRadius: 9, border: "none", background: GREEN,
              color: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
              gap: 8, fontSize: 12.5, fontWeight: 500
            }}>
              <MessageCircle size={14} />
              {tx.contactAgency}
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
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 500, color: "#6b7280", marginBottom: 6 }}>{tx.property}</label>
                <select value={selectedProperty} onChange={(e) => setSelectedProperty(Number(e.target.value))}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, background: "#fff" }}>
                  <option value={0}>{tx.allProperties}</option>
                  {properties.map(prop => <option key={prop.id} value={prop.id}>{prop.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 500, color: "#6b7280", marginBottom: 6 }}>Période</label>
                <select value={period} onChange={(e) => setPeriod(e.target.value as Period)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, background: "#fff" }}>
                  <option value="month">{tx.month}</option>
                  <option value="quarter">{tx.quarter}</option>
                  <option value="year">{tx.year}</option>
                  <option value="custom">{tx.custom}</option>
                </select>
              </div>
              {period === "month" && (
                <>
                  <div><label style={{ display: "block", fontSize: 11.5, fontWeight: 500, color: "#6b7280", marginBottom: 6 }}>{tx.year}</label>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13 }}>
                      <option value={2024}>2024</option><option value={2025}>2025</option>
                    </select>
                  </div>
                  <div><label style={{ display: "block", fontSize: 11.5, fontWeight: 500, color: "#6b7280", marginBottom: 6 }}>{tx.month}</label>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13 }}>
                      {tx.months.map((m, idx) => <option key={idx + 1} value={idx + 1}>{m}</option>)}
                    </select>
                  </div>
                </>
              )}
              {period === "quarter" && (
                <>
                  <div><label style={{ display: "block", fontSize: 11.5, fontWeight: 500, color: "#6b7280", marginBottom: 6 }}>{tx.year}</label>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13 }}>
                      <option value={2024}>2024</option><option value={2025}>2025</option>
                    </select>
                  </div>
                  <div><label style={{ display: "block", fontSize: 11.5, fontWeight: 500, color: "#6b7280", marginBottom: 6 }}>{tx.quarter}</label>
                    <select value={selectedQuarter} onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13 }}>
                      <option value={1}>Q1</option><option value={2}>Q2</option><option value={3}>Q3</option><option value={4}>Q4</option>
                    </select>
                  </div>
                </>
              )}
              {period === "year" && (
                <div><label style={{ display: "block", fontSize: 11.5, fontWeight: 500, color: "#6b7280", marginBottom: 6 }}>{tx.year}</label>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13 }}>
                    <option value={2024}>2024</option><option value={2025}>2025</option>
                  </select>
                </div>
              )}
              {period === "custom" && (
                <>
                  <div><label style={{ display: "block", fontSize: 11.5, fontWeight: 500, color: "#6b7280", marginBottom: 6 }}>Date début</label>
                    <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13 }} />
                  </div>
                  <div><label style={{ display: "block", fontSize: 11.5, fontWeight: 500, color: "#6b7280", marginBottom: 6 }}>Date fin</label>
                    <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13 }} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {kpiCards.map((k, i) => (
            <div key={i} style={{
              background: k.highlight ? `linear-gradient(135deg, ${GREEN_BG}, #ffffff)` : "#fff",
              border: k.highlight ? `1px solid ${GREEN}` : "1px solid #f3f4f6",
              borderRadius: 12, padding: "1rem 1.125rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", color: k.color }}>
                  {k.icon}
                </div>
              </div>
              <p style={{ fontSize: 11.5, color: "#9ca3af", marginBottom: 3 }}>{k.label}</p>
              <p style={{ fontSize: 21, fontWeight: 700, color: k.highlight ? GREEN : "#111827", letterSpacing: "-0.02em", lineHeight: 1 }}>{k.value}</p>
              <p style={{ fontSize: 10.5, color: "#d1d5db", marginTop: 4 }}>{k.subtext}</p>
            </div>
          ))}
        </div>

        {/* Revenue Evolution Chart */}
        {chartData.some(d => d.revenue > 0) && (
          <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{tx.revenueEvolution}</p>
                <p style={{ fontSize: 11.5, color: "#9ca3af" }}>{period === "year" ? selectedYear : tx.months[selectedMonth - 1]} {selectedYear}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "#f1f5f9", borderRadius: 20 }}>
                {getTrendIcon()}
                <span style={{ fontSize: 11.5, fontWeight: 500, color: getTrendColor() }}>{getTrendText()}</span>
                <span style={{ fontSize: 10.5, color: "#64748b" }}>{tx.vsLastMonth}</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GREEN} stopOpacity={0.12} />
                    <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="revenue" name={tx.totalRevenue} stroke={GREEN} strokeWidth={2.5} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Revenue by Property & Platform */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {/* Revenue by Property Table */}
          <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f3f4f6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <BarChart3 size={15} color={GREEN} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{tx.revenueByProperty}</p>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>{tx.property}</th>
                    <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>{tx.revenue}</th>
                    <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>{tx.commission}</th>
                    <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 600, color: GREEN }}>{tx.amountToReceiveCol}</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueByProperty().length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>{tx.noData}</td>
                    </tr>
                  ) : (
                    revenueByProperty().map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f9fafb" }}>
                        <td style={{ padding: "11px 14px", fontWeight: 500, color: "#111827" }}>{item.propertyName}</td>
                        <td style={{ padding: "11px 14px", textAlign: "right", color: "#374151", fontWeight: 500 }}>{formatCurrency(item.revenue, lang)}</td>
                        <td style={{ padding: "11px 14px", textAlign: "right", color: "#ef4444" }}>{formatCurrency(item.commission, lang)}</td>
                        <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 600, color: GREEN }}>{formatCurrency(item.amountToReceive, lang)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Revenue by Platform */}
          <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f3f4f6" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{tx.revenueByPlatform}</p>
            </div>
            <div style={{ padding: "1.25rem" }}>
              {revenueByPlatform().length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>{tx.noData}</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {revenueByPlatform().map((item, idx) => {
                    const percentage = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
                    return (
                      <div key={idx}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{item.platform}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{formatCurrency(item.revenue, lang)}</span>
                        </div>
                        <div style={{ width: "100%", height: 6, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${percentage}%`, height: "100%", background: COLORS[idx % COLORS.length], borderRadius: 3 }} />
                        </div>
                        <p style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 4 }}>{percentage.toFixed(1)}%</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Revenue Activity */}
        <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f3f4f6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Receipt size={15} color={GREEN} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{tx.recentActivity}</p>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>{tx.date}</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>{tx.property}</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>{tx.guest}</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>{tx.revenue}</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity().length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>{tx.noData}</td>
                  </tr>
                ) : (
                  recentActivity().map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f9fafb" }}>
                      <td style={{ padding: "11px 14px", color: "#6b7280", fontSize: 12 }}>{item.date}</td>
                      <td style={{ padding: "11px 14px", fontWeight: 500, color: "#111827" }}>{item.propertyName}</td>
                      <td style={{ padding: "11px 14px", color: "#6b7280" }}>{item.guestName}</td>
                      <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 600, color: GREEN }}>{formatCurrency(item.revenue, lang)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Contact Support Section */}
        <div style={{
          marginTop: "1.5rem",
          background: "linear-gradient(135deg, #f0fdf4, #ffffff)",
          border: `1px solid ${GREEN}`,
          borderRadius: 12,
          padding: "1.25rem",
          textAlign: "center"
        }}>
          <MessageCircle size={28} color={GREEN} style={{ marginBottom: "0.5rem" }} />
          <p style={{ fontSize: 13, color: "#374151", marginBottom: "0.5rem" }}>
            {tx.contactMessage}
          </p>
          <button
            onClick={contactAgency}
            style={{
              marginTop: "0.5rem",
              padding: "6px 18px",
              borderRadius: 8,
              border: "none",
              background: GREEN,
              color: "#fff",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 500
            }}
            onMouseEnter={e => e.currentTarget.style.background = GREEN_DARK}
            onMouseLeave={e => e.currentTarget.style.background = GREEN}
          >
            <MessageCircle size={12} />
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