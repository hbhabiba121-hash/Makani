"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, ChevronDown, LogOut, Settings, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { getCurrentUser } from "@/lib/axios";

interface UserType {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
}

// ── i18n ──────────────────────────────────────────────────────
const i18n = {
  fr: {
    pages: {
      "/dashboard":              { title: "Dashboard",       sub: "Obtenez un aperçu complet de vos performances." },
      "/dashboard/properties":   { title: "Propriétés",      sub: "Gérez toutes vos propriétés en un seul endroit." },
      "/dashboard/owners":       { title: "Propriétaires",   sub: "Suivez et gérez les propriétaires bailleurs." },
      "/dashboard/staff":        { title: "Staff",           sub: "Gérez votre équipe et leurs accès." },
      "/dashboard/revenue":      { title: "Revenus",         sub: "Suivez vos revenus et commissions." },
      "/dashboard/expenses":     { title: "Dépenses",        sub: "Contrôlez vos charges et dépenses." },
      "/dashboard/analysis":     { title: "Analyse",         sub: "Visualisez les performances de votre portefeuille." },
      "/dashboard/reports":      { title: "Rapports",        sub: "Exportez et consultez vos rapports financiers." },
      "/dashboard/settings":     { title: "Paramètres",      sub: "Configurez votre espace de travail." },
      "/dashboard/security":     { title: "Sécurité",        sub: "Gérez les accès et la sécurité." },
      "/dashboard/help":         { title: "Centre d'aide",   sub: "Besoin d'aide ? Consultez notre documentation." },
    } as Record<string, { title: string; sub: string }>,
    profile:  "Mon profil",
    settings: "Paramètres",
    logout:   "Se déconnecter",
    roles:    { admin: "Administrateur", owner: "Propriétaire", staff: "Staff" } as Record<string,string>,
    lang:     "Langue",
    fr:       "Français",
    ar:       "العربية",
  },
  ar: {
    pages: {
      "/dashboard":              { title: "لوحة التحكم",   sub: "نظرة شاملة على أداء منصتك." },
      "/dashboard/properties":   { title: "العقارات",      sub: "إدارة جميع عقاراتك في مكان واحد." },
      "/dashboard/owners":       { title: "الملاك",        sub: "تتبع وإدارة ملاك العقارات." },
      "/dashboard/staff":        { title: "الموظفون",      sub: "إدارة فريقك وصلاحياتهم." },
      "/dashboard/revenue":      { title: "الإيرادات",     sub: "تتبع إيراداتك وعمولاتك." },
      "/dashboard/expenses":     { title: "المصاريف",      sub: "راقب تكاليفك ومصاريفك." },
      "/dashboard/analysis":     { title: "التحليل",       sub: "تحليل أداء محفظتك العقارية." },
      "/dashboard/reports":      { title: "التقارير",      sub: "تصدير واستعراض تقاريرك المالية." },
      "/dashboard/settings":     { title: "الإعدادات",     sub: "اضبط إعدادات مساحة عملك." },
      "/dashboard/security":     { title: "الأمان",        sub: "إدارة الوصول والأمان." },
      "/dashboard/help":         { title: "مركز المساعدة", sub: "تحتاج مساعدة؟ راجع التوثيق." },
    } as Record<string, { title: string; sub: string }>,
    profile:  "ملفي الشخصي",
    settings: "الإعدادات",
    logout:   "تسجيل الخروج",
    roles:    { admin: "مدير", owner: "مالك", staff: "موظف" } as Record<string,string>,
    lang:     "اللغة",
    fr:       "Français",
    ar:       "العربية",
  },
} as const;

type Lang = "fr" | "ar";

interface NavbarProps {
  lang?: Lang;
  onLangChange?: (l: Lang) => void;
}

