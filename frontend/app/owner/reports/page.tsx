"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, Calendar, Filter, ChevronDown, ChevronUp } from "lucide-react";
import api from "@/lib/axios";
import { useLang } from "../contexts/LanguageContext";

const i18n = {
  fr: {
    breadcrumb:    "Accueil › Rapports",
    title:         "Bibliothèque de rapports",
    subtitle:      "Rapports financiers générés par votre agence",
    filtersLabel:  "Filtres :",
    all:           "Tous",
    monthly:       "Mensuel",
    yearly:        "Annuel",
    allYears:      "Toutes les années",
    found:         (n: number) => `${n} rapport${n !== 1 ? "s" : ""} trouvé${n !== 1 ? "s" : ""}`,
    generated:     "Généré le :",
    monthlyReport: "Rapport mensuel",
    yearlyReport:  "Rapport annuel",
    netProfit:     "Bénéfice net",
    download:      "Télécharger",
    totalRevenue:  "Revenus totaux",
    commission:    "Commission",
    expenses:      "Dépenses",
    genByAgency:   "Généré par l'agence le",
    noReports:     "Aucun rapport disponible",
    noReportsSub:  "Les rapports apparaîtront ici une fois générés par votre agence",
    totalAvail:    (n: number) => `Total des rapports disponibles : `,
    loading:       "Chargement...",
  },
  ar: {
    breadcrumb:    "الرئيسية › التقارير",
    title:         "مكتبة التقارير",
    subtitle:      "التقارير المالية التي أنشأتها وكالتك",
    filtersLabel:  "التصفية:",
    all:           "الكل",
    monthly:       "شهري",
    yearly:        "سنوي",
    allYears:      "كل السنوات",
    found:         (n: number) => `${n} تقرير`,
    generated:     "تم التوليد:",
    monthlyReport: "تقرير شهري",
    yearlyReport:  "تقرير سنوي",
    netProfit:     "صافي الربح",
    download:      "تحميل",
    totalRevenue:  "إجمالي الإيرادات",
    commission:    "العمولة",
    expenses:      "المصروفات",
    genByAgency:   "تم التوليد بواسطة الوكالة في",
    noReports:     "لا توجد تقارير متاحة",
    noReportsSub:  "ستظهر التقارير هنا بعد توليدها من طرف الوكالة",
    totalAvail:    (n: number) => `إجمالي التقارير المتاحة: `,
    loading:       "جارٍ التحميل...",
  },
} as const;

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
}

