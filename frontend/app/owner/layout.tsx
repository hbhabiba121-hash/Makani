"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Home, DollarSign, FileText, LogOut, Bell, Search } from "lucide-react";
import Link from "next/link";
import { LanguageProvider, useLang } from "./contexts/LanguageContext";

const labels = {
  fr: {
    search:     "Rechercher propriétés, rapports...",
    main:       "PRINCIPAL",
    dashboard:  "Tableau de bord",
    properties: "Mes Propriétés",
    earnings:   "Revenus",
    reports:    "Rapports",
    logout:     "Se déconnecter",
    role:       "Propriétaire",
    kbd:        "⌘K",
    pages: {
      "/owner":            { title: "Tableau de bord",  sub: "Aperçu complet de vos propriétés." },
      "/owner/properties": { title: "Mes Propriétés",   sub: "Gérez et suivez votre portefeuille." },
      "/owner/earnings":   { title: "Revenus",           sub: "Suivez vos gains et commissions." },
      "/owner/reports":    { title: "Rapports",          sub: "Consultez vos rapports financiers." },
    } as Record<string, { title: string; sub: string }>,
  },
  ar: {
    search:     "بحث في العقارات والتقارير...",
    main:       "الرئيسية",
    dashboard:  "لوحة التحكم",
    properties: "عقاراتي",
    earnings:   "الإيرادات",
    reports:    "التقارير",
    logout:     "تسجيل الخروج",
    role:       "مالك العقار",
    kbd:        "⌘K",
    pages: {
      "/owner":            { title: "لوحة التحكم", sub: "نظرة شاملة على عقاراتك." },
      "/owner/properties": { title: "عقاراتي",     sub: "تتبع وإدارة محفظتك العقارية." },
      "/owner/earnings":   { title: "الإيرادات",   sub: "تتبع أرباحك وعمولاتك." },
      "/owner/reports":    { title: "التقارير",    sub: "استعرض تقاريرك المالية." },
    } as Record<string, { title: string; sub: string }>,
  },
} as const;

