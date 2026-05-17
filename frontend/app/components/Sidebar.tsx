"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Building2,
  Users,
  UserCheck,
  DollarSign,
  TrendingUp,
  BarChart2,
  FileText,
  Shield,
  HelpCircle,
  Settings,
  Search,
} from "lucide-react";

// ── i18n ──────────────────────────────────────────────────────
const labels = {
  fr: {
    search:     "Rechercher",
    main:       "MAIN",
    home:       "Accueil",
    property:   "Propriétés",
    owners:     "Propriétaires",
    staff:      "Staff",
    revenue:    "Revenus",
    expenses:   "Dépenses",
    analysis:   "Analyse",
    reports:    "Rapports",
    security:   "Sécurité",
    help:       "Centre d'aide",
    settings:   "Paramètres",
    tagline:    "Gestion locative",
    kbd:        "⌘K",
  },
  ar: {
    search:     "بحث",
    main:       "الرئيسية",
    home:       "الرئيسية",
    property:   "العقارات",
    owners:     "الملاك",
    staff:      "الموظفون",
    revenue:    "الإيرادات",
    expenses:   "المصاريف",
    analysis:   "التحليل",
    reports:    "التقارير",
    security:   "الأمان",
    help:       "مركز المساعدة",
    settings:   "الإعدادات",
    tagline:    "إدارة الإيجارات",
    kbd:        "⌘K",
  },
} as const;

type Lang = "fr" | "ar";

interface SidebarProps {
  lang?: Lang;
}

