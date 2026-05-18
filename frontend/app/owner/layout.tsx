"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Home, DollarSign, FileText, LogOut, Search } from "lucide-react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";

// ── i18n ──────────────────────────────────────────────────────
const labels = {
  fr: {
    search:     "Rechercher propriétés, rapports...",
    main:       "PRINCIPAL",
    dashboard:  "Tableau de bord",
    properties: "Mes Propriétés",
    earnings:   "Revenus",
    reports:    "Rapports",
    logout:     "Se déconnecter",
  },
  ar: {
    search:     "بحث في العقارات والتقارير...",
    main:       "الرئيسية",
    dashboard:  "لوحة التحكم",
    properties: "عقاراتي",
    earnings:   "الإيرادات",
    reports:    "التقارير",
    logout:     "تسجيل الخروج",
  },
} as const;

// Page titles — passed to Navbar
const ownerPages = {
  fr: {
    "/owner":            { title: "Tableau de bord",  sub: "Aperçu complet de vos propriétés." },
    "/owner/properties": { title: "Mes Propriétés",   sub: "Gérez et suivez votre portefeuille." },
    "/owner/earnings":   { title: "Revenus",           sub: "Suivez vos gains et commissions." },
    "/owner/reports":    { title: "Rapports",          sub: "Consultez vos rapports financiers." },
    "/owner/settings":   { title: "Paramètres",        sub: "Configurez votre espace." },
    "/owner/profile":    { title: "Mon profil",        sub: "Gérez vos informations personnelles." },
  } as Record<string, { title: string; sub: string }>,
  ar: {
    "/owner":            { title: "لوحة التحكم",  sub: "نظرة شاملة على عقاراتك." },
    "/owner/properties": { title: "عقاراتي",      sub: "تتبع وإدارة محفظتك العقارية." },
    "/owner/earnings":   { title: "الإيرادات",    sub: "تتبع أرباحك وعمولاتك." },
    "/owner/reports":    { title: "التقارير",     sub: "استعرض تقاريرك المالية." },
    "/owner/settings":   { title: "الإعدادات",    sub: "اضبط إعدادات مساحة عملك." },
    "/owner/profile":    { title: "ملفي الشخصي", sub: "إدارة معلوماتك الشخصية." },
  } as Record<string, { title: string; sub: string }>,
};

type Lang = "fr" | "ar";

