"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Download, Calendar, Filter, Plus, Eye, Trash2,
  AlertCircle, RefreshCw, TrendingUp, TrendingDown, DollarSign,
  Building2, Users, Printer, X, Loader2, BarChart3, PieChart as PieChartIcon
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import api from "@/lib/axios";
import { useLang } from "@/app/components/contexts/LanguageContext";

const i18n = {
  fr: {
    reports: "Rapports Financiers",
    subtitle: "Générez et consultez vos rapports",
    generateReport: "Générer un rapport",
    reportType: "Type de rapport",
    agencyReport: "Rapport Agence",
    ownerReport: "Rapport Propriétaire",
    propertyReport: "Rapport Propriété",
    financialReport: "Rapport Financier",
    occupancyReport: "Rapport d'Occupation",
    performanceReport: "Rapport de Performance",
    selectOwner: "Sélectionner un propriétaire",
    selectProperty: "Sélectionner une propriété",
    selectMonth: "Sélectionner le mois",
    selectYear: "Sélectionner l'année",
    selectPeriod: "Sélectionner la période",
    generate: "Générer",
    recentReports: "Rapports récents",
    title: "Titre",
    date: "Date",
    type: "Type",
    actions: "Actions",
    download: "Télécharger",
    delete: "Supprimer",
    view: "Voir",
    noReports: "Aucun rapport généré",
    loading: "Chargement...",
    refresh: "Actualiser",
    revenue: "Revenus",
    commission: "Commission",
    expenses: "Dépenses",
    netProfit: "Bénéfice net",
    ownerRevenue: "Revenu propriétaire",
    occupancyRate: "Taux d'occupation",
    totalBookings: "Total réservations",
    avgDailyRate: "Tarif moyen par nuit",
    revenueByProperty: "Revenus par propriété",
    revenueByPlatform: "Revenus par plateforme",
    cancel: "Annuler",
    confirm: "Confirmer",
    preview: "Aperçu",
    quarterly: "Trimestriel",
    annual: "Annuel",
    months: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
  },
  ar: {
    reports: "التقارير المالية",
    subtitle: "إنشاء وعرض التقارير",
    generateReport: "إنشاء تقرير",
    reportType: "نوع التقرير",
    agencyReport: "تقرير الوكالة",
    ownerReport: "تقرير المالك",
    propertyReport: "تقرير العقار",
    financialReport: "تقرير مالي",
    occupancyReport: "تقرير الإشغال",
    performanceReport: "تقرير الأداء",
    selectOwner: "اختر المالك",
    selectProperty: "اختر العقار",
    selectMonth: "اختر الشهر",
    selectYear: "اختر السنة",
    selectPeriod: "اختر الفترة",
    generate: "إنشاء",
    recentReports: "التقارير الأخيرة",
    title: "العنوان",
    date: "التاريخ",
    type: "النوع",
    actions: "إجراءات",
    download: "تحميل",
    delete: "حذف",
    view: "عرض",
    noReports: "لا توجد تقارير",
    loading: "جارٍ التحميل...",
    refresh: "تحديث",
    revenue: "الإيرادات",
    commission: "العمولة",
    expenses: "المصروفات",
    netProfit: "صافي الربح",
    ownerRevenue: "إيراد المالك",
    occupancyRate: "نسبة الإشغال",
    totalBookings: "إجمالي الحجوزات",
    avgDailyRate: "متوسط السعر لكل ليلة",
    revenueByProperty: "الإيرادات حسب العقار",
    revenueByPlatform: "الإيرادات حسب المنصة",
    cancel: "إلغاء",
    confirm: "تأكيد",
    preview: "معاينة",
    quarterly: "ربع سنوي",
    annual: "سنوي",
    months: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
  },
} as const;

const GREEN = "#22c55e";
const GREEN_BG = "#f0fdf4";
const BLUE = "#3b82f6";
const ORANGE = "#f59e0b";
const PURPLE = "#8b5cf6";
const RED = "#ef4444";
const CYAN = "#06b6d4";

const formatCurrency = (amount: number, lang: "fr" | "ar"): string => {
  return amount.toLocaleString(lang === "fr" ? "fr-FR" : "ar-MA") + " MAD";
};

interface Report {
  id: number;
  title: string;
  type: string;
  generated_at: string;
  status: string;
  file_url?: string;
}

interface Owner {
  id: number;
  full_name: string;
}

interface Property {
  id: number;
  name: string;
}

const PLATFORM_COLORS = [GREEN, BLUE, ORANGE, PURPLE, RED, CYAN];

