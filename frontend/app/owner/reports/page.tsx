"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Download, FileText, Calendar, Filter, ChevronDown, ChevronUp, 
  Plus, Printer, Eye, TrendingUp, DollarSign, Wallet, Building2,
  X, BarChart3, Clock, Award, Target, Zap, MessageCircle
} from "lucide-react";
import api from "@/lib/axios";
import { useLang } from "@/app/components/contexts/LanguageContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const i18n = {
  fr: {
    availableReports: "Rapports disponibles",
    latestReport: "Dernier rapport",
    totalRevenueYear: "Revenus annuels",
    reportsList: "Liste des rapports",
    report: "Rapport",
    period: "Période",
    property: "Propriété",
    generatedOn: "Généré le",
    action: "Action",
    monthlyReport: "Rapport mensuel",
    yearlyReport: "Rapport annuel",
    download: "Télécharger",
    contactAgency: "Contacter l'agence",
    allProperties: "Toutes les propriétés",
    allPeriods: "Toutes les périodes",
    filters: "Filtres",
    reset: "Réinitialiser",
    loading: "Chargement...",
    noReports: "Aucun rapport disponible",
    noReportsSub: "Les rapports seront disponibles après publication par votre agence",
    reportsCount: (n: number) => `${n} rapport${n !== 1 ? "s" : ""} disponible${n !== 1 ? "s" : ""}`,
    contactMessage: "Vous avez une question sur vos rapports ? Notre équipe est là pour vous aider.",
    contactSupport: "Contacter le support",
    months: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
  },
  ar: {
    availableReports: "التقارير المتاحة",
    latestReport: "آخر تقرير",
    totalRevenueYear: "الإيرادات السنوية",
    reportsList: "قائمة التقارير",
    report: "التقرير",
    period: "الفترة",
    property: "العقار",
    generatedOn: "تاريخ التوليد",
    action: "إجراء",
    monthlyReport: "تقرير شهري",
    yearlyReport: "تقرير سنوي",
    download: "تحميل",
    contactAgency: "اتصل بالوكالة",
    allProperties: "جميع العقارات",
    allPeriods: "كل الفترات",
    filters: "تصفية",
    reset: "إعادة تعيين",
    loading: "جارٍ التحميل...",
    noReports: "لا توجد تقارير متاحة",
    noReportsSub: "ستظهر التقارير هنا بعد نشرها من قبل وكالتك",
    reportsCount: (n: number) => `${n} تقرير`,
    contactMessage: "هل لديك سؤال حول تقاريرك؟ فريقنا هنا لمساعدتك.",
    contactSupport: "اتصل بالدعم",
    months: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
  },
} as const;

interface Property {
  id: number;
  name: string;
  location: string;
}

interface Report {
  id: number;
  name: string;
  report_type: string;
  report_scope: string;
  month: number | null;
  year: number;
  property_id: number | null;
  property_name: string;
  total_revenue: number;
  total_commission: number;
  total_expenses: number;
  net_profit: number;
  property_count: number;
  created_at: string;
  details: any;
  bookings_count?: number;
  occupancy_rate?: number;
}

const GREEN = "#22c55e";
const GREEN_DARK = "#16a34a";
const GREEN_BG = "#f0fdf4";
const BLUE = "#3b82f6";
const RED = "#ef4444";
const ORANGE = "#f59e0b";
const PURPLE = "#8b5cf6";

const formatCurrency = (amount: number, lang: "fr" | "ar"): string => {
  return amount.toLocaleString(lang === "fr" ? "fr-FR" : "ar-MA") + " MAD";
};