export default function Sidebar({ lang = "fr" }: SidebarProps) {
  const pathname = usePathname();
  const tx = labels[lang];
  const isRTL = lang === "ar";

  const mainNav = [
    { key: "home",     icon: Home,      href: "/dashboard" },
    { key: "property", icon: Building2, href: "/dashboard/properties" },
    { key: "owners",   icon: Users,     href: "/dashboard/owners" },
    { key: "staff",    icon: UserCheck, href: "/dashboard/staff" },
    { key: "revenue",  icon: DollarSign,href: "/dashboard/revenue" },
    { key: "expenses", icon: TrendingUp,href: "/dashboard/expenses" },
    { key: "analysis", icon: BarChart2, href: "/dashboard/analysis" },
    { key: "reports",  icon: FileText,  href: "/dashboard/reports" },
  ] as const;

  const bottomNav = [
    { key: "security", icon: Shield,      href: "/dashboard/security" },
    { key: "help",     icon: HelpCircle,  href: "/dashboard/help" },
    { key: "settings", icon: Settings,    href: "/dashboard/settings" },
  ] as const;

  const active = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');

        .sb {
          --green:        #22c55e;
          --green-bg:     #f0fdf4;
          --green-text:   #16a34a;
          --ink:          #111827;
          --ink-2:        #374151;
          --ink-3:        #9ca3af;
          --ink-4:        #d1d5db;
          --border:       #f3f4f6;
          --border-2:     #e5e7eb;
          --bg:           #f9fafb;
          --surface:      #ffffff;
          --f:            ${isRTL ? "'Cairo'" : "'Geist'"}, system-ui, sans-serif;

          font-family: var(--f);
          direction: ${isRTL ? "rtl" : "ltr"};
          width: 240px;
          height: 100vh;
          background: var(--surface);
          border-${isRTL ? "left" : "right"}: 1px solid var(--border-2);
          display: flex;
          flex-direction: column;
          position: fixed;
          ${isRTL ? "right: 0" : "left: 0"};
          top: 0;
          z-index: 40;
          overflow: hidden;
        }

        /* ── Logo ── */
        .sb-logo {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.25rem;
          height: 64px;
          flex-shrink: 0;
          border-bottom: 1px solid var(--border);
        }

        .sb-logo-inner {
          display: flex;
          align-items: center;
          gap: 9px;
          ${isRTL ? "flex-direction: row-reverse" : ""};
        }

        /* The green lightning / chevron mark from the image */
        .sb-logo-mark {
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .sb-logo-name {
          font-size: 17px;
          font-weight: 700;
          color: var(--ink);
          letter-spacing: -0.02em;
        }

        .sb-logo-toggle {
          width: 26px; height: 26px;
          border: 1px solid var(--border-2);
          border-radius: 6px;
          background: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: var(--ink-3);
          transition: background 0.12s;
        }
        .sb-logo-toggle:hover { background: var(--bg); }

        /* ── Search ── */
        .sb-search {
          padding: 0.875rem 1rem;
          flex-shrink: 0;
        }

        .sb-search-inner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg);
          border: 1px solid var(--border-2);
          border-radius: 8px;
          padding: 7.5px 11px;
          cursor: pointer;
          transition: border-color 0.15s;
          ${isRTL ? "flex-direction: row-reverse" : ""};
        }
        .sb-search-inner:hover { border-color: var(--ink-4); }

        .sb-search-text {
          flex: 1;
          font-size: 13px;
          color: var(--ink-3);
          font-family: var(--f);
          ${isRTL ? "text-align: right" : ""};
        }

        .sb-search-kbd {
          font-size: 11px;
          color: var(--ink-4);
          background: var(--surface);
          border: 1px solid var(--border-2);
          border-radius: 4px;
          padding: 1px 5px;
          font-family: var(--f);
        }

        /* ── Section label ── */
        .sb-label {
          padding: 0 1.125rem 0.375rem;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--ink-4);
          ${isRTL ? "text-align: right" : ""};
        }

        /* ── Nav ── */
        .sb-nav {
          flex: 1;
          overflow-y: auto;
          padding: 0 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .sb-nav::-webkit-scrollbar { display: none; }

        .sb-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 400;
          color: var(--ink-3);
          text-decoration: none;
          cursor: pointer;
          border: none;
          background: none;
          font-family: var(--f);
          width: 100%;
          transition: background 0.12s, color 0.12s;
          ${isRTL ? "flex-direction: row-reverse; text-align: right" : ""};
        }

        .sb-item:hover:not(.sb-active) {
          background: var(--bg);
          color: var(--ink-2);
        }

        .sb-item.sb-active {
          background: var(--green-bg);
          color: var(--green-text);
          font-weight: 500;
        }

        /* ── Divider ── */
        .sb-divider {
          height: 1px;
          background: var(--border);
          margin: 0.5rem 0.75rem;
          flex-shrink: 0;
        }

        /* ── Bottom nav ── */
        .sb-bottom {
          padding: 0 0.75rem 0.875rem;
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex-shrink: 0;
        }
      `}</style>

      <aside className="sb">

        {/* Logo */}
        <div className="sb-logo">
          <div className="sb-logo-inner">
            {/* Green lightning mark — matches the image */}
            <div className="sb-logo-mark">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="#f0fdf4"/>
                <path
                  d="M19 8L11 17h6l-2 7 8-10h-6l3-7z"
                  fill="#22c55e"
                  stroke="#22c55e"
                  strokeWidth="0.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="sb-logo-name">Makani</span>
          </div>
          <button className="sb-logo-toggle" aria-label="Toggle sidebar">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M2 8h8M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="sb-search">
          <div className="sb-search-inner">
            <Search size={13} color="var(--ink-3)" strokeWidth={1.8} />
            <span className="sb-search-text">{tx.search}</span>
            <span className="sb-search-kbd">{tx.kbd}</span>
          </div>
        </div>

        {/* Main nav */}
        <div className="sb-label">{tx.main}</div>
        <nav className="sb-nav">
          {mainNav.map(({ key, icon: Icon, href }) => (
            <Link
              key={href}
              href={href}
              className={`sb-item${active(href) ? " sb-active" : ""}`}
            >
              <Icon size={16} strokeWidth={active(href) ? 2.2 : 1.8} />
              {tx[key as keyof typeof tx]}
            </Link>
          ))}
        </nav>

        {/* Bottom nav */}
        <div className="sb-divider" />
        <div className="sb-bottom">
          {bottomNav.map(({ key, icon: Icon, href }) => (
            <Link
              key={href}
              href={href}
              className={`sb-item${active(href) ? " sb-active" : ""}`}
            >
              <Icon size={16} strokeWidth={1.8} />
              {tx[key as keyof typeof tx]}
            </Link>
          ))}
        </div>

      </aside>
    </>
  );
}