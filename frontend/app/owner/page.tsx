"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  DollarSign, 
  Home, 
  Wallet, 
  Download, 
  MessageCircle,
  ChevronRight,
  User
} from "lucide-react";
import api from "@/lib/axios";
import { useLang } from "./contexts/LanguageContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const labels = {
  fr: {
    welcome:        "Bienvenue",
    ownerDash:      "Tableau de bord propriétaire",
    property:       "propriété",
    properties:     "propriétés",
    home:           "Accueil",
    ownerDashTitle: "Tableau de bord propriétaire",
    overview:       "Aperçu de mes propriétés",
    support:        "Contacter le support",
    download:       "Télécharger le rapport",
    totalEarnings:  "Revenus mensuels totaux",
    propStatus:     "Statut des propriétés",
    active:         "Actif",
    outOf:          "sur",
    total:          "au total",
    netPayout:      "Paiement net (à recevoir)",
    afterComm:      "Après commission de l'agence",
    noPropTitle:    "Aucune propriété",
    noPropSub:      "Vous n'avez aucune propriété enregistrée à votre nom.",
    addProp:        "+ Ajouter une propriété",
    myEarnings:     "Revenus de mes propriétés",
    showing:        "Affichage de",
    ownedBy:        "propriété(s) vous appartenant",
    viewAll:        "Voir tout",
    propName:       "Nom de la propriété",
    statusDate:     "Statut / Date",
    grossRev:       "Revenu brut",
    commission:     "Commission",
    netPayoutCol:   "Paiement net",
    loading:        "Chargement de votre tableau de bord...",
  },
  ar: {
    welcome:        "مرحباً",
    ownerDash:      "لوحة تحكم المالك",
    property:       "عقار",
    properties:     "عقارات",
    home:           "الرئيسية",
    ownerDashTitle: "لوحة تحكم المالك",
    overview:       "نظرة عامة على عقاراتي",
    support:        "التواصل مع الدعم",
    download:       "تحميل التقرير",
    totalEarnings:  "إجمالي الأرباح الشهرية",
    propStatus:     "حالة العقارات",
    active:         "نشط",
    outOf:          "من أصل",
    total:          "إجمالي",
    netPayout:      "صافي المدفوعات",
    afterComm:      "بعد عمولة الوكالة",
    noPropTitle:    "لا توجد عقارات",
    noPropSub:      "لا توجد عقارات مسجلة باسمك.",
    addProp:        "+ إضافة عقار",
    myEarnings:     "إيرادات عقاراتي",
    showing:        "عرض",
    ownedBy:        "عقار(ات) تملكها",
    viewAll:        "عرض الكل",
    propName:       "اسم العقار",
    statusDate:     "الحالة / التاريخ",
    grossRev:       "الإيراد الإجمالي",
    commission:     "العمولة",
    netPayoutCol:   "صافي المدفوعات",
    loading:        "جارٍ تحميل لوحة التحكم...",
  },
} as const;

type Lang = "fr" | "ar";
interface Property {
  id: number;
  name: string;
  location: string;
  status: string;
  status_display: string;
  monthly_rent: string;
}

interface Financial {
  property: { id: number; name: string };
  month: number;
  month_display: string;
  year: number;
  revenue: string | number;
  expenses: string | number;
  commission: number | string;
  commission_rate?: string;
  net_profit: number | string;
}

interface UserType {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

const toNum = (v: string | number | undefined | null): number => {
  if (v === null || v === undefined || v === "") return 0;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return isFinite(n) ? n : 0;
};

export default function OwnerDashboardPage() {
  const router = useRouter();
  const [properties, setProperties]   = useState<Property[]>([]);
  const [financials, setFinancials]   = useState<Financial[]>([]);
  const [loading, setLoading]         = useState(true);
  const [user, setUser]               = useState<UserType | null>(null);
  const { lang } = useLang();

  const currentYear  = new Date().getFullYear();
  const currentMonth = new Date().toLocaleString("default", { month: "long" });

  const tx    = labels[lang];
  const isRTL = lang === "ar";

  useEffect(() => {
    const token   = localStorage.getItem("access");
    const userStr = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      if (userData.role !== "owner") { router.push("/unauthorized"); return; }
    } else {
      fetchUserData();
    }
  }, [router]);