export default function Navbar({ lang = "fr", onLangChange }: NavbarProps) {
  const [user, setUser]         = useState<UserType | null>(null);
  const [loading, setLoading]   = useState(true);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef  = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const tx       = i18n[lang];
  const isRTL    = lang === "ar";

  const page = tx.pages[pathname] ?? { title: "Dashboard", sub: "" };

  useEffect(() => {
    getCurrentUser().then((u) => { setUser(u); setLoading(false); });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
  }, [lang, isRTL]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setDropOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const initials = () => {
    if (!user) return "AU";
    if (user.first_name && user.last_name)
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    return user.email[0].toUpperCase();
  };

  const displayName = () => {
    if (!user) return "—";
    if (user.full_name?.trim()) return user.full_name;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    return user.email.split("@")[0];
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');

        .nb {
          --green:      #22c55e;
          --green-dim:  rgba(34,197,94,0.1);
          --ink:        #111827;
          --ink-2:      #374151;
          --ink-3:      #9ca3af;
          --ink-4:      #d1d5db;
          --border:     #f3f4f6;
          --border-2:   #e5e7eb;
          --bg:         #f9fafb;
          --surface:    #ffffff;
          --f:          ${isRTL ? "'Cairo'" : "'Geist'"}, system-ui, sans-serif;

          font-family: var(--f);
          direction: ${isRTL ? "rtl" : "ltr"};
          position: sticky; top: 0; z-index: 50;
          height: 64px;
          background: var(--surface);
          border-bottom: 1px solid var(--border-2);
          display: flex; align-items: center;
          /* Offset for sidebar width */
          padding: 0 1.75rem;
          gap: 1rem;
        }

        /* Page title */
        .nb-title { flex: 1; }
        .nb-title-h {
          font-size: 19px; font-weight: 700;
          color: var(--ink);
          letter-spacing: -0.02em;
          line-height: 1.15;
        }
        .nb-title-sub {
          font-size: 12px; font-weight: 300;
          color: var(--ink-3); margin-top: 1px;
        }

        /* Right cluster */
        .nb-right {
          display: flex; align-items: center; gap: 6px;
          margin-${isRTL ? "right" : "left"}: auto;
        }

        /* Lang toggle — pill like the image's Week/Month toggle */
        .nb-lang {
          display: flex; align-items: center;
          border: 1px solid var(--border-2);
          border-radius: 8px;
          overflow: hidden;
          margin-${isRTL ? "left" : "right"}: 4px;
        }
        .nb-lang-btn {
          padding: 5px 11px;
          font-size: 12px; font-weight: 500;
          font-family: var(--f);
          border: none; background: none;
          color: var(--ink-3); cursor: pointer;
          transition: background 0.12s, color 0.12s;
          line-height: 1;
        }
        .nb-lang-btn:first-child {
          border-${isRTL ? "left" : "right"}: 1px solid var(--border-2);
        }
        .nb-lang-btn.on {
          background: var(--green);
          color: #fff;
        }
        .nb-lang-btn:not(.on):hover { background: var(--bg); color: var(--ink-2); }

        /* Bell */
        .nb-bell {
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 1px solid var(--border-2);
          background: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: var(--ink-3); position: relative;
          transition: background 0.12s, color 0.12s;
        }
        .nb-bell:hover { background: var(--bg); color: var(--ink-2); }
        .nb-bell-dot {
          position: absolute; top: 6px;
          ${isRTL ? "left: 7px" : "right: 7px"};
          width: 7px; height: 7px;
          background: #ef4444; border-radius: 50%;
          border: 1.5px solid #fff;
        }

        /* Avatar — circular with photo/initials, border ring */
        .nb-avatar-wrap {
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 2px solid var(--border-2);
          overflow: hidden; cursor: pointer;
          transition: border-color 0.12s;
          flex-shrink: 0;
        }
        .nb-avatar-wrap:hover { border-color: var(--green); }
        .nb-avatar-inner {
          width: 100%; height: 100%;
          background: var(--green-dim);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 600; color: var(--green);
        }

        /* User button (avatar + name + chevron) */
        .nb-user {
          display: flex; align-items: center; gap: 8px;
          border: none; background: none; cursor: pointer;
          font-family: var(--f); padding: 0;
          ${isRTL ? "flex-direction: row-reverse" : ""};
        }

        /* Dropdown */
        .nb-drop {
          position: absolute;
          top: calc(100% + 10px);
          ${isRTL ? "left: 0" : "right: 0"};
          width: 210px;
          background: var(--surface);
          border: 1px solid var(--border-2);
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04);
          padding: 6px;
          z-index: 100;
          opacity: 0; transform: translateY(-6px) scale(0.97);
          pointer-events: none;
          transition: opacity 0.15s, transform 0.15s;
        }
        .nb-drop.open {
          opacity: 1; transform: translateY(0) scale(1);
          pointer-events: all;
        }

        .nb-drop-head {
          padding: 8px 10px 10px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 4px;
          ${isRTL ? "text-align: right" : ""};
        }
        .nb-drop-name { font-size: 13px; font-weight: 600; color: var(--ink); }
        .nb-drop-email {
          font-size: 11px; color: var(--ink-3); margin-top: 2px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .nb-drop-role {
          display: inline-block; margin-top: 5px;
          font-size: 10px; font-weight: 500;
          color: var(--green);
          background: var(--green-dim);
          border: 1px solid rgba(34,197,94,0.2);
          border-radius: 4px;
          padding: 1.5px 6px;
        }

        .nb-drop-item {
          display: flex; align-items: center; gap: 9px;
          padding: 8px 10px; border-radius: 8px;
          font-size: 13px; color: var(--ink-2);
          cursor: pointer; border: none; background: none;
          width: 100%; font-family: var(--f); text-decoration: none;
          transition: background 0.12s, color 0.12s;
          ${isRTL ? "flex-direction: row-reverse; text-align: right" : ""};
        }
        .nb-drop-item:hover { background: var(--bg); color: var(--ink); }
        .nb-drop-item.red { color: #ef4444; }
        .nb-drop-item.red:hover { background: #fef2f2; }

        .nb-drop-line { height: 1px; background: var(--border); margin: 4px 0; }

        /* Skeleton */
        .nb-skel {
          height: 36px; width: 36px; border-radius: 50%;
          background: linear-gradient(90deg,#f0f0ee 25%,#e6e6e2 50%,#f0f0ee 75%);
          background-size: 200% 100%;
          animation: nbsk 1.4s infinite;
        }
        @keyframes nbsk { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      <header className="nb">

        {/* Page title */}
        <div className="nb-title">
          <div className="nb-title-h">{page.title}</div>
          {page.sub && <div className="nb-title-sub">{page.sub}</div>}
        </div>

        {/* Right */}
        <div className="nb-right">

          {/* Language switcher */}
          <div className="nb-lang">
            <button className={`nb-lang-btn${lang === "fr" ? " on" : ""}`} onClick={() => onLangChange?.("fr")}>FR</button>
            <button className={`nb-lang-btn${lang === "ar" ? " on" : ""}`} onClick={() => onLangChange?.("ar")}>ع</button>
          </div>

          {/* Bell */}
          <button className="nb-bell" aria-label="Notifications">
            <Bell size={15} strokeWidth={1.8} />
            <span className="nb-bell-dot" />
          </button>

          {/* User */}
          {loading ? (
            <div className="nb-skel" />
          ) : (
            <div ref={dropRef} style={{ position: "relative" }}>
              <button className="nb-user" onClick={() => setDropOpen(v => !v)}>
                <div className="nb-avatar-wrap">
                  <div className="nb-avatar-inner">{initials()}</div>
                </div>
              </button>

              <div className={`nb-drop${dropOpen ? " open" : ""}`}>
                <div className="nb-drop-head">
                  <div className="nb-drop-name">{displayName()}</div>
                  <div className="nb-drop-email">{user?.email}</div>
                  <span className="nb-drop-role">
                    {tx.roles[user?.role ?? ""] ?? user?.role}
                  </span>
                </div>
                <a href="/dashboard/profile" className="nb-drop-item">
                  <User size={14} strokeWidth={1.8} />{tx.profile}
                </a>
                <a href="/dashboard/settings" className="nb-drop-item">
                  <Settings size={14} strokeWidth={1.8} />{tx.settings}
                </a>
                <div className="nb-drop-line" />
                <button
                  className="nb-drop-item red"
                  onClick={() => {
                    localStorage.removeItem("access");
                    localStorage.removeItem("refresh");
                    localStorage.removeItem("user");
                    window.location.href = "/login";
                  }}
                >
                  <LogOut size={14} strokeWidth={1.8} />{tx.logout}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}