const formatDate = (dateStr: string, lang: "fr" | "ar"): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(lang === "fr" ? "fr-FR" : "ar-MA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export default function OwnerReportsPage() {
  const router = useRouter();
  const { lang } = useLang();
  const tx = i18n[lang];
  const isRTL = lang === "ar";

  const [reports, setReports] = useState<Report[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);
  
  // Filters
  const [filterYear, setFilterYear] = useState<number | "all">("all");
  const [filterProperty, setFilterProperty] = useState<number | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) router.push("/login");
  }, [router]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch properties
      const propsRes = await api.get("/api/properties/");
      const propsData = Array.isArray(propsRes.data) ? propsRes.data : propsRes.data.results ?? [];
      setProperties(propsData);
      
      // Fetch reports
      const reportsRes = await api.get("/api/reports/reports/?report_scope=owner");
      const reportsData = reportsRes.data.reports || [];
      reportsData.sort((a: Report, b: Report) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      // Enhance reports with additional data
      const enhancedReports = await Promise.all(reportsData.map(async (report: Report) => {
        if (report.report_type === "monthly" && report.month && report.year && report.property_id) {
          try {
            const finRes = await api.get(`/api/financials/monthly-summary/${report.property_id}/?year=${report.year}`);
            const monthData = finRes.data.find((item: any) => item.month === report.month);
            if (monthData) {
              return {
                ...report,
                bookings_count: monthData.bookings_count || 0,
                occupancy_rate: monthData.occupancy_rate || 0,
              };
            }
          } catch (err) {
            console.warn("Error fetching additional data:", err);
          }
        }
        return report;
      }));
      
      setReports(enhancedReports);
    } catch (err) {
      console.error("Error fetching data:", err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (reportId: number, reportName: string) => {
    setDownloading(reportId);
    try {
      const res = await api.get(`/api/reports/reports/${reportId}/download/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportName.replace(/\s/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download report");
    } finally {
      setDownloading(null);
    }
  };

  const contactAgency = () => {
    window.open(`https://wa.me/212600000000?text=Bonjour%2C%20j%27ai%20une%20question%20concernant%20mes%20rapports%20financiers`, "_blank");
  };

  const filteredReports = reports.filter(report => {
    if (filterYear !== "all" && report.year !== filterYear) return false;
    if (filterProperty !== "all" && report.property_id !== filterProperty) return false;
    return true;
  });

  const availableYears = [...new Set(reports.map(r => r.year))].sort((a, b) => b - a);
  
  const latestReport = reports[0];
  const availableReportsCount = reports.length;
  
  // Calculate total revenue for current year
  const currentYear = new Date().getFullYear();
  const totalRevenueThisYear = reports
    .filter(r => r.year === currentYear)
    .reduce((sum, r) => sum + r.total_revenue, 0);

  const getMonthName = (month: number) => {
    return tx.months[month - 1] || "";
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", background: "#f9fafb", minHeight: "100vh" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {[...Array(3)].map((_, i) => (
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
      fontFamily: isRTL ? "'Cairo', system-ui" : "'Geist', system-ui",
      direction: isRTL ? "rtl" : "ltr",
      background: "#f9fafb",
      minHeight: "100vh",
      padding: "1.75rem 2rem"
    }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* Header with Contact Button only - no title/subtitle */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <button 
            onClick={contactAgency}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: GREEN,
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              fontWeight: 500,
              transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = GREEN_DARK}
            onMouseLeave={e => e.currentTarget.style.background = GREEN}
          >
            <MessageCircle size={16} />
            {tx.contactAgency}
          </button>
        </div>

        {/* KPI Cards */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(3, 1fr)", 
          gap: "1.25rem", 
          marginBottom: "1.75rem" 
        }}>
          {/* Available Reports Card */}
          <div style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileText size={20} color={GREEN} />
              </div>
              <div>
                <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 2 }}>{tx.availableReports}</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: "#111827" }}>{availableReportsCount}</p>
              </div>
            </div>
            <p style={{ fontSize: 11, color: "#d1d5db" }}>{tx.reportsCount(availableReportsCount)}</p>
          </div>

          {/* Latest Report Card */}
          <div style={{
            background: "linear-gradient(135deg, #f0fdf4, #ffffff)",
            border: `1px solid ${GREEN}`,
            borderRadius: 16,
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: GREEN_BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={20} color={GREEN} />
              </div>
              <div>
                <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 2 }}>{tx.latestReport}</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
                  {latestReport ? `${getMonthName(latestReport.month || 0)} ${latestReport.year}` : "—"}
                </p>
              </div>
            </div>
            {latestReport && (
              <p style={{ fontSize: 11, color: GREEN }}>
                {formatCurrency(latestReport.net_profit, lang)}
              </p>
            )}
          </div>

          {/* Total Revenue Card */}
          <div style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <DollarSign size={20} color={BLUE} />
              </div>
              <div>
                <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 2 }}>{tx.totalRevenueYear}</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: BLUE }}>
                  {formatCurrency(totalRevenueThisYear, lang)}
                </p>
              </div>
            </div>
            <p style={{ fontSize: 11, color: "#d1d5db" }}>{currentYear}</p>
          </div>
        </div>

        {/* Filters Bar */}
        <div style={{ 
          background: "#fff", 
          border: "1px solid #e5e7eb", 
          borderRadius: 12, 
          padding: "1rem 1.25rem", 
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Filter size={14} color="#9ca3af" />
            <span style={{ fontSize: 12, fontWeight: 500, color: "#6b7280" }}>{tx.filters}</span>
          </div>
          
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value === "all" ? "all" : Number(e.target.value))}
              style={{
                padding: "6px 12px",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                fontSize: 12,
                background: "#fff"
              }}
            >
              <option value="all">{tx.allPeriods}</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            
            <select
              value={filterProperty}
              onChange={(e) => setFilterProperty(e.target.value === "all" ? "all" : Number(e.target.value))}
              style={{
                padding: "6px 12px",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                fontSize: 12,
                background: "#fff"
              }}
            >
              <option value="all">{tx.allProperties}</option>
              {properties.map(prop => (
                <option key={prop.id} value={prop.id}>{prop.name}</option>
              ))}
            </select>
            
            {(filterYear !== "all" || filterProperty !== "all") && (
              <button
                onClick={() => { setFilterYear("all"); setFilterProperty("all"); }}
                style={{
                  padding: "6px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 12,
                  background: "#f9fafb",
                  cursor: "pointer"
                }}
              >
                {tx.reset}
              </button>
            )}
          </div>
          
          <span style={{ fontSize: 11, color: "#9ca3af" }}>
            {tx.reportsCount(filteredReports.length)}
          </span>
        </div>

        {/* Reports List */}
        <div style={{ 
          background: "#fff", 
          border: "1px solid #e5e7eb", 
          borderRadius: 20, 
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          marginBottom: "1.75rem"
        }}>
          <div style={{ 
            padding: "1rem 1.25rem", 
            borderBottom: "1px solid #e5e7eb",
            background: "#fafafa"
          }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111827", margin: 0 }}>
              {tx.reportsList}
            </h3>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
                    {tx.report}
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
                    {tx.period}
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
                    {tx.property}
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
                    {tx.generatedOn}
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
                    {tx.action}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "3rem", textAlign: "center" }}>
                      <FileText size={48} style={{ color: "#d1d5db", marginBottom: "1rem" }} />
                      <p style={{ color: "#9ca3af", fontWeight: 500 }}>{tx.noReports}</p>
                      <p style={{ fontSize: 12, color: "#d1d5db", marginTop: 4 }}>{tx.noReportsSub}</p>
                      
  
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => (
                    <tr key={report.id} style={{ borderBottom: "1px solid #f0f0f0", transition: "background 0.2s" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FileText size={14} color={GREEN} />
                          </div>
                          <span style={{ fontWeight: 500, fontSize: 13, color: "#111827" }}>
                            {report.report_type === "monthly" ? tx.monthlyReport : tx.yearlyReport}
                          </span>
                        </div>
                       </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#374151" }}>
                        {report.report_type === "monthly" && report.month 
                          ? `${getMonthName(report.month)} ${report.year}`
                          : report.year}
                       </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#6b7280" }}>
                        {report.property_name || "Toutes les propriétés"}
                       </td>
                      <td style={{ padding: "14px 16px", fontSize: 12, color: "#9ca3af" }}>
                        {formatDate(report.created_at, lang)}
                       </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <button
                          onClick={() => handleDownload(report.id, report.name)}
                          disabled={downloading === report.id}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 8,
                            border: "1px solid #e5e7eb",
                            background: "#fff",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 12,
                            fontWeight: 500,
                            color: GREEN,
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "#f0fdf4"}
                          onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                        >
                          {downloading === report.id ? (
                            <div style={{ width: 12, height: 12, border: "2px solid #e5e7eb", borderTopColor: GREEN, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                          ) : (
                            <Download size={12} />
                          )}
                          {tx.download}
                        </button>
                       </td>
                     </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Contact Support Section */}
        <div style={{
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
        `}</style>
      </div>
    </div>
  );
}