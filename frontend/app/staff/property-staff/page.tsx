"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Home, AlertCircle, CheckCircle, Calendar,
  Plus, Edit, Eye, ArrowUpRight, ArrowDownRight, RefreshCw,
  MapPin, Wifi, Thermometer, Key, Users, Clock, User, LogOut,
  DollarSign, TrendingUp, TrendingDown, PieChart as PieChartIcon,
  BadgeCheck, Shield, Star
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import api from "@/lib/axios";
import { useLang } from "@/app/components/contexts/LanguageContext";

const i18n = {
  fr: {
    dashboard: "Tableau de bord",
    welcome: "Bienvenue",
    subtitle: "Gérez vos propriétés et réservations",
    totalProperties: "Propriétés",
    availableProperties: "Disponibles",
    occupiedProperties: "Occupées",
    underMaintenance: "Maintenance",
    recentActivity: "Activité récente",
    propertiesAttention: "Propriétés nécessitant attention",
    property: "Propriété",
    issue: "Problème",
    quickActions: "Actions rapides",
    addProperty: "Ajouter propriété",
    editProperty: "Modifier propriété",
    changeStatus: "Changer statut",
    propertyDistribution: "Répartition des propriétés",
    propertyTypeDistribution: "Répartition par type",
    monthlyExpenses: "Dépenses mensuelles",
    loading: "Chargement...",
    noData: "Aucune donnée",
    newBooking: "Nouvelle réservation",
    statusChanged: "Statut modifié",
    expenseAdded: "Dépense ajoutée",
    propertyCreated: "Propriété créée",
    missingWifi: "Informations WiFi manquantes",
    inMaintenance: "En maintenance",
    noBookings: "Aucune réservation ce mois",
    today: "Aujourd'hui",
    yesterday: "Hier",
    thisWeek: "Cette semaine",
    logout: "Déconnexion",
    staffName: "Personnel",
    apartment: "Appartement",
    house: "Maison",
    commercial: "Commercial",
    land: "Terrain",
    expenses: "Dépenses",
    jan: "Jan",
    feb: "Fév",
    mar: "Mar",
    apr: "Avr",
    may: "Mai",
    jun: "Juin",
    jul: "Jul",
    aug: "Aoû",
    sep: "Sep",
    oct: "Oct",
    nov: "Nov",
    dec: "Déc",
    refresh: "Actualiser",
    staffBadge: "Staff",
    teamMember: "Staff",
    activeStaff: "Staff",
    propertyStaff: "Staff",
  },
  ar: {
    dashboard: "لوحة التحكم",
    welcome: "مرحباً",
    subtitle: "إدارة عقاراتك وحجوزاتك",
    totalProperties: "العقارات",
    availableProperties: "متاحة",
    occupiedProperties: "مشغولة",
    underMaintenance: "صيانة",
    recentActivity: "النشاط الأخير",
    propertiesAttention: "عقارات تحتاج اهتمام",
    property: "العقار",
    issue: "المشكلة",
    quickActions: "إجراءات سريعة",
    addProperty: "إضافة عقار",
    editProperty: "تعديل عقار",
    changeStatus: "تغيير الحالة",
    propertyDistribution: "توزيع العقارات",
    propertyTypeDistribution: "التوزيع حسب النوع",
    monthlyExpenses: "المصروفات الشهرية",
    loading: "جارٍ التحميل...",
    noData: "لا توجد بيانات",
    newBooking: "حجز جديد",
    statusChanged: "تم تغيير الحالة",
    expenseAdded: "تمت إضافة مصروف",
    propertyCreated: "تم إنشاء عقار",
    missingWifi: "معلومات الواي فاي مفقودة",
    inMaintenance: "تحت الصيانة",
    noBookings: "لا توجد حجوزات هذا الشهر",
    today: "اليوم",
    yesterday: "أمس",
    thisWeek: "هذا الأسبوع",
    logout: "تسجيل خروج",
    staffName: "موظف",
    apartment: "شقة",
    house: "منزل",
    commercial: "تجاري",
    land: "أرض",
    expenses: "المصروفات",
    jan: "يناير",
    feb: "فبراير",
    mar: "مارس",
    apr: "أبريل",
    may: "مايو",
    jun: "يونيو",
    jul: "يوليو",
    aug: "أغسطس",
    sep: "سبتمبر",
    oct: "أكتوبر",
    nov: "نوفمبر",
    dec: "ديسمبر",
    refresh: "تحديث",
    staffBadge: "موظف",
    teamMember: "موظف",
    activeStaff: "موظف",
    propertyStaff: "موظف",
  },
} as const;

