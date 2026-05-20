"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
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
  ChevronLeft,
  ChevronRight,
  X,
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
    noResults:  "Aucun résultat trouvé",
    searchPlaceholder: "Rechercher dans le menu...",
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
    noResults:  "لم يتم العثور على نتائج",
    searchPlaceholder: "البحث في القائمة...",
  },
} as const;

type Lang = "fr" | "ar";

interface SidebarProps {
  lang?: Lang;
  onCollapseChange?: (collapsed: boolean) => void;
}

export default function Sidebar({ lang = "fr", onCollapseChange }: SidebarProps) {
  const pathname = usePathname();
  const tx = labels[lang];
  const isRTL = lang === "ar";
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const mainNav = [
    { key: "home",     icon: Home,      href: "/dashboard", label: tx.home },
    { key: "property", icon: Building2, href: "/dashboard/properties", label: tx.property },
    { key: "owners",   icon: Users,     href: "/dashboard/owners", label: tx.owners },
    { key: "staff",    icon: UserCheck, href: "/dashboard/staff", label: tx.staff },
    { key: "revenue",  icon: DollarSign,href: "/dashboard/revenue", label: tx.revenue },
    { key: "expenses", icon: TrendingUp,href: "/dashboard/expenses", label: tx.expenses },
    { key: "analysis", icon: BarChart2, href: "/dashboard/analysis", label: tx.analysis },
    { key: "reports",  icon: FileText,  href: "/dashboard/reports", label: tx.reports },
  ] as const;

  const bottomNav = [
    { key: "security", icon: Shield,      href: "/dashboard/security", label: tx.security },
    { key: "help",     icon: HelpCircle,  href: "/dashboard/help", label: tx.help },
    { key: "settings", icon: Settings,    href: "/dashboard/settings", label: tx.settings },
  ] as const;

  const filteredMainNav = mainNav.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBottomNav = bottomNav.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const active = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const handleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onCollapseChange?.(newState);
  };

  // Handle keyboard shortcut (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery("");
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');

        .sb {
          --green:        #19c157;
          --green-bg:     #f0fdf4;
          --green-text:   #108e3e;
          --ink:          #111827;
          --ink-2:        #374151;
          --ink-3:        #9ca3af;
          --ink-4:        #d1d5db;
          --border:       #f3f4f6;
          --border-2:     #e5e7eb;
          --bg:           #f9fafb;
          --surface:      #ffffff;
          --f:            ${isRTL ? "'Cairo'" : "'Geist'"}, system-ui, sans-serif;
          --sidebar-width: 240px;
          --sidebar-collapsed-width: 72px;

          font-family: var(--f);
          direction: ${isRTL ? "rtl" : "ltr"};
          width: ${isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)'};
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
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* ── Logo ── */
        .sb-logo {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: ${isCollapsed ? '0 1rem' : '0 1.25rem'};
          height: 64px;
          flex-shrink: 0;
          border-bottom: 1px solid var(--border);
          ${isCollapsed ? 'justify-content: center;' : ''}
        }

        .sb-logo-inner {
          display: flex;
          align-items: center;
          gap: 9px;
          ${isRTL ? "flex-direction: row-reverse" : ""};
          ${isCollapsed ? 'justify-content: center;' : ''}
        }

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
          white-space: nowrap;
          opacity: ${isCollapsed ? 0 : 1};
          width: ${isCollapsed ? 0 : 'auto'};
          overflow: hidden;
          transition: opacity 0.2s ease, width 0.2s ease;
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
          flex-shrink: 0;
          ${isCollapsed ? 'transform: rotate(180deg);' : ''}
        }
        .sb-logo-toggle:hover { background: var(--bg); }

        /* ── Search ── */
        .sb-search {
          padding: 0.875rem 1rem;
          flex-shrink: 0;
          ${isCollapsed ? 'padding: 0.875rem 0.5rem;' : ''}
        }

        .sb-search-inner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: ${isSearchFocused || searchQuery ? 'var(--surface)' : 'var(--bg)'};
          border: 1px solid ${isSearchFocused || searchQuery ? 'var(--green)' : 'var(--border-2)'};
          border-radius: 8px;
          padding: 7.5px 11px;
          transition: all 0.2s ease;
          ${isRTL ? "flex-direction: row-reverse" : ""};
          ${isCollapsed ? 'justify-content: center; padding: 7.5px;' : ''}
        }
        .sb-search-inner:hover { border-color: var(--green); }

        .sb-search-input {
          flex: 1;
          font-size: 13px;
          color: var(--ink);
          font-family: var(--f);
          background: transparent;
          border: none;
          outline: none;
          ${isRTL ? "text-align: right" : ""};
          white-space: nowrap;
          opacity: ${isCollapsed ? 0 : 1};
          width: ${isCollapsed ? 0 : '100%'};
          overflow: hidden;
          transition: opacity 0.2s ease, width 0.2s ease;
        }

        .sb-search-input::placeholder {
          color: var(--ink-3);
        }

        .sb-search-icon {
          flex-shrink: 0;
          color: var(--ink-3);
        }

        .sb-search-clear {
          flex-shrink: 0;
          cursor: pointer;
          color: var(--ink-3);
          opacity: ${searchQuery ? 1 : 0};
          pointer-events: ${searchQuery ? 'auto' : 'none'};
          transition: opacity 0.2s ease;
          background: none;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }

        .sb-search-clear:hover {
          color: var(--ink);
        }

        .sb-search-kbd {
          font-size: 11px;
          color: var(--ink-4);
          background: var(--surface);
          border: 1px solid var(--border-2);
          border-radius: 4px;
          padding: 1px 5px;
          font-family: var(--f);
          white-space: nowrap;
          opacity: ${isCollapsed || isSearchFocused || searchQuery ? 0 : 1};
          width: ${isCollapsed || isSearchFocused || searchQuery ? 0 : 'auto'};
          overflow: hidden;
          transition: opacity 0.2s ease, width 0.2s ease;
        }

        /* ── Section label ── */
        .sb-label {
          padding: ${isCollapsed ? '0' : '0 1.125rem 0.375rem'};
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--ink-4);
          ${isRTL ? "text-align: right" : ""};
          opacity: ${isCollapsed ? 0 : 1};
          height: ${isCollapsed ? 0 : 'auto'};
          overflow: hidden;
          transition: opacity 0.2s ease, padding 0.2s ease;
        }

        /* ── Nav ── */
        .sb-nav {
          flex: 1;
          overflow-y: auto;
          padding: ${isCollapsed ? '0 0.5rem' : '0 0.75rem'};
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
          ${isCollapsed ? 'justify-content: center;' : ''}
        }

        .sb-item-text {
          white-space: nowrap;
          opacity: ${isCollapsed ? 0 : 1};
          width: ${isCollapsed ? 0 : 'auto'};
          overflow: hidden;
          transition: opacity 0.2s ease, width 0.2s ease;
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
          margin: ${isCollapsed ? '0.5rem 0.5rem' : '0.5rem 0.75rem'};
          flex-shrink: 0;
          opacity: ${isCollapsed ? 0.5 : 1};
        }

        /* ── Bottom nav ── */
        .sb-bottom {
          padding: ${isCollapsed ? '0 0.5rem 0.875rem' : '0 0.75rem 0.875rem'};
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex-shrink: 0;
        }

        /* ── No results ── */
        .sb-no-results {
          text-align: center;
          padding: 2rem 1rem;
          color: var(--ink-3);
          font-size: 13px;
        }

        /* Tooltip for collapsed mode */
        .sb-item[data-tooltip]:hover::after {
          content: attr(data-tooltip);
          position: fixed;
          ${isRTL ? 'right: 80px' : 'left: 80px'};
          background: var(--ink);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          z-index: 50;
          pointer-events: none;
        }
      `}</style>

      <aside className="sb">

        {/* Logo */}
        <div className="sb-logo">
          <div className="sb-logo-inner">
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
          <button className="sb-logo-toggle" onClick={handleCollapse} aria-label="Toggle sidebar">
            {isRTL ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Search */}
        <div className="sb-search">
          <div className="sb-search-inner">
            <Search size={13} className="sb-search-icon" strokeWidth={1.8} />
            <input
              ref={searchInputRef}
              type="text"
              className="sb-search-input"
              placeholder={tx.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            {searchQuery && (
              <button
                className="sb-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
            <span className="sb-search-kbd">{tx.kbd}</span>
          </div>
        </div>

        {/* Main nav */}
        {!searchQuery && !isCollapsed && <div className="sb-label">{tx.main}</div>}
        <nav className="sb-nav">
          {(searchQuery ? filteredMainNav : mainNav).length > 0 ? (
            (searchQuery ? filteredMainNav : mainNav).map(({ key, icon: Icon, href, label }) => (
              <Link
                key={href}
                href={href}
                className={`sb-item${active(href) ? " sb-active" : ""}`}
                data-tooltip={isCollapsed ? label : undefined}
                onClick={() => setSearchQuery("")}
              >
                <Icon size={16} strokeWidth={active(href) ? 2.2 : 1.8} />
                <span className="sb-item-text">{label}</span>
              </Link>
            ))
          ) : (
            <div className="sb-no-results">{tx.noResults}</div>
          )}
        </nav>

        {/* Bottom nav - only show if no search query */}
        {!searchQuery && (
          <>
            <div className="sb-divider" />
            <div className="sb-bottom">
              {filteredBottomNav.map(({ key, icon: Icon, href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`sb-item${active(href) ? " sb-active" : ""}`}
                  data-tooltip={isCollapsed ? label : undefined}
                >
                  <Icon size={16} strokeWidth={1.8} />
                  <span className="sb-item-text">{label}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </aside>
    </>
  );
}