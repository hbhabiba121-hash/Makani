"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign, Plus, Search, Filter, Download, RefreshCw,
  Calendar, Building2, Users, TrendingUp, ArrowUpRight,
  X, Loader2, AlertCircle, Eye, Edit, Trash2, CreditCard,
  Globe, Home, User, Clock, ChevronLeft, ChevronRight
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import api from "@/lib/axios";
import { useLang } from "@/app/components/contexts/LanguageContext";

const i18n = {
  fr: {
    revenue: "Gestion des Revenus",
    subtitle: "Suivi des revenus et commissions",
    addRevenue: "Ajouter un revenu",
    editRevenue: "Modifier le revenu",
    deleteRevenue: "Supprimer le revenu",
    totalRevenue: "Revenus totaux",
    totalCommission: "Commissions totales",
    averageCommission: "Commission moyenne",
    bookingsCount: "Nombre de réservations",
    revenueByProperty: "Revenus par propriété",
    revenueByPlatform: "Revenus par plateforme",
    revenueByOwner: "Revenus par propriétaire",
    topPerformer: "Meilleure propriété",
    recentRevenue: "Revenus récents",
    property: "Propriété",
    owner: "Propriétaire",
    guest: "Client",
    platform: "Plateforme",
    revenue: "Revenu",
    commission: "Commission",
    ownerRevenue: "Revenu propriétaire",
    date: "Date",
    actions: "Actions",
    search: "Rechercher...",
    filterByProperty: "Filtrer par propriété",
    filterByOwner: "Filtrer par propriétaire",
    allProperties: "Toutes les propriétés",
    allOwners: "Tous les propriétaires",
    export: "Exporter",
    refresh: "Actualiser",
    save: "Enregistrer",
    cancel: "Annuler",
    loading: "Chargement...",
    noData: "Aucune donnée",
    propertyName: "Nom de la propriété",
    guestName: "Nom du client",
    checkIn: "Date d'arrivée",
    checkOut: "Date de départ",
    nights: "Nuits",
    pricePerNight: "Prix par nuit",
    commissionRate: "Taux de commission (%)",
    calculate: "Calculer",
    ownerAmount: "Montant propriétaire",
    confirmDelete: "Êtes-vous sûr de vouloir supprimer ce revenu ?",
    months: ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"],
    propertyDetails: "Détails de la propriété",
    stayDetails: "Détails du séjour",
  },
  ar: {
    revenue: "إدارة الإيرادات",
    subtitle: "تتبع الإيرادات والعمولات",
    addRevenue: "إضافة إيراد",
    editRevenue: "تعديل الإيراد",
    deleteRevenue: "حذف الإيراد",
    totalRevenue: "إجمالي الإيرادات",
    totalCommission: "إجمالي العمولات",
    averageCommission: "متوسط العمولة",
    bookingsCount: "عدد الحجوزات",
    revenueByProperty: "الإيرادات حسب العقار",
    revenueByPlatform: "الإيرادات حسب المنصة",
    revenueByOwner: "الإيرادات حسب المالك",
    topPerformer: "أفضل عقار أداءً",
    recentRevenue: "الإيرادات الأخيرة",
    property: "العقار",
    owner: "المالك",
    guest: "الضيف",
    platform: "المنصة",
    revenue: "الإيراد",
    commission: "العمولة",
    ownerRevenue: "إيراد المالك",
    date: "التاريخ",
    actions: "إجراءات",
    search: "بحث...",
    filterByProperty: "تصفية حسب العقار",
    filterByOwner: "تصفية حسب المالك",
    allProperties: "جميع العقارات",
    allOwners: "جميع المالكين",
    export: "تصدير",
    refresh: "تحديث",
    save: "حفظ",
    cancel: "إلغاء",
    loading: "جارٍ التحميل...",
    noData: "لا توجد بيانات",
    propertyName: "اسم العقار",
    guestName: "اسم الضيف",
    checkIn: "تاريخ الوصول",
    checkOut: "تاريخ المغادرة",
    nights: "ليالي",
    pricePerNight: "السعر لكل ليلة",
    commissionRate: "نسبة العمولة (%)",
    calculate: "حساب",
    ownerAmount: "مبلغ المالك",
    confirmDelete: "هل أنت متأكد من حذف هذا الإيراد؟",
    months: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
    propertyDetails: "تفاصيل العقار",
    stayDetails: "تفاصيل الإقامة",
  },
} as const;