const navItems = [
  { href: "/owner",            labelKey: "dashboard",  icon: LayoutDashboard },
  { href: "/owner/properties", labelKey: "properties", icon: Home },
  { href: "/owner/earnings",   labelKey: "earnings",   icon: DollarSign },
  { href: "/owner/reports",    labelKey: "reports",    icon: FileText },
] as const;

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [user, setUser]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang]   = useState<Lang>("fr");

  const tx    = labels[lang];
  const isRTL = lang === "ar";

  // Sync RTL on <html>
  useEffect(() => {
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
  }, [lang, isRTL]);

  // Auth guard
  useEffect(() => {
    const token    = localStorage.getItem("access");
    const role     = localStorage.getItem("role");
    const userData = localStorage.getItem("user");
    if (!token || role !== "owner") { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    setLoading(false);
  }, [router]);

  // Restore saved lang
  useEffect(() => {
    const saved = localStorage.getItem("mk_lang") as Lang | null;
    if (saved === "fr" || saved === "ar") setLang(saved);
  }, []);

  const handleLangChange = (l: Lang) => {
    setLang(l);
    localStorage.setItem("mk_lang", l);
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const isActive = (href: string) =>
    href === "/owner" ? pathname === href : pathname.startsWith(href);

  if (loading) {
    return (
      <div style={{
        display: "flex", height: "100vh",
        background: "#f9fafb",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "3px solid #f0fdf4",
          borderTop: "3px solid #22c55e",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ow-root {
          --green:      #22c55e;
          --green-bg:   #f0fdf4;
          --green-text: #16a34a;
          --ink:        #111827;
          --ink-2:      #374151;
          --ink-3:      #9ca3af;
          --ink-4:      #d1d5db;
          --border:     #f3f4f6;
          --border-2:   #e5e7eb;
          --bg:         #f9fafb;
          --surface:    #ffffff;
          --f: ${isRTL ? "'Cairo'" : "'Geist'"}, system-ui, sans-serif;

          font-family: var(--f);
          direction: ${isRTL ? "rtl" : "ltr"};
          display: flex;
          min-height: 100vh;
          background: var(--bg);
        }

        /* ── Sidebar ── */
        .ow-sb {
          width: 240px;
          height: 100vh;
          background: var(--surface);
          border-${isRTL ? "left" : "right"}: 1px solid var(--border-2);
          display: flex; flex-direction: column;
          position: fixed;
          ${isRTL ? "right: 0" : "left: 0"};
          top: 0; z-index: 40;
          flex-shrink: 0;
        }

        /* Logo */
        .ow-logo {
          display: flex; align-items: center;
          padding: 0 1.25rem;
          height: 64px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
          gap: 9px;
          ${isRTL ? "flex-direction: row-reverse" : ""};
        }
        .ow-logo-name {
          font-size: 17px; font-weight: 700;
          color: var(--ink); letter-spacing: -0.02em;
        }

        /* Search */
        .ow-search { padding: 0.875rem 1rem; flex-shrink: 0; }
        .ow-search-box {
          display: flex; align-items: center; gap: 8px;
          background: var(--bg); border: 1.5px solid var(--border-2);
          border-radius: 8px; padding: 7.5px 11px;
          cursor: text;
          transition: border-color 0.15s, box-shadow 0.15s;
          ${isRTL ? "flex-direction: row-reverse" : ""};
        }
        .ow-search-box:focus-within {
          border-color: var(--green);
          box-shadow: 0 0 0 3px rgba(34,197,94,0.1);
        }
        .ow-search-input {
          flex: 1; border: none; background: none; outline: none;
          font-family: var(--f); font-size: 13px; color: var(--ink);
          min-width: 0;
        }
        .ow-search-input::placeholder { color: var(--ink-4); }
        .ow-search-kbd {
          font-size: 10.5px; color: var(--ink-4);
          background: white; border: 1px solid var(--border-2);
          border-radius: 4px; padding: 1px 5px; flex-shrink: 0;
        }

        /* Section label */
        .ow-label {
          padding: 0 1.125rem 0.375rem;
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.08em; color: var(--ink-4);
          ${isRTL ? "text-align: right" : ""};
        }

        /* Nav */
        .ow-nav {
          flex: 1; overflow-y: auto;
          padding: 0 0.75rem;
          display: flex; flex-direction: column; gap: 2px;
        }
        .ow-nav::-webkit-scrollbar { display: none; }

        .ow-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 8px;
          font-size: 13.5px; font-weight: 400; color: var(--ink-3);
          text-decoration: none;
          transition: background 0.12s, color 0.12s;
          ${isRTL ? "flex-direction: row-reverse; text-align: right" : ""};
        }
        .ow-item:hover:not(.ow-on) { background: var(--bg); color: var(--ink-2); }
        .ow-item.ow-on { background: var(--green-bg); color: var(--green-text); font-weight: 500; }

        /* Bottom */
        .ow-div { height: 1px; background: var(--border); margin: 0.5rem 0.75rem; flex-shrink: 0; }
        .ow-bottom { padding: 0 0.75rem 0.875rem; flex-shrink: 0; }
        .ow-logout {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 8px;
          font-size: 13.5px; color: #ef4444;
          background: none; border: none;
          cursor: pointer; font-family: var(--f); width: 100%;
          transition: background 0.12s;
          ${isRTL ? "flex-direction: row-reverse; text-align: right" : ""};
        }
        .ow-logout:hover { background: #fef2f2; }

        /* ── Main area ── */
        .ow-main {
          flex: 1; display: flex; flex-direction: column;
          min-height: 100vh; overflow: hidden;
          margin-${isRTL ? "right" : "left"}: 240px;
        }

        .ow-content { flex: 1; overflow: auto; background: var(--bg); }
      `}</style>

      <div className="ow-root">

        {/* ── Sidebar ── */}
        <aside className="ow-sb">

          {/* Logo */}
          <div className="ow-logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#f0fdf4"/>
              <path d="M19 8L11 17h6l-2 7 8-10h-6l3-7z"
                fill="#22c55e" stroke="#22c55e" strokeWidth="0.5" strokeLinejoin="round"/>
            </svg>
            <span className="ow-logo-name">Makani</span>
          </div>

          {/* Search */}
          <div className="ow-search">
            <div className="ow-search-box">
              <Search size={13} color="var(--ink-3)" strokeWidth={1.8} style={{ flexShrink: 0 }} />
              <input
                className="ow-search-input"
                placeholder={tx.search}
              />
              <span className="ow-search-kbd">⌘K</span>
            </div>
          </div>

          <div className="ow-label">{tx.main}</div>

          {/* Nav items */}
          <nav className="ow-nav">
            {navItems.map(({ href, labelKey, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`ow-item${isActive(href) ? " ow-on" : ""}`}
              >
                <Icon size={16} strokeWidth={isActive(href) ? 2.2 : 1.8} />
                {tx[labelKey]}
              </Link>
            ))}
          </nav>

          <div className="ow-div" />
          <div className="ow-bottom">
            <button className="ow-logout" onClick={handleLogout}>
              <LogOut size={16} strokeWidth={1.8} />
              {tx.logout}
            </button>
          </div>

        </aside>

        {/* ── Main column ── */}
        <div className="ow-main">

          {/* ✅ Reuse the shared Navbar component */}
          <Navbar
            lang={lang}
            onLangChange={handleLangChange}
            pageMap={ownerPages}
          />

          <main className="ow-content">
            {children}
          </main>

        </div>
      </div>
    </>
  );
}