export default function OwnerReportsPage() {

  const router = useRouter();

  const { lang } = useLang();
  const tx    = i18n[lang];
  const isRTL = lang === "ar";

  const [reports, setReports]               = useState<Report[]>([]);
  const [loading, setLoading]               = useState(true);
  const [downloading, setDownloading]       = useState<number | null>(null);
  const [filterType, setFilterType]         = useState<"all" | "monthly" | "yearly">("all");
  const [selectedYear, setSelectedYear]     = useState<number | "all">("all");
  const [expandedReport, setExpandedReport] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) router.push("/login");
  }, [router]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/reports/reports/?report_scope=owner");
      const reportsData = response.data.reports || [];
      reportsData.sort((a: Report, b: Report) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setReports(reportsData);
    } catch (err) {
      console.error("Error fetching reports:", err);
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
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download report");
    } finally {
      setDownloading(null);
    }
  };

  const filteredReports = reports.filter(report => {
    if (filterType !== "all" && report.report_type !== filterType) return false;
    if (selectedYear !== "all" && report.year !== selectedYear) return false;
    return true;
  });

  const availableYears = [...new Set(reports.map(r => r.year))].sort((a, b) => b - a);

  return (
    <div
      className="p-8 bg-[#f9fafb] min-h-screen"
      style={{
        direction: isRTL ? "rtl" : "ltr",
        fontFamily: isRTL ? "'Cairo', system-ui, sans-serif" : "'Geist', system-ui, sans-serif",
      }}
    >

      <div className={`flex justify-between items-start mb-8 flex-wrap gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
        <div>
          <p className="text-sm text-gray-400 mb-1">{tx.breadcrumb}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tx.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{tx.subtitle}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className={`flex flex-wrap gap-4 items-center ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
            <Filter size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">{tx.filtersLabel}</span>
          </div>

          <div className="flex gap-2">
            {(["all", "monthly", "yearly"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  filterType === f
                    ? "bg-[#22c55e] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f === "all" ? tx.all : f === "monthly" ? tx.monthly : tx.yearly}
              </button>
            ))}
          </div>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#22c55e]"
          >
            <option value="all">{tx.allYears}</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          {reports.length > 0 && (
            <span className={`text-xs text-gray-400 ${isRTL ? "mr-auto" : "ml-auto"}`}>
              {tx.found(filteredReports.length)}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
              <div className={`flex justify-between items-start ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className={`flex items-start gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                  <div>
                    <div className="h-5 bg-gray-100 rounded w-48 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-32" />
                  </div>
                </div>
                <div className="w-24 h-8 bg-gray-100 rounded-lg" />
              </div>
            </div>
          ))
        ) : filteredReports.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <FileText size={48} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500 font-medium">{tx.noReports}</p>
            <p className="text-sm text-gray-400 mt-1">{tx.noReportsSub}</p>
          </div>
        ) : (
          filteredReports.map((report) => {
            const isExpanded = expandedReport === report.id;
            return (
              <div
                key={report.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all"
              >
                <div className="p-5">
                  <div className={`flex justify-between items-start ${isRTL ? "flex-row-reverse" : ""}`}>
                    <div className={`flex items-start gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <div className="w-12 h-12 rounded-xl bg-[#f0fdf4] flex-shrink-0"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FileText size={22} className="text-[#22c55e]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{report.name}</h3>
                        <div className={`flex items-center gap-3 mt-1 flex-wrap ${isRTL ? "flex-row-reverse" : ""}`}>
                          <span className={`text-xs text-gray-400 flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                            <Calendar size={12} />
                            {tx.generated} {report.created_at}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            report.report_type === "monthly"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-[#f0fdf4] text-[#22c55e]"
                          }`}>
                            {report.report_type === "monthly" ? tx.monthlyReport : tx.yearlyReport}
                          </span>
                          <span className="text-xs text-gray-400">{report.property_name}</span>
                        </div>
                      </div>
                    </div>

                    <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <div className={isRTL ? "text-left ml-2" : "text-right mr-2"}>
                        <p className="text-sm font-semibold text-green-600">
                          {report.net_profit.toLocaleString()} MAD
                        </p>
                        <p className="text-xs text-gray-400">{tx.netProfit}</p>
                      </div>
                      <button
                        onClick={() => handleDownload(report.id, report.name)}
                        disabled={downloading === report.id}
                        className={`flex items-center gap-2 bg-[#22c55e] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#16a34a] transition-all disabled:opacity-50 ${isRTL ? "flex-row-reverse" : ""}`}
                      >
                        {downloading === report.id
                          ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          : <Download size={15} />
                        }
                        {downloading === report.id ? "..." : tx.download}
                      </button>
                      <button
                        onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                        className="p-2 text-gray-400 hover:text-[#22c55e] transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-5 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-400">{tx.totalRevenue}</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {report.total_revenue.toLocaleString()} MAD
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">{tx.commission}</p>
                          <p className="text-lg font-semibold text-red-500">
                            {report.total_commission.toLocaleString()} MAD
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">{tx.expenses}</p>
                          <p className="text-lg font-semibold text-orange-500">
                            {report.total_expenses.toLocaleString()} MAD
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">{tx.netProfit}</p>
                          <p className="text-lg font-semibold text-[#22c55e]">
                            {report.net_profit.toLocaleString()} MAD
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                        {tx.genByAgency} {report.created_at}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {!loading && reports.length > 0 && (
        <div className="mt-6 bg-[#f0fdf4] border border-green-100 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">
            {tx.totalAvail(reports.length)}
            <span className="font-semibold text-[#22c55e]">{reports.length}</span>
          </p>
        </div>
      )}
    </div>
  );
}