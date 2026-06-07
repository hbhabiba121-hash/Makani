"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  DollarSign, TrendingUp, Calendar, Filter, 
  Building2, ArrowUp, ArrowDown, Minus, Download,
  RefreshCw, Receipt, Wallet, BarChart3, Eye,
  PieChart as LucidePieChart, Grid3x3, List, Maximize2, Minimize2,
  MessageCircle
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, 
  PieChart as RePieChart, Pie, Cell
} from "recharts";
import api from "@/lib/axios";
import { useLang } from "@/app/components/contexts/LanguageContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
    refresh: "Actualiser",
    months: ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"],
    expand: "Agrandir",
    collapse: "Réduire",
    viewDetails: "Voir détails",
    chart: "Graphique",
    table: "Tableau",
    contactSupport: "Contacter le support",
    contactMessage: "Vous avez une question sur vos revenus ? Notre équipe est là pour vous aider.",
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
    refresh: "تحديث",
    months: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
    expand: "تكبير",
    collapse: "تصغير",
    viewDetails: "عرض التفاصيل",
    chart: "رسم بياني",
    table: "جدول",
    contactSupport: "اتصل بالدعم",
    contactMessage: "هل لديك سؤال حول إيراداتك؟ فريقنا هنا لمساعدتك.",
  },
} as const;

type Period = "month" | "quarter" | "year" | "custom";
type ViewMode = "chart" | "table";

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

// Enhanced KPI Card Component
const KPICard = ({ label, value, subtext, icon, color, bg, highlight = false, trend }: any) => (
  <div style={{
    background: highlight ? `linear-gradient(135deg, ${bg}, #ffffff)` : "#fff",
    border: highlight ? `2px solid ${color}` : "1px solid #e5e7eb",
    borderRadius: 16,
    padding: "1.25rem",
    transition: "all 0.2s ease",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
  }}>
    {trend && (
      <div style={{ position: "absolute", top: 12, right: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: trend.color }}>
          {trend.icon} {trend.value}
        </span>
      </div>
    )}
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", color: color }}>
        {icon}
      </div>
    </div>
    <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4, fontWeight: 500 }}>{label}</p>
    <p style={{ fontSize: 24, fontWeight: 700, color: highlight ? color : "#111827", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
      {value}
    </p>
    <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>{subtext}</p>
  </div>
);

// Enhanced Chart Container
const ChartContainer = ({ title, icon, children, onExpand }: any) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      border: "1px solid #e5e7eb",
      overflow: "hidden",
      transition: "all 0.3s ease",
      ...(expanded ? { position: "fixed", top: 20, left: 20, right: 20, bottom: 20, zIndex: 1000, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" } : {})
    }}>
      <div style={{ 
        padding: "1rem 1.25rem", 
        borderBottom: "1px solid #f0f0f0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {icon}
          <p style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{title}</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#fff",
            cursor: "pointer",
            fontSize: 11,
            display: "flex",
            alignItems: "center",
            gap: 4,
            color: "#6b7280"
          }}
        >
          {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          {expanded ? "Réduire" : "Agrandir"}
        </button>
      </div>
      <div style={{ padding: "1.25rem", height: expanded ? "calc(100% - 60px)" : "auto" }}>
        {children}
      </div>
      {expanded && (
        <div 
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: -1 }}
          onClick={() => setExpanded(false)}
        />
      )}
    </div>
  );
};

