"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  DollarSign,
  TrendingUp,
  CreditCard,
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

const labels = {
  fr: {
    search: "Rechercher",
    main: "PRINCIPAL",
    dashboard: "Tableau de bord",
    revenue: "Revenus",
    expenses: "Dépenses",
    payments: "Paiements",
    settings: "Paramètres",
    logout: "Déconnexion",
    kbd: "⌘K",
    noResults: "Aucun résultat trouvé",
  },
  ar: {
    search: "بحث",
    main: "الرئيسية",
    dashboard: "لوحة التحكم",
    revenue: "الإيرادات",
    expenses: "المصاريف",
    payments: "المدفوعات",
    reports: "التقارير",
    settings: "الإعدادات",
    logout: "تسجيل الخروج",
    kbd: "⌘K",
    noResults: "لم يتم العثور على نتائج",
  },
} as const;

type Lang = "fr" | "ar";

function FinanceStaffLayoutInner({ children }: { children: React.ReactNode }) {
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
    if (!token || role !== "finance_staff") {
      router.push("/login");
      return;
    }
    setLoading(false);
  }, [router]);

  const mainNav = [
    { key: "dashboard", icon: LayoutDashboard, href: "/staff/finance-staff", label: tx.dashboard },
    { key: "revenue", icon: DollarSign, href: "/staff/finance-staff/revenue", label: tx.revenue },
    { key: "expenses", icon: TrendingUp, href: "/staff/finance-staff/expenses", label: tx.expenses },
    { key: "payments", icon: CreditCard, href: "/staff/finance-staff/payments", label: tx.payments },
  ] as const;

  const bottomNav = [
    { key: "settings", icon: Settings, href: "/staff/finance-staff/settings", label: tx.settings },
  ] as const;

  const filteredMainNav = mainNav.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBottomNav = bottomNav.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const active = (href: string) => {
    if (href === "/staff/finance-staff") return pathname === href;
    return pathname.startsWith(href);
  };

  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

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
        .sb-fs {
          --green: #22c55e;
          --green-bg: #f0fdf4;
          --green-text: #16a34a;
          --ink: #111827;
          --ink-2: #374151;
          --ink-3: #9ca3af;
          --ink-4: #d1d5db;
          --border: #f3f4f6;
          --border-2: #e5e7eb;
          --bg: #f9fafb;
          --surface: #ffffff;
          --sidebar-width: 240px;
          --sidebar-collapsed-width: 72px;

          width: ${isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)'};
          height: 100vh;
          background: var(--surface);
          border-right: 1px solid var(--border-2);
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 40;
          overflow: hidden;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sb-fs-logo {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: ${isCollapsed ? '0 1rem' : '0 1.25rem'};
          height: 64px;
          border-bottom: 1px solid var(--border);
        }

        .sb-fs-logo-inner {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .sb-fs-logo-name {
          font-size: 17px;
          font-weight: 700;
          color: var(--ink);
          opacity: ${isCollapsed ? 0 : 1};
          transition: opacity 0.2s;
        }

        .sb-fs-logo-toggle {
          width: 26px;
          height: 26px;
          border: 1px solid var(--border-2);
          border-radius: 6px;
          background: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--ink-3);
        }

        .sb-fs-search {
          padding: 0.875rem 1rem;
        }

        .sb-fs-search-inner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: ${isSearchFocused || searchQuery ? 'var(--surface)' : 'var(--bg)'};
          border: 1px solid ${isSearchFocused || searchQuery ? 'var(--green)' : 'var(--border-2)'};
          border-radius: 8px;
          padding: 7.5px 11px;
        }

        .sb-fs-search-input {
          flex: 1;
          font-size: 13px;
          background: transparent;
          border: none;
          outline: none;
          opacity: ${isCollapsed ? 0 : 1};
        }

        .sb-fs-nav {
          flex: 1;
          overflow-y: auto;
          padding: ${isCollapsed ? '0 0.5rem' : '0 0.75rem'};
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sb-fs-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 8px;
          font-size: 13.5px;
          color: var(--ink-3);
          text-decoration: none;
          transition: all 0.12s;
        }

        .sb-fs-item.sb-fs-active {
          background: var(--green-bg);
          color: var(--green-text);
          font-weight: 500;
        }

        .sb-fs-item:hover:not(.sb-fs-active) {
          background: var(--bg);
          color: var(--ink-2);
        }

        .sb-fs-item-text {
          white-space: nowrap;
          opacity: ${isCollapsed ? 0 : 1};
          transition: opacity 0.2s;
        }

        .sb-fs-divider {
          height: 1px;
          background: var(--border);
          margin: 0.5rem 0.75rem;
        }

        .sb-fs-bottom {
          padding: ${isCollapsed ? '0 0.5rem 0.875rem' : '0 0.75rem 0.875rem'};
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sb-fs-main {
          flex: 1;
          margin-left: ${isCollapsed ? '72px' : '240px'};
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: margin 0.3s;
        }
      `}</style>

      <div style={{ display: "flex", height: "100vh", background: "#f9fafb", overflow: "hidden" }}>
        <aside className="sb-fs">
          <div className="sb-fs-logo">
            <div className="sb-fs-logo-inner">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#f0fdf4"/>
                <path d="M19 8L11 17h6l-2 7 8-10h-6l3-7z" fill="#22c55e"/>
              </svg>
              <span className="sb-fs-logo-name">Makani</span>
            </div>
            <button className="sb-fs-logo-toggle" onClick={handleCollapse}>
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>

          <div className="sb-fs-search">
            <div className="sb-fs-search-inner">
              <Search size={13} />
              <input
                ref={searchInputRef}
                type="text"
                className="sb-fs-search-input"
                placeholder={tx.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X size={12} />
                </button>
              )}
              <span className="sb-fs-search-kbd">{tx.kbd}</span>
            </div>
          </div>

          <nav className="sb-fs-nav">
            {(searchQuery ? filteredMainNav : mainNav).map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href} className={`sb-fs-item${active(href) ? " sb-fs-active" : ""}`}>
                <Icon size={16} />
                <span className="sb-fs-item-text">{label}</span>
              </Link>
            ))}
          </nav>

          {!searchQuery && (
            <>
              <div className="sb-fs-divider" />
              <div className="sb-fs-bottom">
                {filteredBottomNav.map(({ href, icon: Icon, label }) => (
                  <Link key={href} href={href} className={`sb-fs-item${active(href) ? " sb-fs-active" : ""}`}>
                    <Icon size={16} />
                    <span className="sb-fs-item-text">{label}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </aside>

        <div className="sb-fs-main">
          <Navbar lang={lang} />
          <main style={{ flex: 1, overflow: "auto", padding: "1.5rem" }}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

export default function FinanceStaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <FinanceStaffLayoutInner>{children}</FinanceStaffLayoutInner>
    </LanguageProvider>
  );
}