const GREEN = "#22c55e";
const GREEN_DARK = "#16a34a";
const GREEN_BG = "#f0fdf4";
const BLUE = "#3b82f6";
const ORANGE = "#f59e0b";
const PURPLE = "#8b5cf6";
const RED = "#ef4444";
const CYAN = "#06b6d4";

const formatCurrency = (amount: number | undefined | null, lang: "fr" | "ar"): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "0 MAD";
  }
  return amount.toLocaleString(lang === "fr" ? "fr-FR" : "ar-MA") + " MAD";
};

interface RevenueRecord {
  id: number;
  property_name: string;
  property_id: number;
  owner_name?: string;
  owner_id?: number;
  guest_name: string;
  platform: string;
  amount: number;
  commission: number;
  owner_amount: number;
  check_in: string;
  check_out: string;
  nights: number;
  date: string;
}

interface Property {
  id: number;
  name: string;
}

interface Owner {
  id: number;
  full_name: string;
}

interface PlatformRevenue {
  platform: string;
  revenue: number;
  color: string;
}

export default function RevenuePage() {
  const router = useRouter();
  const { lang } = useLang();
  const tx = i18n[lang];
  const isRTL = lang === "ar";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revenues, setRevenues] = useState<RevenueRecord[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<number>(0);
  const [selectedOwner, setSelectedOwner] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState<RevenueRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCommission: 0,
    averageCommission: 0,
    bookingsCount: 0,
  });
  const [revenueByProperty, setRevenueByProperty] = useState<{ name: string; revenue: number }[]>([]);
  const [revenueByOwner, setRevenueByOwner] = useState<{ name: string; revenue: number }[]>([]);
  const [platformRevenues, setPlatformRevenues] = useState<PlatformRevenue[]>([]);
  const [topPerformer, setTopPerformer] = useState<{ name: string; revenue: number } | null>(null);
  const [form, setForm] = useState({
    property_id: "",
    guest_name: "",
    platform: "",
    check_in: "",
    check_out: "",
    nights: "",
    price_per_night: "",
    commission_rate: "15",
  });
  const [calculated, setCalculated] = useState({ amount: 0, commission: 0, owner_amount: 0 });

  useEffect(() => {
    const token = localStorage.getItem("access");
    const role = localStorage.getItem("role");
    if (!token || role !== "agency_manager") {
      router.push("/login");
      return;
    }
    fetchData();
    fetchProperties();
    fetchOwners();
  }, [router, selectedProperty, selectedOwner]);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const revenueRes = await api.get("/financials/revenue-records/");
      let revenueList = revenueRes.data.results || revenueRes.data || [];
      
      if (selectedProperty !== 0) {
        revenueList = revenueList.filter((r: any) => r.property_id === selectedProperty);
      }
      if (selectedOwner !== 0) {
        revenueList = revenueList.filter((r: any) => r.owner_id === selectedOwner);
      }
      
      setRevenues(revenueList);

      const totalRevenue = revenueList.reduce((sum: number, r: any) => sum + (parseFloat(r.amount) || 0), 0);
      const totalCommission = revenueList.reduce((sum: number, r: any) => sum + (parseFloat(r.commission) || 0), 0);
      setStats({
        totalRevenue,
        totalCommission,
        averageCommission: revenueList.length > 0 ? totalCommission / revenueList.length : 0,
        bookingsCount: revenueList.length,
      });

      const propertyMap = new Map<string, number>();
      revenueList.forEach((r: any) => {
        const name = r.property_name || "Inconnu";
        propertyMap.set(name, (propertyMap.get(name) || 0) + (parseFloat(r.amount) || 0));
      });
      setRevenueByProperty(Array.from(propertyMap.entries()).map(([name, revenue]) => ({ name, revenue })));

      const ownerMap = new Map<string, number>();
      revenueList.forEach((r: any) => {
        const name = r.owner_name || "Non assigné";
        ownerMap.set(name, (ownerMap.get(name) || 0) + (parseFloat(r.amount) || 0));
      });
      setRevenueByOwner(Array.from(ownerMap.entries()).map(([name, revenue]) => ({ name, revenue })));

      const platformMap = new Map<string, number>();
      revenueList.forEach((r: any) => {
        const platform = r.platform || "Direct";
        platformMap.set(platform, (platformMap.get(platform) || 0) + (parseFloat(r.amount) || 0));
      });
      const platformColors = [GREEN, BLUE, ORANGE, PURPLE, CYAN, RED];
      setPlatformRevenues(Array.from(platformMap.entries()).map(([platform, revenue], idx) => ({
        platform,
        revenue,
        color: platformColors[idx % platformColors.length]
      })));

      if (revenueByProperty.length > 0) {
        const top = revenueByProperty.reduce((max, curr) => curr.revenue > max.revenue ? curr : max, revenueByProperty[0]);
        setTopPerformer(top);
      }

    } catch (err) {
      console.error("Error fetching revenue data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await api.get("/financials/properties/");
      const data = res.data.results || res.data || [];
      setProperties(data);
    } catch (err) {
      console.error("Error fetching properties:", err);
    }
  };

  const fetchOwners = async () => {
    try {
      const res = await api.get("/api/owners/");
      const data = res.data.results || res.data || [];
      setOwners(data);
    } catch (err) {
      console.error("Error fetching owners:", err);
    }
  };

  const calculateRevenue = () => {
    const nights = parseFloat(form.nights) || 0;
    const pricePerNight = parseFloat(form.price_per_night) || 0;
    const commissionRate = parseFloat(form.commission_rate) || 0;
    const amount = nights * pricePerNight;
    const commission = amount * (commissionRate / 100);
    const ownerAmount = amount - commission;
    setCalculated({ amount, commission, ownerAmount });
  };

  useEffect(() => {
    calculateRevenue();
  }, [form.nights, form.price_per_night, form.commission_rate]);

  const handleSubmit = async () => {
    setFormError("");
    if (!form.property_id || !form.guest_name || !form.check_in || !form.check_out) {
      setFormError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        property: parseInt(form.property_id),
        guest_name: form.guest_name,
        platform: form.platform || "Direct",
        check_in: form.check_in,
        check_out: form.check_out,
        nights: parseFloat(form.nights) || 0,
        price_per_night: parseFloat(form.price_per_night) || 0,
        amount: calculated.amount,
        commission: calculated.commission,
        owner_amount: calculated.owner_amount,
        commission_rate: parseFloat(form.commission_rate) || 0,
      };
      if (selectedRevenue) {
        await api.put(`/financials/revenue-records/${selectedRevenue.id}/`, payload);
      } else {
        await api.post("/financials/revenue-records/", payload);
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRevenue) return;
    setSubmitting(true);
    try {
      await api.delete(`/financials/revenue-records/${selectedRevenue.id}/`);
      setShowDeleteModal(false);
      setSelectedRevenue(null);
      fetchData();
    } catch (err) {
      console.error("Error deleting revenue:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      property_id: "",
      guest_name: "",
      platform: "",
      check_in: "",
      check_out: "",
      nights: "",
      price_per_night: "",
      commission_rate: "15",
    });
    setCalculated({ amount: 0, commission: 0, owner_amount: 0 });
    setSelectedRevenue(null);
    setFormError("");
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (revenue: RevenueRecord) => {
    setSelectedRevenue(revenue);
    const pricePerNight = revenue.amount / (revenue.nights || 1);
    const commissionRate = revenue.amount > 0 ? (revenue.commission / revenue.amount) * 100 : 15;
    setForm({
      property_id: revenue.property_id.toString(),
      guest_name: revenue.guest_name,
      platform: revenue.platform,
      check_in: revenue.check_in,
      check_out: revenue.check_out,
      nights: revenue.nights.toString(),
      price_per_night: pricePerNight.toString(),
      commission_rate: commissionRate.toString(),
    });
    setShowModal(true);
  };

  const inputClass = "w-full p-2.5 rounded-xl border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] text-[#334155] bg-[#f8fafc] focus:bg-white transition-all text-[13px] font-medium";

  const filteredRevenues = revenues.filter(r =>
    (r.property_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.guest_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const kpiCards = [
    { label: tx.totalRevenue, value: formatCurrency(stats.totalRevenue, lang), icon: <DollarSign size={18} />, color: GREEN, bg: GREEN_BG, trend: "+15%" },
    { label: tx.totalCommission, value: formatCurrency(stats.totalCommission, lang), icon: <CreditCard size={18} />, color: BLUE, bg: "#eff6ff", trend: "+8%" },
    { label: tx.averageCommission, value: formatCurrency(stats.averageCommission, lang), icon: <TrendingUp size={18} />, color: PURPLE, bg: "#f5f3ff", trend: "+5%" },
    { label: tx.bookingsCount, value: stats.bookingsCount.toString(), icon: <Calendar size={18} />, color: ORANGE, bg: "#fff7ed", trend: stats.bookingsCount > 0 ? "+12%" : "0%" },
  ];

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]" dir={isRTL ? "rtl" : "ltr"}>
      <div className="p-6 max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="relative mb-8">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#10b981]/5 rounded-full blur-3xl -z-10"></div>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-[1.75rem] font-bold bg-gradient-to-r from-[#111827] to-[#10b981] bg-clip-text text-transparent tracking-tight">
                {tx.revenue}
              </h1>
              <p className="text-[0.875rem] text-[#64748b] mt-1">{tx.subtitle}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchData}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-[#e2e8f0] rounded-xl text-[13px] font-medium text-[#64748b] hover:bg-white transition-all"
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                {tx.refresh}
              </button>
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#10b981] to-[#059669] text-white rounded-xl text-[13px] font-semibold hover:shadow-lg transition-all"
              >
                <Plus size={16} />
                {tx.addRevenue}
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {kpiCards.map((k, i) => (
            <div key={i} className="group bg-white rounded-2xl border border-[#e2e8f0] p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110" style={{ backgroundColor: k.color + "12" }}>
                  <span style={{ color: k.color }}>{k.icon}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium text-[#10b981] bg-[#f0fdf4] px-2 py-0.5 rounded-full">
                  <ArrowUpRight size={10} />
                  {k.trend}
                </div>
              </div>
              <p className="text-[12px] text-[#64748b] font-medium uppercase tracking-wider">{k.label}</p>
              <p className="text-[24px] font-bold text-[#1e293b] tracking-tight mt-1">{k.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">{tx.filterByProperty}</label>
              <select className={inputClass} value={selectedProperty} onChange={e => setSelectedProperty(parseInt(e.target.value))}>
                <option value={0}>{tx.allProperties}</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">{tx.filterByOwner}</label>
              <select className={inputClass} value={selectedOwner} onChange={e => setSelectedOwner(parseInt(e.target.value))}>
                <option value={0}>{tx.allOwners}</option>
                {owners.map(o => <option key={o.id} value={o.id}>{o.full_name}</option>)}
              </select>
            </div>
            <div className="relative">
              <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">{tx.search}</label>
              <Search size={14} className="absolute left-3 top-[42px] text-[#94a3b8]" />
              <input
                type="text"
                placeholder={tx.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#fafbfc] border border-[#e2e8f0] rounded-xl text-[13px] text-[#334155] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Charts - 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Revenue by Property */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#f0fdf4] flex items-center justify-center">
                <Building2 size={16} className="text-[#10b981]" />
              </div>
              <h3 className="font-semibold text-[#1e293b] text-[14px]">{tx.revenueByProperty}</h3>
            </div>
            <div className="h-[220px]">
              {revenueByProperty.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByProperty} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip formatter={(value: any) => formatCurrency(value, lang)} />
                    <Bar dataKey="revenue" fill={GREEN} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-[12px] text-[#94a3b8]">{tx.noData}</p>
                </div>
              )}
            </div>
          </div>

          {/* Revenue by Owner */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#eff6ff] flex items-center justify-center">
                <Users size={16} className="text-[#3b82f6]" />
              </div>
              <h3 className="font-semibold text-[#1e293b] text-[14px]">{tx.revenueByOwner}</h3>
            </div>
            <div className="h-[220px]">
              {revenueByOwner.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByOwner} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip formatter={(value: any) => formatCurrency(value, lang)} />
                    <Bar dataKey="revenue" fill={BLUE} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-[12px] text-[#94a3b8]">{tx.noData}</p>
                </div>
              )}
            </div>
          </div>

          {/* Revenue by Platform */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#f5f3ff] flex items-center justify-center">
                <Globe size={16} className="text-[#8b5cf6]" />
              </div>
              <h3 className="font-semibold text-[#1e293b] text-[14px]">{tx.revenueByPlatform}</h3>
            </div>
            <div className="h-[220px]">
              {platformRevenues.length > 0 && platformRevenues[0].revenue > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={platformRevenues} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="revenue" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: "#cbd5e1", strokeWidth: 1 }}>
                      {platformRevenues.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value, lang)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-[12px] text-[#94a3b8]">{tx.noData}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Performer Banner */}
        {topPerformer && topPerformer.revenue > 0 && (
          <div className="bg-gradient-to-r from-[#f0fdf4] to-[#ffffff] border border-[#bbf7d0] rounded-2xl p-4 mb-6 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#f0fdf4] flex items-center justify-center">
                <TrendingUp size={22} className="text-[#10b981]" />
              </div>
              <div>
                <p className="text-[11px] text-[#64748b] font-medium uppercase tracking-wider">{tx.topPerformer}</p>
                <p className="text-[16px] font-bold text-[#1e293b]">{topPerformer.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[22px] font-bold text-[#10b981]">{formatCurrency(topPerformer.revenue, lang)}</p>
              <p className="text-[10px] text-[#94a3b8]">Total revenus</p>
            </div>
          </div>
        )}

        {/* Revenue Table */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-gradient-to-r from-[#fafbfc] to-[#f8fafc]">
                  <th className="text-left px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{tx.property}</th>
                  <th className="text-left px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{tx.guest}</th>
                  <th className="text-left px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{tx.platform}</th>
                  <th className="text-right px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{tx.revenue}</th>
                  <th className="text-right px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{tx.commission}</th>
                  <th className="text-right px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{tx.ownerRevenue}</th>
                  <th className="text-center px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{tx.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filteredRevenues.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="w-16 h-16 rounded-full bg-[#f1f5f9] flex items-center justify-center mx-auto mb-3">
                        <DollarSign size={24} className="text-[#94a3b8]" />
                      </div>
                      <p className="text-[#94a3b8] text-[13px] font-medium">{tx.noData}</p>
                    </td>
                  </tr>
                ) : (
                  filteredRevenues.map((r) => (
                    <tr key={r.id} className="hover:bg-[#fafbfc] transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#f1f5f9] flex items-center justify-center group-hover:bg-[#e2e8f0] transition-colors">
                            <Home size={12} className="text-[#64748b]" />
                          </div>
                          <span className="font-semibold text-[#1e293b] text-[13px]">{r.property_name || "—"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <User size={11} className="text-[#94a3b8]" />
                          <span className="text-[13px] text-[#64748b]">{r.guest_name || "—"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#f1f5f9] text-[#64748b]">
                          {r.platform || "Direct"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-bold text-[#10b981] text-[13px]">{formatCurrency(r.amount, lang)}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-[#3b82f6] text-[13px] font-medium">{formatCurrency(r.commission, lang)}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-[#f59e0b] text-[13px] font-medium">{formatCurrency(r.owner_amount, lang)}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEditModal(r)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors" title={tx.editRevenue}>
                            <Edit size={13} />
                          </button>
                          <button onClick={() => { setSelectedRevenue(r); setShowDeleteModal(true); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-500 transition-colors" title={tx.deleteRevenue}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Revenue Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all">
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#10b981] to-[#059669] rounded-t-2xl"></div>
              <div className="p-6 border-b border-[#f1f5f9] flex justify-between items-center sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-[18px] font-bold bg-gradient-to-r from-[#111827] to-[#10b981] bg-clip-text text-transparent">
                    {selectedRevenue ? tx.editRevenue : tx.addRevenue}
                  </h2>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5">{selectedRevenue ? 'Mettre à jour' : 'Nouvel enregistrement'}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-[#94a3b8] hover:text-[#334155] transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9]">
                  <X size={18} />
                </button>
              </div>
            </div>
            
            {formError && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                <AlertCircle size={14} className="text-red-500" />
                <p className="text-red-600 text-[12px]">{formError}</p>
              </div>
            )}
            
            <div className="p-6 space-y-5">
              {/* Property Details Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 size={14} className="text-[#10b981]" />
                  <h3 className="text-[13px] font-semibold text-[#1e293b]">{tx.propertyDetails}</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">{tx.propertyName} *</label>
                    <select className={inputClass} value={form.property_id} onChange={e => setForm({ ...form, property_id: e.target.value })}>
                      <option value="">Sélectionner</option>
                      {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">{tx.guestName} *</label>
                    <input className={inputClass} placeholder="Jean Dupont" value={form.guest_name} onChange={e => setForm({ ...form, guest_name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">{tx.platform}</label>
                    <select className={inputClass} value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}>
                      <option value="">Sélectionner</option>
                      <option value="Airbnb">Airbnb</option>
                      <option value="Booking.com">Booking.com</option>
                      <option value="Direct">Direct</option>
                      <option value="Google Travel">Google Travel</option>
                      <option value="Vrbo">Vrbo</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Stay Details Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={14} className="text-[#10b981]" />
                  <h3 className="text-[13px] font-semibold text-[#1e293b]">{tx.stayDetails}</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">{tx.checkIn} *</label>
                    <input type="date" className={inputClass} value={form.check_in} onChange={e => setForm({ ...form, check_in: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">{tx.checkOut} *</label>
                    <input type="date" className={inputClass} value={form.check_out} onChange={e => setForm({ ...form, check_out: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">{tx.nights}</label>
                    <input type="number" className={inputClass} placeholder="3" value={form.nights} onChange={e => setForm({ ...form, nights: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">{tx.pricePerNight} (MAD)</label>
                    <input type="number" className={inputClass} placeholder="500" value={form.price_per_night} onChange={e => setForm({ ...form, price_per_night: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Commission Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} className="text-[#10b981]" />
                  <h3 className="text-[13px] font-semibold text-[#1e293b]">Commission</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">{tx.commissionRate} (%)</label>
                    <input type="number" step="0.1" className={inputClass} placeholder="15" value={form.commission_rate} onChange={e => setForm({ ...form, commission_rate: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">{tx.ownerAmount}</label>
                    <div className="bg-gradient-to-r from-[#f0fdf4] to-[#dcfce7] rounded-xl p-3 border border-[#d1fae5]">
                      <p className="text-[16px] font-bold text-[#10b981] text-center">{formatCurrency(calculated.owner_amount, lang)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculated Preview */}
              {(calculated.amount > 0 || calculated.commission > 0) && (
                <div className="bg-[#fafbfc] rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-[#64748b]">Total réservation</p>
                    <p className="text-[14px] font-bold text-[#1e293b]">{formatCurrency(calculated.amount, lang)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#64748b]">Commission agence</p>
                    <p className="text-[14px] font-bold text-[#3b82f6]">{formatCurrency(calculated.commission, lang)}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[#f1f5f9] flex gap-3 bg-[#fafbfc]">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-[#e2e8f0] text-[#64748b] font-semibold hover:bg-white transition-all text-[13px]">
                {tx.cancel}
              </button>
              <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 text-[13px] disabled:opacity-50">
                {submitting && <Loader2 className="animate-spin" size={16} />}
                {submitting ? "Enregistrement..." : tx.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRevenue && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all">
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ef4444] to-[#dc2626] rounded-t-2xl"></div>
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={22} className="text-red-500" />
                </div>
                <h2 className="text-[18px] font-bold text-[#1e293b] mb-2">{tx.deleteRevenue}</h2>
                <p className="text-[13px] text-[#64748b]">{tx.confirmDelete}</p>
                <div className="flex gap-3 mt-6 pt-2">
                  <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 rounded-xl border border-[#e2e8f0] text-[#64748b] font-semibold hover:bg-[#fafbfc] transition-all text-[13px]">
                    {tx.cancel}
                  </button>
                  <button onClick={handleDelete} disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 text-[13px] disabled:opacity-50">
                    {submitting && <Loader2 className="animate-spin" size={16} />}
                    {submitting ? "Suppression..." : tx.deleteRevenue}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}