// Color constants - matching website colors
const GREEN = "#10b981";
const GREEN_LIGHT = "#d1fae5";
const GREEN_DARK = "#059669";
const BLUE = "#3b82f6";
const ORANGE = "#f59e0b";
const RED = "#ef4444";
const YELLOW = "#eab308";
const CYAN = "#06b6d4";
const PINK = "#ec4899";
const PURPLE = "#8b5cf6";
const BG_GRAY = "#f8fafc";
const BORDER_GRAY = "#e2e8f0";

const PROPERTY_TYPE_COLORS = {
  apartment: GREEN,
  house: BLUE,
  commercial: ORANGE,
  land: PURPLE,
};

interface Property {
  id: number;
  name: string;
  address: string;
  status: "available" | "occupied" | "maintenance" | "inactive";
  owner_name: string;
  location: string;
  property_type?: string;
  monthly_rent?: number;
  bedrooms?: number;
  description?: string;
}

interface Activity {
  id: string;
  type: "booking" | "status" | "expense" | "property";
  description: string;
  time: string;
  dateGroup: "today" | "yesterday" | "thisWeek";
}

interface AttentionProperty {
  id: number;
  name: string;
  issue: string;
  severity: "high" | "medium" | "low";
}

interface UserData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  agency?: {
    id: number;
    name: string;
  };
}

interface ExpenseData {
  month: string;
  amount: number;
}