// Enhanced Data Table
const DataTable = ({ columns, data, title }: any) => {
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  const sortedData = [...data].sort((a, b) => {
    if (!sortBy) return 0;
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (typeof aVal === "number") {
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    }
    return sortOrder === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
  });
  
  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };
  
  return (
    <div>
      {title && (
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{title}</p>
        </div>
      )}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#fafbfc", borderBottom: "1px solid #f0f0f0" }}>
              {columns.map((col: any) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={{
                    padding: "12px 14px",
                    textAlign: col.align || "left",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#6b7280",
                    cursor: col.sortable !== false ? "pointer" : "default",
                    userSelect: "none"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: col.align === "right" ? "flex-end" : "flex-start" }}>
                    {col.label}
                    {sortBy === col.key && (
                      <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
              ))}
             </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>
                  Aucune donnée
                </td>
              </tr>
            ) : (
              sortedData.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #fafafa", transition: "background 0.2s", cursor: "pointer" }}>
                  {columns.map((col: any) => (
                    <td
                      key={col.key}
                      style={{
                        padding: "12px 14px",
                        textAlign: col.align || "left",
                        fontWeight: col.bold ? 600 : 400,
                        color: col.color || "#374151"
                      }}
                    >
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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
  const [viewMode, setViewMode] = useState<ViewMode>("chart");

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
    if (trend === "growing") return <ArrowUp size={14} />;
    if (trend === "declining") return <ArrowDown size={14} />;
    return <Minus size={14} />;
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
      fontFamily: isRTL ? "'Cairo', system-ui" : "'Inter', system-ui, -apple-system, sans-serif",
      direction: isRTL ? "rtl" : "ltr",
      background: "#f8fafc",
      minHeight: "100vh",
      padding: "2rem"
    }}>
      <div style={{ maxWidth: 1440, margin: "0 auto" }}>
        {/* Header - No title, only action buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={fetchData} disabled={refreshing} style={{
              padding: "8px 18px", borderRadius: 10, border: "1.5px solid #e2e8f0",
              background: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
              gap: 8, fontSize: 13, fontWeight: 500, color: "#334155", transition: "all 0.2s"
            }}>
              <RefreshCw size={15} className={refreshing ? "spin" : ""} /> {tx.refresh}
            </button>
            <button onClick={() => setShowFilters(!showFilters)} style={{
              padding: "8px 18px", borderRadius: 10, border: "1.5px solid #e2e8f0",
              background: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
              gap: 8, fontSize: 13, fontWeight: 500, color: "#334155"
            }}>
              <Filter size={15} /> {tx.filter}
            </button>
            <button onClick={contactAgency} style={{
              padding: "8px 20px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${GREEN}, ${GREEN_DARK})`,
              color: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
              gap: 8, fontSize: 13, fontWeight: 500
            }}>
              <MessageCircle size={15} />
              {tx.contactAgency}
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div style={{
            background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16,
            padding: "1.5rem", marginBottom: "2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.04)"
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>{tx.property}</label>
                <select value={selectedProperty} onChange={(e) => setSelectedProperty(Number(e.target.value))}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, background: "#fff" }}>
                  <option value={0}>{tx.allProperties}</option>
                  {properties.map(prop => <option key={prop.id} value={prop.id}>{prop.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Période</label>
                <select value={period} onChange={(e) => setPeriod(e.target.value as Period)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, background: "#fff" }}>
                  <option value="month">{tx.month}</option>
                  <option value="quarter">{tx.quarter}</option>
                  <option value="year">{tx.year}</option>
                  <option value="custom">{tx.custom}</option>
                </select>
              </div>
              {period === "month" && (
                <>
                  <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>{tx.year}</label>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13 }}>
                      <option value={2024}>2024</option><option value={2025}>2025</option>
                    </select>
                  </div>
                  <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>{tx.month}</label>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13 }}>
                      {tx.months.map((m, idx) => <option key={idx + 1} value={idx + 1}>{m}</option>)}
                    </select>
                  </div>
                </>
              )}
              {period === "quarter" && (
                <>
                  <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>{tx.year}</label>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13 }}>
                      <option value={2024}>2024</option><option value={2025}>2025</option>
                    </select>
                  </div>
                  <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>{tx.quarter}</label>
                    <select value={selectedQuarter} onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13 }}>
                      <option value={1}>Q1</option><option value={2}>Q2</option><option value={3}>Q3</option><option value={4}>Q4</option>
                    </select>
                  </div>
                </>
              )}
              {period === "year" && (
                <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>{tx.year}</label>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13 }}>
                    <option value={2024}>2024</option><option value={2025}>2025</option>
                  </select>
                </div>
              )}
              {period === "custom" && (
                <>
                  <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Date début</label>
                    <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13 }} />
                  </div>
                  <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Date fin</label>
                    <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13 }} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* KPI Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.25rem", marginBottom: "2rem" }}>
          {kpiCards.map((k, i) => (
            <KPICard key={i} {...k} />
          ))}
        </div>

        {/* Revenue Evolution Chart */}
        {chartData.some(d => d.revenue > 0) && (
          <ChartContainer title={tx.revenueEvolution} icon={<TrendingUp size={18} color={GREEN} />}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "#f1f5f9", borderRadius: 20 }}>
                {getTrendIcon()}
                <span style={{ fontSize: 12, fontWeight: 500, color: getTrendColor() }}>{getTrendText()}</span>
                <span style={{ fontSize: 11, color: "#64748b" }}>{tx.vsLastMonth}</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={360}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GREEN} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="revenue" name={tx.totalRevenue} stroke={GREEN} strokeWidth={2.5} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}

        {/* Revenue by Property & Platform */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "1.25rem", marginBottom: "2rem" }}>
          {/* Revenue by Property */}
          <ChartContainer title={tx.revenueByProperty} icon={<BarChart3 size={18} color={GREEN} />}>
            <DataTable
              columns={[
                { key: "propertyName", label: tx.property, sortable: true },
                { key: "revenue", label: tx.revenue, align: "right", sortable: true, render: (val: number) => formatCurrency(val, lang) },
                { key: "commission", label: tx.commission, align: "right", sortable: true, render: (val: number) => formatCurrency(val, lang), color: "#ef4444" },
                { key: "amountToReceive", label: tx.amountToReceiveCol, align: "right", sortable: true, render: (val: number) => formatCurrency(val, lang), bold: true, color: GREEN },
              ]}
              data={revenueByProperty()}
            />
          </ChartContainer>

          {/* Revenue by Platform */}
          <ChartContainer title={tx.revenueByPlatform} icon={<LucidePieChart size={18} color={GREEN} />}>
            {revenueByPlatform().length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>{tx.noData}</div>
            ) : (
              <div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <ResponsiveContainer width="100%" height={240}>
                    <RePieChart>
                      <Pie
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="revenue"
                        data={revenueByPlatform()}
                      >
                        {revenueByPlatform().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatCurrency(value, lang)} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {revenueByPlatform().map((item, idx) => {
                    const percentage = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
                    return (
                      <div key={idx}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[idx % COLORS.length] }} />
                            <span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>{item.platform}</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{formatCurrency(item.revenue, lang)}</span>
                        </div>
                        <div style={{ width: "100%", height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${percentage}%`, height: "100%", background: COLORS[idx % COLORS.length], borderRadius: 3, transition: "width 0.3s ease" }} />
                        </div>
                        <p style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 4 }}>{percentage.toFixed(1)}%</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </ChartContainer>
        </div>

        {/* Recent Activity */}
        <ChartContainer title={tx.recentActivity} icon={<Receipt size={18} color={GREEN} />}>
          <DataTable
            columns={[
              { key: "date", label: tx.date, sortable: true },
              { key: "propertyName", label: tx.property, sortable: true },
              { key: "guestName", label: tx.guest, sortable: true },
              { key: "revenue", label: tx.revenue, align: "right", sortable: true, render: (val: number) => formatCurrency(val, lang), bold: true, color: GREEN },
            ]}
            data={recentActivity()}
          />
        </ChartContainer>

        {/* Contact Support Section */}
        <div style={{
          marginTop: "2rem",
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
              fontWeight: 500,
              transition: "all 0.2s"
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