  const fetchUserData = async () => {
    try {
      const res = await api.get("/api/users/profile/");
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch {
      router.push("/login");
    }
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    try {
      const propsRes  = await api.get("/api/properties/");
      const propsData: Property[] = Array.isArray(propsRes.data)
        ? propsRes.data
        : propsRes.data.results ?? [];
      setProperties(propsData);

      const allFinancials: Financial[] = [];
      for (const prop of propsData) {
        try {
          const finRes = await api.get(
            `/api/financials/summary/${prop.id}/?year=${currentYear}&month=${new Date().getMonth() + 1}`
          );
          const finData = Array.isArray(finRes.data) ? finRes.data : [];
          allFinancials.push(...finData);
        } catch {
          console.warn(`No financial data for property ${prop.id}`);
        }
      }
      setFinancials(allFinancials);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = financials.length > 0
    ? financials.reduce((sum, f) => sum + toNum(f.revenue), 0)
    : properties.reduce((sum, p) => sum + toNum(p.monthly_rent), 0);

  const totalPayout = financials.length > 0
    ? financials.reduce((sum, f) => sum + toNum(f.net_profit), 0)
    : properties.reduce((sum, p) => sum + toNum(p.monthly_rent) * 0.80, 0);

  const activeProperties = properties.filter(
    p => p.status === "available" || p.status === "rented"
  ).length;

  // commission rate displayed under the "net payout" card
  const firstFin = financials[0];
  const displayCommissionRate = firstFin?.commission_rate
    ? toNum(firstFin.commission_rate)
    : 20;

  // ── PDF ───────────────────────────────────────────────────────────────────
  const downloadPDFReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Financial Report - ${currentMonth} ${currentYear}`, 14, 22);
    if (user) {
      doc.setFontSize(10);
      doc.text(`Owner: ${user.first_name} ${user.last_name} (${user.email})`, 14, 30);
    }
    const tableData = financials.length > 0
      ? financials.map(f => [
          f.property.name,
          f.month_display,
          `${toNum(f.revenue).toLocaleString()} MAD`,
          `-${toNum(f.commission).toLocaleString()} MAD`,
          `${toNum(f.net_profit).toLocaleString()} MAD`,
        ])
      : properties.map(p => [
          p.name,
          "Current",
          `${toNum(p.monthly_rent).toLocaleString()} MAD`,
          `-${Math.round(toNum(p.monthly_rent) * 0.20).toLocaleString()} MAD`,
          `${Math.round(toNum(p.monthly_rent) * 0.80).toLocaleString()} MAD`,
        ]);
    autoTable(doc, {
      startY: 35,
      head: [["Property", "Period", "Gross Revenue", "Commission", "Net Payout"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [34, 197, 94] },
    });
    doc.save(`Owner_Report_${currentMonth}_${currentYear}.pdf`);
  };

  const contactSupport = () => {
    const phoneNumber = "212600000000";
    const message = encodeURIComponent(
      `Hello Makani Support, I am an owner (${user?.email}) and I have a question regarding my dashboard for ${currentMonth}.`
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case "available":   return { bg: "#f0fdf4", color: "#16a34a" };
      case "rented":      return { bg: "#fff7ed", color: "#ea580c" };
      case "maintenance": return { bg: "#fef2f2", color: "#ef4444" };
      default:            return { bg: "#f9fafb", color: "#6b7280" };
    }
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');

    .od {
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
      --f: ${isRTL ? "'Cairo'" : "'Geist'"}, system-ui, sans-serif;

      font-family: var(--f);
      direction: ${isRTL ? "rtl" : "ltr"};
      background:  var(--bg);
      min-height:  100vh;
      padding:     2rem;
      color:       var(--ink);
    }

    /* ── language toggle ── */
    .od-lang-bar {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 1rem;
    }
    .od-lang-toggle {
      display: flex;
      border: 1px solid var(--border-2);
      border-radius: 8px;
      overflow: hidden;
    }
    .od-lang-btn {
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 600;
      border: none;
      background: var(--surface);
      color: var(--ink-3);
      cursor: pointer;
      font-family: var(--f);
      transition: background 0.12s, color 0.12s;
    }
    .od-lang-btn.active {
      background: var(--green);
      color: #fff;
    }
    .od-lang-btn:not(.active):hover {
      background: var(--bg);
      color: var(--ink);
    }

    .od-banner {
      background: linear-gradient(to right, var(--green-bg), var(--surface));
      border: 1px solid rgba(34,197,94,0.15);
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 1.5rem;
    }
    .od-banner-label { font-size: 13px; color: var(--green-text); font-weight: 500; }
    .od-banner-name  { font-size: 20px; font-weight: 700; color: var(--ink); margin-top: 2px; }
    .od-banner-sub   { font-size: 12px; color: var(--ink-4); margin-top: 4px; }
    .od-banner-icon  {
      width: 48px; height: 48px; border-radius: 50%;
      background: var(--green-dim);
      display: flex; align-items: center; justify-content: center;
      color: var(--green-text);
    }

    .od-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .od-breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--ink-4); margin-bottom: 4px; }
    .od-breadcrumb-active { color: var(--ink-2); font-weight: 500; }
    .od-title { font-size: 22px; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; }

    .od-actions { display: flex; align-items: center; gap: 10px; }
    .od-btn-outline {
      display: flex; align-items: center; gap: 7px;
      padding: 9px 16px; border-radius: 10px;
      border: 1px solid var(--border-2);
      background: var(--surface); color: var(--ink-2);
      font-size: 13px; font-weight: 500; cursor: pointer;
      font-family: var(--f);
      transition: border-color 0.12s, color 0.12s;
    }
    .od-btn-outline:hover { border-color: var(--green); color: var(--green-text); }

    .od-btn-primary {
      display: flex; align-items: center; gap: 7px;
      padding: 9px 16px; border-radius: 10px;
      border: none; background: var(--green);
      color: #fff; font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: var(--f);
      transition: opacity 0.12s;
      box-shadow: 0 2px 8px rgba(34,197,94,0.25);
    }
    .od-btn-primary:hover    { opacity: 0.88; }
    .od-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

    .od-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.25rem; margin-bottom: 2rem; }
    .od-card {
      background: var(--surface);
      border: 1px solid var(--border-2);
      border-radius: 16px;
      padding: 1.5rem;
      display: flex; justify-content: space-between; align-items: flex-start;
    }
    .od-card-label { font-size: 13px; color: var(--ink-4); margin-bottom: 8px; }
    .od-card-value { font-size: 24px; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; }
    .od-card-value.green { color: var(--green-text); }
    .od-card-sub   { font-size: 11px; color: var(--ink-4); margin-top: 4px; }
    .od-card-icon  {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .od-empty {
      background: var(--surface);
      border: 1px solid var(--border-2);
      border-radius: 16px;
      padding: 4rem 2rem;
      text-align: center;
    }
    .od-empty-icon  { color: var(--border-2); margin: 0 auto 1rem; display: block; }
    .od-empty-title { font-size: 17px; font-weight: 600; color: var(--ink); margin-bottom: 6px; }
    .od-empty-sub   { font-size: 13px; color: var(--ink-4); margin-bottom: 1.25rem; }

    .od-table-card {
      background: var(--surface);
      border: 1px solid var(--border-2);
      border-radius: 16px;
      overflow: hidden;
    }
    .od-table-head {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border);
      display: flex; justify-content: space-between; align-items: center;
    }
    .od-table-title { font-size: 16px; font-weight: 700; color: var(--ink); }
    .od-table-sub   { font-size: 12px; color: var(--ink-4); margin-top: 2px; }
    .od-view-all    {
      font-size: 13px; font-weight: 600; color: var(--green-text);
      background: none; border: none; cursor: pointer; font-family: var(--f);
      text-decoration: none;
    }
    .od-view-all:hover { text-decoration: underline; }

    table { width: 100%; border-collapse: collapse; }
    thead tr { background: var(--bg); }
    thead th {
      padding: 12px 24px;
      font-size: 11px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--ink-4); text-align: ${isRTL ? "right" : "left"};
    }
    tbody tr { border-top: 1px solid var(--border); transition: background 0.1s; }
    tbody tr:hover { background: var(--bg); }
    tbody td { padding: 14px 24px; font-size: 13.5px; color: var(--ink-2); }
    .td-bold  { font-weight: 700; color: var(--ink); }
    .td-green { font-weight: 700; color: var(--green-text); }
    .td-muted { color: var(--ink-4); }

    .status-badge {
      display: inline-block;
      font-size: 11px; font-weight: 600;
      padding: 3px 9px; border-radius: 999px;
    }

    .od-loading {
      min-height: 100vh; display: flex;
      align-items: center; justify-content: center;
      flex-direction: column; gap: 12px;
      background: var(--bg); font-family: var(--f);
    }
    .od-spinner {
      width: 44px; height: 44px; border-radius: 50%;
      border: 3px solid var(--green-bg);
      border-top: 3px solid var(--green);
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .od-loading-text { font-size: 13px; color: var(--ink-4); }
  `;

  if (loading) {
    return (
      <>
        <style>{css}</style>
        <div className="od od-loading">
          <div className="od-spinner" />
          <span className="od-loading-text">{tx.loading}</span>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="od">

        {user && (
          <div className="od-banner">
            <div>
              <div className="od-banner-label">{tx.welcome}</div>
              <div className="od-banner-name">{user.first_name} {user.last_name}</div>
              <div className="od-banner-sub">
                {tx.ownerDash} • {properties.length} {properties.length === 1 ? tx.property : tx.properties}
              </div>
            </div>
            <div className="od-banner-icon">
              <User size={22} />
            </div>
          </div>
        )}

        <div className="od-header">
          <div>
            <div className="od-breadcrumb">
              <span>{tx.home}</span>
              <ChevronRight size={13} />
              <span className="od-breadcrumb-active">{tx.ownerDashTitle}</span>
            </div>
            <h1 className="od-title">{tx.overview}</h1>
          </div>
          <div className="od-actions">
            <button className="od-btn-outline" onClick={contactSupport}>
              <MessageCircle size={15} strokeWidth={1.8} />
              {tx.support}
            </button>
            <button
              className="od-btn-primary"
              onClick={downloadPDFReport}
              disabled={properties.length === 0}
            >
              <Download size={15} strokeWidth={2} />
              {tx.download} {currentMonth}
            </button>
          </div>
        </div>

        <div className="od-stats">

          <div className="od-card">
            <div>
              <div className="od-card-label">{tx.totalEarnings}</div>
              <div className="od-card-value">
                {Math.round(totalRevenue).toLocaleString()} MAD
              </div>
            </div>
            <div className="od-card-icon" style={{ background: "var(--green-dim)" }}>
              <DollarSign size={18} color="var(--green-text)" strokeWidth={2} />
            </div>
          </div>

          <div className="od-card">
            <div>
              <div className="od-card-label">{tx.propStatus}</div>
              <div className="od-card-value green">{activeProperties} {tx.active}</div>
              <div className="od-card-sub">{tx.outOf} {properties.length} {tx.total}</div>
            </div>
            <div className="od-card-icon" style={{ background: "var(--green-dim)" }}>
              <Home size={18} color="var(--green-text)" strokeWidth={2} />
            </div>
          </div>

          <div className="od-card">
            <div>
              <div className="od-card-label">{tx.netPayout}</div>
              <div className="od-card-value">
                {Math.round(totalPayout).toLocaleString()} MAD
              </div>
              <div className="od-card-sub">
                {tx.afterComm} ({displayCommissionRate}%)
              </div>
            </div>
            <div className="od-card-icon" style={{ background: "#eff6ff" }}>
              <Wallet size={18} color="#2563eb" strokeWidth={2} />
            </div>
          </div>

        </div>

        {/* ── Empty state ── */}
        {properties.length === 0 && (
          <div className="od-empty">
            <Home size={48} className="od-empty-icon" />
            <div className="od-empty-title">{tx.noPropTitle}</div>
            <div className="od-empty-sub">{tx.noPropSub}</div>
            <button
              className="od-btn-primary"
              style={{ margin: "0 auto" }}
              onClick={() => router.push("/owner/add-property")}
            >
              {tx.addProp}
            </button>
          </div>
        )}

        {/* ── Earnings Table ── */}
        {properties.length > 0 && (
          <div className="od-table-card">
            <div className="od-table-head">
              <div>
                <div className="od-table-title">{tx.myEarnings}</div>
                <div className="od-table-sub">
                  {tx.showing} {properties.length} {tx.ownedBy}
                </div>
              </div>
              <button className="od-view-all" onClick={() => router.push("/owner/earnings")}>
                {tx.viewAll}
              </button>
            </div>

            <table>
              <thead>
                <tr>
                  <th>{tx.propName}</th>
                  <th>{tx.statusDate}</th>
                  <th>{tx.grossRev}</th>
                  <th>{tx.commission} ({displayCommissionRate}%)</th>
                  <th>{tx.netPayoutCol}</th>
                </tr>
              </thead>
              <tbody>
                {financials.length > 0
                  ? financials.map((f, i) => (
                    <tr key={i}>
                      <td className="td-bold">{f.property.name}</td>
                      <td className="td-muted">{f.month_display} {f.year}</td>
                      <td style={{ fontWeight: 600 }}>
                        {toNum(f.revenue).toLocaleString()} MAD
                      </td>
                      <td className="td-muted">
                        -{toNum(f.commission).toLocaleString()} MAD
                      </td>
                      <td className="td-green">
                        {toNum(f.net_profit).toLocaleString()} MAD
                      </td>
                    </tr>
                  ))
                  : properties.map((p) => {
                    const s   = statusStyle(p.status);
                    const rent = toNum(p.monthly_rent);
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="td-bold">{p.name}</div>
                          <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 2 }}>
                            {p.location}
                          </div>
                        </td>
                        <td>
                          <span
                            className="status-badge"
                            style={{ background: s.bg, color: s.color }}
                          >
                            {p.status_display}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {rent.toLocaleString()} MAD
                        </td>
                        <td className="td-muted">
                          -{Math.round(rent * 0.20).toLocaleString()} MAD
                        </td>
                        <td className="td-green">
                          {Math.round(rent * 0.80).toLocaleString()} MAD
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        )}

      </div>
    </>
  );
}