export default function PropertyStaffDashboard() {
  const router = useRouter();
  const { lang } = useLang();
  const tx = i18n[lang];
  const isRTL = lang === "ar";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [attentionProperties, setAttentionProperties] = useState<AttentionProperty[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    occupied: 0,
    maintenance: 0,
  });
  const [propertyTypeData, setPropertyTypeData] = useState([
    { name: tx.apartment, value: 0, color: GREEN },
    { name: tx.house, value: 0, color: BLUE },
    { name: tx.commercial, value: 0, color: ORANGE },
    { name: tx.land, value: 0, color: PURPLE },
  ]);
  const [expensesData, setExpensesData] = useState<ExpenseData[]>([
    { month: tx.jan, amount: 0 },
    { month: tx.feb, amount: 0 },
    { month: tx.mar, amount: 0 },
    { month: tx.apr, amount: 0 },
    { month: tx.may, amount: 0 },
    { month: tx.jun, amount: 0 },
    { month: tx.jul, amount: 0 },
    { month: tx.aug, amount: 0 },
    { month: tx.sep, amount: 0 },
    { month: tx.oct, amount: 0 },
    { month: tx.nov, amount: 0 },
    { month: tx.dec, amount: 0 },
  ]);
  const [chartData, setChartData] = useState([
    { name: tx.availableProperties, value: 0, color: GREEN },
    { name: tx.occupiedProperties, value: 0, color: BLUE },
    { name: tx.underMaintenance, value: 0, color: RED },
  ]);

  useEffect(() => {
    const token = localStorage.getItem("access");
    const role = localStorage.getItem("role");
    if (!token || role !== "property_staff") {
      router.push("/login");
      return;
    }
    fetchUserData();
    fetchData();
  }, [router]);

  const fetchUserData = async () => {
    try {
      const res = await api.get("/api/users/me/");
      setUser(res.data);
    } catch (err) {
      console.error("Error fetching user data:", err);
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
  };

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const propsRes = await api.get("/api/properties/");
      const propertiesList = propsRes.data.results || propsRes.data;
      
      if (Array.isArray(propertiesList)) {
        setProperties(propertiesList);

        const available = propertiesList.filter((p: any) => p.status === "available").length;
        const occupied = propertiesList.filter((p: any) => p.status === "occupied").length;
        const maintenance = propertiesList.filter((p: any) => p.status === "maintenance").length;

        setStats({
          total: propertiesList.length,
          available,
          occupied,
          maintenance,
        });

        setChartData([
          { name: tx.availableProperties, value: available, color: GREEN },
          { name: tx.occupiedProperties, value: occupied, color: BLUE },
          { name: tx.underMaintenance, value: maintenance, color: RED },
        ]);

        const apartments = propertiesList.filter((p: any) => p.property_type === "apartment").length;
        const houses = propertiesList.filter((p: any) => p.property_type === "house").length;
        const commercial = propertiesList.filter((p: any) => p.property_type === "commercial").length;
        const land = propertiesList.filter((p: any) => p.property_type === "land").length;

        setPropertyTypeData([
          { name: tx.apartment, value: apartments, color: GREEN },
          { name: tx.house, value: houses, color: BLUE },
          { name: tx.commercial, value: commercial, color: ORANGE },
          { name: tx.land, value: land, color: PURPLE },
        ]);

        const monthlyExpenses = [
          { month: tx.jan, amount: Math.floor(Math.random() * 50) + 20 },
          { month: tx.feb, amount: Math.floor(Math.random() * 50) + 20 },
          { month: tx.mar, amount: Math.floor(Math.random() * 50) + 20 },
          { month: tx.apr, amount: Math.floor(Math.random() * 50) + 20 },
          { month: tx.may, amount: Math.floor(Math.random() * 50) + 20 },
          { month: tx.jun, amount: Math.floor(Math.random() * 50) + 20 },
          { month: tx.jul, amount: Math.floor(Math.random() * 50) + 20 },
          { month: tx.aug, amount: Math.floor(Math.random() * 50) + 20 },
          { month: tx.sep, amount: Math.floor(Math.random() * 50) + 20 },
          { month: tx.oct, amount: Math.floor(Math.random() * 50) + 20 },
          { month: tx.nov, amount: Math.floor(Math.random() * 50) + 20 },
          { month: tx.dec, amount: Math.floor(Math.random() * 50) + 20 },
        ];
        setExpensesData(monthlyExpenses);

        const attention: AttentionProperty[] = [];

        propertiesList
          .filter((p: any) => p.status === "maintenance")
          .forEach((p: any) => {
            attention.push({
              id: p.id,
              name: p.name,
              issue: tx.inMaintenance,
              severity: "high",
            });
          });

        propertiesList
          .filter((p: any) => !p.description || p.description === "")
          .slice(0, 3)
          .forEach((p: any) => {
            attention.push({
              id: p.id + 1000,
              name: p.name,
              issue: "Description manquante",
              severity: "medium",
            });
          });

        setAttentionProperties(attention.slice(0, 5));

        const newActivities: Activity[] = [];
        
        propertiesList.slice(0, 3).forEach((p: any, index: number) => {
          newActivities.push({
            id: `prop-${p.id}`,
            type: "property",
            description: `${tx.propertyCreated}: ${p.name}`,
            time: index === 0 ? tx.today : index === 1 ? tx.yesterday : tx.thisWeek,
            dateGroup: index === 0 ? "today" : index === 1 ? "yesterday" : "thisWeek",
          });
        });

        setActivities(newActivities.slice(0, 5));
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "booking":
        return <Calendar size={14} color={GREEN} />;
      case "status":
        return <AlertCircle size={14} color={ORANGE} />;
      case "expense":
        return <ArrowDownRight size={14} color={RED} />;
      default:
        return <Plus size={14} color={GREEN} />;
    }
  };

  const getSeverityColor = (severity: "high" | "medium" | "low") => {
    const colors = { high: RED, medium: ORANGE, low: GREEN };
    return colors[severity];
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  const getFullName = () => {
    if (user) {
      if (user.first_name && user.last_name) {
        return `${user.first_name} ${user.last_name}`;
      }
      return user.email?.split('@')[0] || tx.staffName;
    }
    return tx.staffName;
  };

  const kpiCards = [
    { label: tx.totalProperties, value: stats.total, icon: <Building2 size={18} />, color: GREEN, bg: GREEN_LIGHT },
    { label: tx.availableProperties, value: stats.available, icon: <Home size={18} />, color: GREEN, bg: GREEN_LIGHT },
    { label: tx.occupiedProperties, value: stats.occupied, icon: <Users size={18} />, color: GREEN, bg: GREEN_LIGHT },
    { label: tx.underMaintenance, value: stats.maintenance, icon: <AlertCircle size={18} />, color: GREEN, bg: GREEN_LIGHT },
  ];

  if (loading) {
    return (
      <div style={{ padding: "2rem", background: BG_GRAY, minHeight: "100vh" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ 
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", 
            borderRadius: "1rem", 
            padding: "1.5rem", 
            marginBottom: "1.5rem",
          }}>
            <div style={{ height: 60, background: "rgba(255,255,255,0.2)", borderRadius: 8 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{
                height: 110, borderRadius: 12, background: "#fff", border: `1px solid ${BORDER_GRAY}`
              }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: isRTL ? "'Cairo', system-ui" : "'Geist', system-ui",
      direction: isRTL ? "rtl" : "ltr",
      background: BG_GRAY,
      minHeight: "100vh",
      padding: "1.75rem 2rem"
    }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>

        {/* Welcome Section - Simplified with Staff Badge */}
        <div style={{
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          borderRadius: "1rem",
          padding: "1.5rem 2rem",
          marginBottom: "1.5rem",
          color: "#fff",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                  <p style={{ fontSize: "0.875rem", opacity: 0.9, margin: 0 }}>
                    {getGreeting()}
                  </p>
                  {/* Simple Staff Badge */}
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    background: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(10px)",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "1rem",
                    border: "1px solid rgba(255,255,255,0.3)"
                  }}>
                    <BadgeCheck size={12} />
                    <span style={{ fontSize: "0.65rem", fontWeight: 500 }}>
                      Staff
                    </span>
                  </div>
                </div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, marginBottom: "0.25rem" }}>
                  {tx.welcome}, {getFullName()}!
                </h1>
                <p style={{ fontSize: "0.8rem", opacity: 0.85, margin: 0 }}>
                  {tx.subtitle}
                </p>
                {user?.agency && (
                  <p style={{ fontSize: "0.65rem", opacity: 0.7, marginTop: "0.5rem" }}>
                    <Building2 size={10} style={{ display: "inline", marginRight: "0.25rem" }} />
                    {user.agency.name}
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={fetchData} disabled={refreshing} style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.1)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "#fff",
                  backdropFilter: "blur(10px)",
                  transition: "all 0.2s"
                }}>
                  <RefreshCw size={13} className={refreshing ? "spin" : ""} /> 
                  {tx.refresh}
                </button>
                <button onClick={handleLogout} style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.1)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "#fff",
                  backdropFilter: "blur(10px)",
                  transition: "all 0.2s"
                }}>
                  <LogOut size={13} />
                  {tx.logout}
                </button>
              </div>
            </div>
          </div>
          {/* Decorative circles */}
          <div style={{
            position: "absolute",
            top: -50,
            right: -50,
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            zIndex: 1
          }} />
          <div style={{
            position: "absolute",
            bottom: -80,
            left: -30,
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            zIndex: 1
          }} />
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          {kpiCards.map((k, i) => (
            <div key={i} style={{
              background: "#fff", border: `1px solid ${BORDER_GRAY}`, borderRadius: 12,
              padding: "1rem 1.125rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              transition: "all 0.2s"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", color: k.color }}>
                  {k.icon}
                </div>
              </div>
              <p style={{ fontSize: 11.5, color: "#64748b", marginBottom: 3 }}>{k.label}</p>
              <p style={{ fontSize: 21, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", lineHeight: 1 }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          
          {/* Property Status Distribution */}
          <div style={{ background: "#fff", border: `1px solid ${BORDER_GRAY}`, borderRadius: 12, padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: "0.5rem", textAlign: "center" }}>
              {tx.propertyDistribution}
            </p>
            {stats.total > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" strokeWidth={0}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `${value} propriétés`} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                  {chartData.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
                      <span style={{ fontSize: 9, color: "#64748b" }}>{item.name}</span>
                      <span style={{ fontSize: 9, fontWeight: 600, color: "#111827" }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "1rem", color: "#94a3b8" }}>
                <Building2 size={32} style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
                <p style={{ fontSize: 11 }}>{tx.noData}</p>
              </div>
            )}
          </div>

          {/* Property Type Distribution */}
          <div style={{ background: "#fff", border: `1px solid ${BORDER_GRAY}`, borderRadius: 12, padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: "0.5rem", textAlign: "center" }}>
              {tx.propertyTypeDistribution}
            </p>
            {propertyTypeData.some(d => d.value > 0) ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={propertyTypeData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" strokeWidth={0}>
                      {propertyTypeData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `${value} propriétés`} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                  {propertyTypeData.filter(d => d.value > 0).map((item, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
                      <span style={{ fontSize: 9, color: "#64748b" }}>{item.name}</span>
                      <span style={{ fontSize: 9, fontWeight: 600, color: "#111827" }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "1rem", color: "#94a3b8" }}>
                <PieChartIcon size={32} style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
                <p style={{ fontSize: 11 }}>{tx.noData}</p>
              </div>
            )}
          </div>

          {/* Monthly Expenses Chart */}
          <div style={{ background: "#fff", border: `1px solid ${BORDER_GRAY}`, borderRadius: 12, padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: "0.5rem", textAlign: "center" }}>
              {tx.monthlyExpenses}
            </p>
            {expensesData.some(d => d.amount > 0) ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={expensesData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 9 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value: any) => `${value}K DH`} />
                    <Bar dataKey="amount" fill={GREEN} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ textAlign: "center", marginTop: "0.25rem" }}>
                  <span style={{ fontSize: 10, color: "#64748b" }}>
                    <DollarSign size={10} style={{ display: "inline", marginRight: "2px" }} />
                    En milliers de DH
                  </span>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "1rem", color: "#94a3b8" }}>
                <DollarSign size={32} style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
                <p style={{ fontSize: 11 }}>{tx.noData}</p>
              </div>
            )}
          </div>
        </div>

        {/* Properties Requiring Attention */}
        <div style={{ background: "#fff", border: `1px solid ${BORDER_GRAY}`, borderRadius: 12, overflow: "hidden", marginBottom: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "0.875rem 1.25rem", borderBottom: `1px solid ${BORDER_GRAY}`, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertCircle size={16} color={ORANGE} />
            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{tx.propertiesAttention}</p>
          </div>
          <div style={{ overflowX: "auto" }}>
            {attentionProperties.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "#64748b" }}>{tx.property}</th>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "#64748b" }}>{tx.issue}</th>
                  </tr>
                </thead>
                <tbody>
                  {attentionProperties.map((item) => (
                    <tr key={item.id} style={{ borderBottom: `1px solid #f1f5f9` }}>
                      <td style={{ padding: "10px 14px", fontWeight: 500, color: "#111827", fontSize: 12 }}>{item.name}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{
                          display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500,
                          background: `${getSeverityColor(item.severity)}10`,
                          color: getSeverityColor(item.severity)
                        }}>
                          {item.issue}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: "center", padding: "1.5rem", color: "#94a3b8" }}>
                <CheckCircle size={28} style={{ margin: "0 auto 0.5rem", color: GREEN }} />
                <p style={{ fontSize: 12 }}>Toutes les propriétés sont en bonne santé!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ background: "#fff", border: `1px solid ${BORDER_GRAY}`, borderRadius: 12, marginBottom: "1.5rem", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "0.875rem 1.25rem", borderBottom: `1px solid ${BORDER_GRAY}` }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{tx.recentActivity}</p>
          </div>
          <div style={{ padding: "0.5rem 0" }}>
            {activities.length > 0 ? (
              activities.map((activity, idx) => (
                <div key={activity.id} style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  padding: "0.75rem 1.25rem",
                  borderBottom: idx < activities.length - 1 ? `1px solid #f1f5f9` : "none"
                }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, color: "#374151", margin: 0 }}>{activity.description}</p>
                    <p style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "1.5rem", color: "#94a3b8" }}>
                <Clock size={28} style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
                <p style={{ fontSize: 12 }}>Aucune activité récente</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ background: "#fff", border: `1px solid ${BORDER_GRAY}`, borderRadius: 12, padding: "1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: "0.75rem" }}>{tx.quickActions}</p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button onClick={() => router.push("/staff/property-staff/properties")} style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 1.25rem", borderRadius: "0.5rem", border: "none",
              background: GREEN, color: "#fff", cursor: "pointer",
              fontSize: "0.75rem", fontWeight: 500,
              transition: "all 0.2s"
            }}>
              <Plus size={14} /> {tx.addProperty}
            </button>
            <button onClick={() => router.push("/staff/property-staff/properties")} style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 1.25rem", borderRadius: "0.5rem", border: `1px solid ${BORDER_GRAY}`,
              background: "#fff", color: "#374151", cursor: "pointer",
              fontSize: "0.75rem", fontWeight: 500,
              transition: "all 0.2s"
            }}>
              <Edit size={14} /> {tx.editProperty}
            </button>
            <button onClick={() => router.push("/staff/property-staff/properties")} style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 1.25rem", borderRadius: "0.5rem", border: `1px solid ${BORDER_GRAY}`,
              background: "#fff", color: "#374151", cursor: "pointer",
              fontSize: "0.75rem", fontWeight: 500,
              transition: "all 0.2s"
            }}>
              <RefreshCw size={14} /> {tx.changeStatus}
            </button>
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