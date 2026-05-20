// frontend/app/owner/layout.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Home,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import Navbar from "@/app/components/Navbar";
import { LanguageProvider, useLang } from "@/app/components/contexts/LanguageContext";

// ── i18n ──────────────────────────────────────────────────────
const labels = {
  fr: {
    search: "Rechercher",
    main: "PRINCIPAL",
    dashboard: "Tableau de bord",
    properties: "Mes Propriétés",
    earnings: "Revenus",
    reports: "Rapports",
    settings: "Paramètres",
    logout: "Déconnexion",
    kbd: "⌘K",
    noResults: "Aucun résultat trouvé",
    searchPlaceholder: "Rechercher dans le menu...",
  },
  ar: {
    search: "بحث",
    main: "الرئيسية",
    dashboard: "لوحة التحكم",
    properties: "عقاراتي",
    earnings: "الإيرادات",
    reports: "التقارير",
    settings: "الإعدادات",
    logout: "تسجيل الخروج",
    kbd: "⌘K",
    noResults: "لم يتم العثور على نتائج",
    searchPlaceholder: "البحث في القائمة...",
  },
} as const;

type Lang = "fr" | "ar";

function OwnerLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { lang } = useLang();
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isRTL = lang === "ar";
  const tx = labels[lang as keyof typeof labels] || labels.fr;

  useEffect(() => {
    const token = localStorage.getItem("access");
    const role = localStorage.getItem("role");
    if (!token || role !== "owner") {
      router.push("/login");
      return;
    }
    setLoading(false);
  }, [router]);

  const mainNav = [
    { key: "dashboard", icon: LayoutDashboard, href: "/owner", label: tx.dashboard },
    { key: "properties", icon: Home, href: "/owner/properties", label: tx.properties },
    { key: "earnings", icon: DollarSign, href: "/owner/earnings", label: tx.earnings },
    { key: "reports", icon: FileText, href: "/owner/reports", label: tx.reports },
  ] as const;

  const bottomNav = [
    { key: "settings", icon: Settings, href: "/owner/settings", label: tx.settings },
  ] as const;

  const filteredMainNav = mainNav.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBottomNav = bottomNav.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const active = (href: string) =>
    href === "/owner" ? pathname === href : pathname.startsWith(href);

  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed);
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

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #f0fdf4", borderTop: "3px solid #22c55e", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');

        .sb-owner {
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
        .sb-owner-logo {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: ${isCollapsed ? '0 1rem' : '0 1.25rem'};
          height: 64px;
          flex-shrink: 0;
          border-bottom: 1px solid var(--border);
          ${isCollapsed ? 'justify-content: center;' : ''}
        }

        .sb-owner-logo-inner {
          display: flex;
          align-items: center;
          gap: 9px;
          ${isRTL ? "flex-direction: row-reverse" : ""};
          ${isCollapsed ? 'justify-content: center;' : ''}
        }

        .sb-owner-logo-mark {
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .sb-owner-logo-name {
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

        .sb-owner-logo-toggle {
          width: 26px; height: 26px;
          border: 1px solid var(--border-2);
          border-radius: 6px;
          background: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: var(--ink-3);
          transition: background 0.12s;
          flex-shrink: 0;
        }
        .sb-owner-logo-toggle:hover { background: var(--bg); }

        /* ── Search ── */
        .sb-owner-search {
          padding: 0.875rem 1rem;
          flex-shrink: 0;
          ${isCollapsed ? 'padding: 0.875rem 0.5rem;' : ''}
        }

        .sb-owner-search-inner {
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
        .sb-owner-search-inner:hover { border-color: var(--green); }

        .sb-owner-search-input {
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

        .sb-owner-search-input::placeholder {
          color: var(--ink-3);
        }

        .sb-owner-search-icon {
          flex-shrink: 0;
          color: var(--ink-3);
        }

        .sb-owner-search-clear {
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

        .sb-owner-search-clear:hover {
          color: var(--ink);
        }

        .sb-owner-search-kbd {
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
        .sb-owner-label {
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
        .sb-owner-nav {
          flex: 1;
          overflow-y: auto;
          padding: ${isCollapsed ? '0 0.5rem' : '0 0.75rem'};
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .sb-owner-nav::-webkit-scrollbar { display: none; }

        .sb-owner-item {
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

        .sb-owner-item-text {
          white-space: nowrap;
          opacity: ${isCollapsed ? 0 : 1};
          width: ${isCollapsed ? 0 : 'auto'};
          overflow: hidden;
          transition: opacity 0.2s ease, width 0.2s ease;
        }

        .sb-owner-item:hover:not(.sb-owner-active) {
          background: var(--bg);
          color: var(--ink-2);
        }

        .sb-owner-item.sb-owner-active {
          background: var(--green-bg);
          color: var(--green-text);
          font-weight: 500;
        }

        /* ── Divider ── */
        .sb-owner-divider {
          height: 1px;
          background: var(--border);
          margin: ${isCollapsed ? '0.5rem 0.5rem' : '0.5rem 0.75rem'};
          flex-shrink: 0;
          opacity: ${isCollapsed ? 0.5 : 1};
        }

        /* ── Bottom nav ── */
        .sb-owner-bottom {
          padding: ${isCollapsed ? '0 0.5rem 0.875rem' : '0 0.75rem 0.875rem'};
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex-shrink: 0;
        }

        /* ── No results ── */
        .sb-owner-no-results {
          text-align: center;
          padding: 2rem 1rem;
          color: var(--ink-3);
          font-size: 13px;
        }

        /* Main content area */
        .sb-owner-main {
          flex: 1;
          margin-${isRTL ? "right" : "left"}: ${isCollapsed ? '72px' : '240px'};
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: margin 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      <div style={{ display: "flex", height: "100vh", background: "#f9fafb", overflow: "hidden" }}>
        {/* Sidebar */}
        <aside className="sb-owner">
          {/* Logo */}
          <div className="sb-owner-logo">
            <div className="sb-owner-logo-inner">
              <div className="sb-owner-logo-mark">
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
              <span className="sb-owner-logo-name">Makani</span>
            </div>
            <button className="sb-owner-logo-toggle" onClick={handleCollapse} aria-label="Toggle sidebar">
              {isRTL ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>

          {/* Search */}
          <div className="sb-owner-search">
            <div className="sb-owner-search-inner">
              <Search size={13} className="sb-owner-search-icon" strokeWidth={1.8} />
              <input
                ref={searchInputRef}
                type="text"
                className="sb-owner-search-input"
                placeholder={tx.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              {searchQuery && (
                <button
                  className="sb-owner-search-clear"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
              <span className="sb-owner-search-kbd">{tx.kbd}</span>
            </div>
          </div>

          {/* Main nav */}
          {!searchQuery && !isCollapsed && <div className="sb-owner-label">{tx.main}</div>}
          <nav className="sb-owner-nav">
            {(searchQuery ? filteredMainNav : mainNav).length > 0 ? (
              (searchQuery ? filteredMainNav : mainNav).map(({ key, icon: Icon, href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`sb-owner-item${active(href) ? " sb-owner-active" : ""}`}
                  onClick={() => setSearchQuery("")}
                >
                  <Icon size={16} strokeWidth={active(href) ? 2.2 : 1.8} />
                  <span className="sb-owner-item-text">{label}</span>
                </Link>
              ))
            ) : (
              <div className="sb-owner-no-results">{tx.noResults}</div>
            )}
          </nav>

          {/* Bottom nav - only show if no search query */}
          {!searchQuery && (
            <>
              <div className="sb-owner-divider" />
              <div className="sb-owner-bottom">
                {filteredBottomNav.map(({ key, icon: Icon, href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`sb-owner-item${active(href) ? " sb-owner-active" : ""}`}
                  >
                    <Icon size={16} strokeWidth={1.8} />
                    <span className="sb-owner-item-text">{label}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </aside>

        {/* Main Content */}
        <div className="sb-owner-main">
          <Navbar lang={lang} />
          <main style={{ flex: 1, overflow: "auto", padding: "1.5rem" }}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <OwnerLayoutInner>{children}</OwnerLayoutInner>
    </LanguageProvider>
  );
}