function OwnerLayoutInner({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { lang, setLang } = useLang();

  const [user, setUser]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dropOpen, setDropOpen] = useState(false);

  const tx    = labels[lang];
  const isRTL = lang === "ar";
  const page  = tx.pages[pathname] ?? { title: tx.dashboard, sub: "" };

  useEffect(() => {
    const token    = localStorage.getItem("access");
    const role     = localStorage.getItem("role");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (role !== "owner") { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (!dropOpen) return;
    const close = () => setDropOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [dropOpen]);

  const handleLogout = () => { localStorage.clear(); router.push("/login"); };

  const navItems = [
    { href: "/owner",            labelKey: "dashboard",  icon: LayoutDashboard },
    { href: "/owner/properties", labelKey: "properties", icon: Home },
    { href: "/owner/earnings",   labelKey: "earnings",   icon: DollarSign },
    { href: "/owner/reports",    labelKey: "reports",    icon: FileText },
  ] as const;

  const initials = user?.first_name && user?.last_name
    ? (user.first_name[0] + user.last_name[0]).toUpperCase()
    : user?.first_name?.[0]?.toUpperCase() || "O";

  const displayName = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}`
    : user?.email?.split("@")[0] || "—";

  const active = (href: string) =>
    href === "/owner" ? pathname === href : pathname.startsWith(href);

  if (loading) {
    return (
      <div style={{ display:"flex", height:"100vh", background:"#f9fafb", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:44, height:44, borderRadius:"50%", border:"3px solid #f0fdf4", borderTop:"3px solid #22c55e", animation:"spin 0.8s linear infinite" }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
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
          --green:       #22c55e;
          --green-bg:    #f0fdf4;
          --green-text:  #16a34a;
          --green-dim:   rgba(34,197,94,0.1);
          --ink:         #111827;
          --ink-2:       #374151;
          --ink-3:       #9ca3af;
          --ink-4:       #d1d5db;
          --border:      #f3f4f6;
          --border-2:    #e5e7eb;
          --bg:          #f9fafb;
          --surface:     #ffffff;
          --f: ${isRTL ? "'Cairo'" : "'Geist'"}, system-ui, sans-serif;

          font-family: var(--f);
          direction: ${isRTL ? "rtl" : "ltr"};
          display: flex;
          height: 100vh;
          background: var(--bg);
          overflow: hidden;
        }

        /* ══ SIDEBAR ══ */
        .ow-sb {
          width: 240px; height: 100vh;
          background: var(--surface);
          border-${isRTL ? "left" : "right"}: 1px solid var(--border-2);
          display: flex; flex-direction: column;
          position: fixed;
          ${isRTL ? "right:0" : "left:0"}; top: 0; z-index: 40;
        }
        .ow-logo {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 1.25rem; height: 64px;
          border-bottom: 1px solid var(--border); flex-shrink: 0;
        }
        .ow-logo-inner { display: flex; align-items: center; gap: 9px; }
        .ow-logo-name  { font-size: 17px; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; }

        .ow-search { padding: 0.875rem 1rem; flex-shrink: 0; }
        .ow-search-inner {
          display: flex; align-items: center; gap: 8px;
          background: var(--bg); border: 1px solid var(--border-2);
          border-radius: 8px; padding: 7.5px 11px; cursor: pointer;
          transition: border-color 0.15s;
          ${isRTL ? "flex-direction: row-reverse" : ""};
        }
        .ow-search-inner:hover { border-color: var(--ink-4); }
        .ow-search-text  { flex: 1; font-size: 13px; color: var(--ink-3); font-family: var(--f); }
        .ow-search-kbd   { font-size: 11px; color: var(--ink-4); background: var(--surface); border: 1px solid var(--border-2); border-radius: 4px; padding: 1px 5px; }

        .ow-label { padding: 0 1.125rem 0.375rem; font-size: 10px; font-weight: 600; letter-spacing: 0.08em; color: var(--ink-4); ${isRTL ? "text-align:right" : ""}; }

        .ow-nav { flex: 1; overflow-y: auto; padding: 0 0.75rem; display: flex; flex-direction: column; gap: 2px; }
        .ow-nav::-webkit-scrollbar { display: none; }

        .ow-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 8px;
          font-size: 13.5px; font-weight: 400; color: var(--ink-3);
          text-decoration: none; transition: background 0.12s, color 0.12s;
          ${isRTL ? "flex-direction: row-reverse; text-align: right" : ""};
        }
        .ow-item:hover:not(.ow-active) { background: var(--bg); color: var(--ink-2); }
        .ow-item.ow-active { background: var(--green-bg); color: var(--green-text); font-weight: 500; }

        .ow-divider { height: 1px; background: var(--border); margin: 0.5rem 0.75rem; flex-shrink: 0; }

        .ow-bottom { padding: 0 0.75rem 0.875rem; flex-shrink: 0; }
        .ow-logout {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 8px;
          font-size: 13.5px; color: #ef4444;
          background: none; border: none; cursor: pointer;
          font-family: var(--f); width: 100%; transition: background 0.12s;
          ${isRTL ? "flex-direction: row-reverse; text-align: right" : ""};
        }
        .ow-logout:hover { background: #fef2f2; }

        /* ══ MAIN ══ */
        .ow-main {
          flex: 1; display: flex; flex-direction: column; overflow: hidden;
          margin-${isRTL ? "right" : "left"}: 240px;
        }

        /* ══ NAVBAR ══ */
        .ow-nb {
          height: 64px; background: var(--surface);
          border-bottom: 1px solid var(--border-2);
          display: flex; align-items: center;
          padding: 0 1.75rem; gap: 1rem;
          position: sticky; top: 0; z-index: 30; flex-shrink: 0;
        }
        .ow-nb-title { flex: 1; }
        .ow-nb-title-h   { font-size: 19px; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; line-height: 1.15; }
        .ow-nb-title-sub { font-size: 12px; font-weight: 300; color: var(--ink-3); margin-top: 1px; }

        .ow-nb-right { display: flex; align-items: center; gap: 6px; margin-${isRTL ? "right" : "left"}: auto; }

        /* language toggle */
        .ow-lang { display: flex; align-items: center; border: 1px solid var(--border-2); border-radius: 8px; overflow: hidden; margin-${isRTL ? "left" : "right"}: 4px; }
        .ow-lang-btn {
          padding: 5px 11px; font-size: 12px; font-weight: 500;
          font-family: var(--f); border: none; background: none;
          color: var(--ink-3); cursor: pointer;
          transition: background 0.12s, color 0.12s; line-height: 1;
        }
        .ow-lang-btn:first-child { border-${isRTL ? "left" : "right"}: 1px solid var(--border-2); }
        .ow-lang-btn.on { background: var(--green); color: #fff; }
        .ow-lang-btn:not(.on):hover { background: var(--bg); color: var(--ink-2); }

        .ow-bell {
          width: 36px; height: 36px; border-radius: 50%;
          border: 1px solid var(--border-2); background: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: var(--ink-3); position: relative; transition: background 0.12s, color 0.12s;
        }
        .ow-bell:hover { background: var(--bg); color: var(--ink-2); }
        .ow-bell-dot {
          position: absolute; top: 6px; ${isRTL ? "left:7px" : "right:7px"};
          width: 7px; height: 7px; background: #ef4444;
          border-radius: 50%; border: 1.5px solid #fff;
        }

        .ow-av-wrap {
          width: 36px; height: 36px; border-radius: 50%;
          border: 2px solid var(--border-2); overflow: hidden;
          cursor: pointer; transition: border-color 0.12s; flex-shrink: 0;
        }
        .ow-av-wrap:hover { border-color: var(--green); }
        .ow-av-inner {
          width: 100%; height: 100%; background: var(--green-dim);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 600; color: var(--green);
        }

        .ow-user-btn {
          display: flex; align-items: center; gap: 8px;
          border: none; background: none; cursor: pointer;
          font-family: var(--f); padding: 0; position: relative;
          ${isRTL ? "flex-direction: row-reverse" : ""};
        }

        .ow-drop {
          position: absolute; top: calc(100% + 10px);
          ${isRTL ? "left:0" : "right:0"}; width: 210px;
          background: var(--surface); border: 1px solid var(--border-2);
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04);
          padding: 6px; z-index: 100;
          opacity: 0; transform: translateY(-6px) scale(0.97);
          pointer-events: none; transition: opacity 0.15s, transform 0.15s;
        }
        .ow-drop.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }
        .ow-drop-head { padding: 8px 10px 10px; border-bottom: 1px solid var(--border); margin-bottom: 4px; ${isRTL ? "text-align:right" : ""}; }
        .ow-drop-name  { font-size: 13px; font-weight: 600; color: var(--ink); }
        .ow-drop-email { font-size: 11px; color: var(--ink-3); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ow-drop-role  { display: inline-block; margin-top: 5px; font-size: 10px; font-weight: 500; color: var(--green); background: var(--green-dim); border: 1px solid rgba(34,197,94,0.2); border-radius: 4px; padding: 1.5px 6px; }
        .ow-drop-item {
          display: flex; align-items: center; gap: 9px;
          padding: 8px 10px; border-radius: 8px;
          font-size: 13px; color: var(--ink-2);
          cursor: pointer; border: none; background: none;
          width: 100%; font-family: var(--f); text-decoration: none;
          transition: background 0.12s, color 0.12s;
          ${isRTL ? "flex-direction: row-reverse; text-align: right" : ""};
        }
        .ow-drop-item:hover { background: var(--bg); color: var(--ink); }
        .ow-drop-item.red { color: #ef4444; }
        .ow-drop-item.red:hover { background: #fef2f2; }
        .ow-drop-line { height: 1px; background: var(--border); margin: 4px 0; }

        .ow-content { flex: 1; overflow: auto; background: var(--bg); }
      `}</style>

      <div className="ow-root">

        <aside className="ow-sb">
          <div className="ow-logo">
            <div className="ow-logo-inner">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#f0fdf4"/>
                <path d="M19 8L11 17h6l-2 7 8-10h-6l3-7z" fill="#22c55e" stroke="#22c55e" strokeWidth="0.5" strokeLinejoin="round"/>
              </svg>
              <span className="ow-logo-name">Makani</span>
            </div>
          </div>

          <div className="ow-search">
            <div className="ow-search-inner">
              <Search size={13} color="var(--ink-3)" strokeWidth={1.8} />
              <span className="ow-search-text">{tx.search}</span>
              <span className="ow-search-kbd">{tx.kbd}</span>
            </div>
          </div>

          <div className="ow-label">{tx.main}</div>

          <nav className="ow-nav">
            {navItems.map(({ href, labelKey, icon: Icon }) => (
              <Link key={href} href={href} className={`ow-item${active(href) ? " ow-active" : ""}`}>
                <Icon size={16} strokeWidth={active(href) ? 2.2 : 1.8} />
                {tx[labelKey]}
              </Link>
            ))}
          </nav>

          <div className="ow-divider" />
          <div className="ow-bottom">
            <button className="ow-logout" onClick={handleLogout}>
              <LogOut size={16} strokeWidth={1.8} />
              {tx.logout}
            </button>
          </div>
        </aside>

        <div className="ow-main">
          <header className="ow-nb">
            <div className="ow-nb-title">
              <div className="ow-nb-title-h">{page.title}</div>
              {page.sub && <div className="ow-nb-title-sub">{page.sub}</div>}
            </div>

            <div className="ow-nb-right">

              <div className="ow-lang">
                <button className={`ow-lang-btn${lang === "fr" ? " on" : ""}`} onClick={() => setLang("fr")}>FR</button>
                <button className={`ow-lang-btn${lang === "ar" ? " on" : ""}`} onClick={() => setLang("ar")}>ع</button>
              </div>

              <button className="ow-bell" aria-label="Notifications">
                <Bell size={15} strokeWidth={1.8} />
                <span className="ow-bell-dot" />
              </button>

              <div style={{ position: "relative" }}>
                <button className="ow-user-btn" onClick={() => setDropOpen(v => !v)}>
                  <div className="ow-av-wrap">
                    <div className="ow-av-inner">{initials}</div>
                  </div>
                </button>
                <div className={`ow-drop${dropOpen ? " open" : ""}`}>
                  <div className="ow-drop-head">
                    <div className="ow-drop-name">{displayName}</div>
                    <div className="ow-drop-email">{user?.email}</div>
                    <span className="ow-drop-role">{tx.role}</span>
                  </div>
                  <div className="ow-drop-line" />
                  <button className="ow-drop-item red" onClick={handleLogout}>
                    <LogOut size={14} strokeWidth={1.8} />{tx.logout}
                  </button>
                </div>
              </div>

            </div>
          </header>

          <main className="ow-content">
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