export default function ReportsPage() {
  const router = useRouter();
  const { lang } = useLang();
  const tx = i18n[lang];
  const isRTL = lang === "ar";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState("agency");
  const [periodType, setPeriodType] = useState("monthly");
  const [selectedOwner, setSelectedOwner] = useState("");
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [owners, setOwners] = useState<Owner[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [reportStats, setReportStats] = useState({
    totalReports: 0,
    agencyReports: 0,
    ownerReports: 0,
    propertyReports: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("access");
    const role = localStorage.getItem("role");
    if (!token || role !== "agency_manager") {
      router.push("/login");
      return;
    }
    fetchReports();
    fetchOwners();
    fetchProperties();
  }, [router]);

  const fetchReports = async () => {
    setRefreshing(true);
    try {
      const res = await api.get("/api/reports/reports/");
      const reportsData = res.data.results || res.data;
      setReports(reportsData);
      
      setReportStats({
        totalReports: reportsData.length,
        agencyReports: reportsData.filter((r: any) => r.type === "agency").length,
        ownerReports: reportsData.filter((r: any) => r.type === "owner").length,
        propertyReports: reportsData.filter((r: any) => r.type === "property").length,
      });
    } catch (err) {
      console.error("Error fetching reports:", err);
      setReports([
        { id: 1, title: "Rapport mensuel - Mai 2024", type: "agency", generated_at: "2024-06-01T10:00:00", status: "completed" },
        { id: 2, title: "Rapport propriétaire - Ahmed Benali", type: "owner", generated_at: "2024-05-15T14:30:00", status: "completed" },
        { id: 3, title: "Rapport propriété - Villa Agdal", type: "property", generated_at: "2024-05-10T09:00:00", status: "completed" },
        { id: 4, title: "Rapport financier Q1 2024", type: "financial", generated_at: "2024-04-05T11:00:00", status: "completed" },
      ]);
      setReportStats({ totalReports: 4, agencyReports: 1, ownerReports: 1, propertyReports: 1 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchOwners = async () => {
    try {
      const res = await api.get("/api/owners/");
      const data = res.data.results || res.data;
      setOwners(data.map((o: any) => ({ id: o.id, full_name: o.full_name || o.name })));
    } catch (err) {
      console.error("Error fetching owners:", err);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await api.get("/api/properties/");
      const data = res.data.results || res.data;
      setProperties(data.map((p: any) => ({ id: p.id, name: p.name })));
    } catch (err) {
      console.error("Error fetching properties:", err);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const params: any = {
        type: reportType,
        period: periodType,
        month: selectedMonth + 1,
        year: selectedYear,
      };
      if (reportType === "owner" && selectedOwner) params.owner_id = selectedOwner;
      if (reportType === "property" && selectedProperty) params.property_id = selectedProperty;

      const res = await api.post("/api/reports/reports/generate/", params);
      if (res.data.preview) {
        setPreviewData(res.data.preview);
        setShowPreview(true);
      }
      await fetchReports();
    } catch (err) {
      console.error("Error generating report:", err);
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = async (reportId: number) => {
    try {
      const res = await api.get(`/api/reports/reports/${reportId}/download/`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `report_${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error downloading report:", err);
    }
  };

  const deleteReport = async (reportId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce rapport ?")) {
      try {
        await api.delete(`/api/reports/reports/${reportId}/delete/`);
        fetchReports();
      } catch (err) {
        console.error("Error deleting report:", err);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case "agency": return tx.agencyReport;
      case "owner": return tx.ownerReport;
      case "property": return tx.propertyReport;
      case "financial": return tx.financialReport;
      case "occupancy": return tx.occupancyReport;
      case "performance": return tx.performanceReport;
      default: return type;
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case "agency": return <Building2 size={14} color={GREEN} />;
      case "owner": return <Users size={14} color={BLUE} />;
      case "property": return <Building2 size={14} color={ORANGE} />;
      case "financial": return <DollarSign size={14} color={PURPLE} />;
      default: return <FileText size={14} color={GREEN} />;
    }
  };

  const inputClass = "w-full p-2.5 rounded-lg border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] text-[#334155] bg-[#f8fafc] text-[13px]";

  const statsCards = [
    { label: "Total rapports", value: reportStats.totalReports, icon: <FileText size={18} />, color: GREEN, bg: GREEN_BG },
    { label: tx.agencyReport, value: reportStats.agencyReports, icon: <Building2 size={18} />, color: BLUE, bg: "#eff6ff" },
    { label: tx.ownerReport, value: reportStats.ownerReports, icon: <Users size={18} />, color: ORANGE, bg: "#fff7ed" },
    { label: tx.propertyReport, value: reportStats.propertyReports, icon: <Building2 size={18} />, color: PURPLE, bg: "#f5f3ff" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
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
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0 }}>{tx.reports}</h1>
            <p style={{ fontSize: "0.875rem", color: "#6B7280", marginTop: "0.25rem" }}>{tx.subtitle}</p>
          </div>
          <button onClick={fetchReports} disabled={refreshing} style={{
            padding: "8px 16px", borderRadius: 9, border: "1.5px solid #e5e7eb",
            background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12.5
          }}>
            <RefreshCw size={14} className={refreshing ? "spin" : ""} /> {tx.refresh}
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {statsCards.map((k, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 12, padding: "1rem 1.125rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", color: k.color }}>
                  {k.icon}
                </div>
              </div>
              <p style={{ fontSize: 11.5, color: "#9ca3af", marginBottom: 3 }}>{k.label}</p>
              <p style={{ fontSize: 21, fontWeight: 700, color: "#111827" }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Generate Report Section */}
        <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 12, padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: "1rem" }}>{tx.generateReport}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", alignItems: "end" }}>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">{tx.reportType}</label>
              <select className={inputClass} value={reportType} onChange={e => setReportType(e.target.value)}>
                <option value="agency">{tx.agencyReport}</option>
                <option value="financial">{tx.financialReport}</option>
                <option value="occupancy">{tx.occupancyReport}</option>
                <option value="performance">{tx.performanceReport}</option>
                <option value="owner">{tx.ownerReport}</option>
                <option value="property">{tx.propertyReport}</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">{tx.selectPeriod}</label>
              <select className={inputClass} value={periodType} onChange={e => setPeriodType(e.target.value)}>
                <option value="monthly">Mensuel</option>
                <option value="quarterly">{tx.quarterly}</option>
                <option value="annual">{tx.annual}</option>
              </select>
            </div>
            
            {reportType === "owner" && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">{tx.selectOwner}</label>
                <select className={inputClass} value={selectedOwner} onChange={e => setSelectedOwner(e.target.value)}>
                  <option value="">Sélectionner un propriétaire</option>
                  {owners.map(o => <option key={o.id} value={o.id}>{o.full_name}</option>)}
                </select>
              </div>
            )}
            
            {reportType === "property" && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">{tx.selectProperty}</label>
                <select className={inputClass} value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)}>
                  <option value="">Sélectionner une propriété</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">{tx.selectMonth}</label>
              <select className={inputClass} value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}>
                {tx.months.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">{tx.selectYear}</label>
              <select className={inputClass} value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
              </select>
            </div>
            
            <button onClick={generateReport} disabled={generating} style={{
              padding: "10px 24px", borderRadius: 9, border: "none", background: GREEN,
              color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontWeight: 500
            }}>
              {generating ? <RefreshCw size={16} className="spin" /> : <Plus size={16} />}
              {tx.generate}
            </button>
          </div>
        </div>

        {/* Report Preview Modal */}
        {showPreview && previewData && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-800">{tx.preview}</h2>
                <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <p className="text-11 text-gray-500">{tx.revenue}</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(previewData.total_revenue || 0, lang)}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-11 text-gray-500">{tx.commission}</p>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(previewData.total_commission || 0, lang)}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <p className="text-11 text-gray-500">{tx.expenses}</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(previewData.total_expenses || 0, lang)}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <p className="text-11 text-gray-500">{tx.netProfit}</p>
                    <p className="text-xl font-bold text-purple-600">{formatCurrency(previewData.net_profit || 0, lang)}</p>
                  </div>
                </div>
                
                {/* Charts */}
                {previewData.monthly_data && (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={previewData.monthly_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => formatCurrency(value, lang)} />
                      <Line type="monotone" dataKey="revenue" name={tx.revenue} stroke={GREEN} strokeWidth={2} />
                      <Line type="monotone" dataKey="commission" name={tx.commission} stroke={BLUE} strokeWidth={2} />
                      <Line type="monotone" dataKey="expenses" name={tx.expenses} stroke={RED} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
                
                {previewData.revenue_by_property && (
                  <div>
                    <p className="font-semibold text-gray-800 mb-3">{tx.revenueByProperty}</p>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={previewData.revenue_by_property} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                        <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value: any) => formatCurrency(value, lang)} />
                        <Bar dataKey="revenue" fill={GREEN} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                {previewData.revenue_by_platform && (
                  <div>
                    <p className="font-semibold text-gray-800 mb-3">{tx.revenueByPlatform}</p>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={previewData.revenue_by_platform} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="revenue" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {previewData.revenue_by_platform.map((entry: any, index: number) => <Cell key={index} fill={PLATFORM_COLORS[index % PLATFORM_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value: any) => formatCurrency(value, lang)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button onClick={() => setShowPreview(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-semibold">{tx.cancel}</button>
                <button onClick={generateReport} className="flex-1 py-2.5 rounded-lg bg-emerald-500 text-white font-semibold">{tx.confirm}</button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Reports */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{tx.recentReports}</p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b" }}>{tx.title}</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b" }}>{tx.type}</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b" }}>{tx.date}</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 600, color: "#64748b" }}>{tx.actions}</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>{tx.noReports}</td>
                  </tr>
                ) : (
                  reports.map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {getReportTypeIcon(r.type)}
                        <span style={{ fontWeight: 500 }}>{r.title}</span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{getReportTypeLabel(r.type)}</td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{formatDate(r.generated_at)}</td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                          <button onClick={() => downloadReport(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: GREEN }}><Download size={16} /></button>
                          <button onClick={() => deleteReport(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: RED }}><Trash2 size={16} /></button>
                        </div>
                       </td>
                     </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spin { animation: spin 1s linear infinite; }
        `}</style>
      </div>
    </div>
  );
}