// frontend/app/components/Navbar.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, ChevronDown, LogOut, Settings, User, Globe, Check } from "lucide-react";
import { usePathname } from "next/navigation";
import { getCurrentUser } from "@/lib/axios";
import Image from "next/image";

interface UserType {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  picture?: string | null;
  picture_url?: string | null;
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
      "/owner":                  { title: "Tableau de bord", sub: "Aperçu complet de vos propriétés." },
      "/owner/properties":       { title: "Mes Propriétés",  sub: "Gérez et suivez votre portefeuille." },
      "/owner/earnings":         { title: "Revenus",         sub: "Suivez vos gains et commissions." },
      "/owner/reports":          { title: "Rapports",        sub: "Consultez vos rapports financiers." },
      "/owner/settings":         { title: "Paramètres",      sub: "Configurez votre espace." },
      "/owner/profile":          { title: "Mon profil",      sub: "Gérez vos informations personnelles." },
      "/staff":                  { title: "Tableau de bord", sub: "Gérez vos tâches quotidiennes." },
      "/staff/properties":       { title: "Propriétés",      sub: "Gérez les propriétés assignées." },
      "/staff/tenants":          { title: "Locataires",      sub: "Suivez vos locataires." },
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
      "/owner":                  { title: "لوحة التحكم",   sub: "نظرة شاملة على عقاراتك." },
      "/owner/properties":       { title: "عقاراتي",       sub: "تتبع وإدارة محفظتك العقارية." },
      "/owner/earnings":         { title: "الإيرادات",     sub: "تتبع أرباحك وعمولاتك." },
      "/owner/reports":          { title: "التقارير",      sub: "استعرض تقاريرك المالية." },
      "/owner/settings":         { title: "الإعدادات",     sub: "اضبط إعدادات مساحة عملك." },
      "/owner/profile":          { title: "ملفي الشخصي",   sub: "إدارة معلوماتك الشخصية." },
      "/staff":                  { title: "لوحة التحكم",   sub: "إدارة مهامك اليومية." },
      "/staff/properties":       { title: "العقارات",      sub: "إدارة العقارات المخصصة لك." },
      "/staff/tenants":          { title: "المستأجرين",    sub: "متابعة المستأجرين." },
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
  const [langDropOpen, setLangDropOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dropRef  = useRef<HTMLDivElement>(null);
  const langDropRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const tx       = i18n[lang];
  const isRTL    = lang === "ar";

  const page = tx.pages[pathname] ?? { title: "Dashboard", sub: "" };

  useEffect(() => {
    getCurrentUser().then((u) => { 
      setUser(u); 
      setLoading(false);
      setImageError(false);
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
  }, [lang, isRTL]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setDropOpen(false);
      if (langDropRef.current && !langDropRef.current.contains(e.target as Node))
        setLangDropOpen(false);
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

  const getProfilePictureUrl = () => {
    if (!user?.picture_url) return null;
    if (user.picture_url.startsWith('http')) return user.picture_url;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return `${baseUrl}${user.picture_url}`;
  };

  const profilePictureUrl = getProfilePictureUrl();
  const showPicture = profilePictureUrl && !imageError;

  // Get the base path for profile (works for /dashboard, /owner, /staff)
  const getProfilePath = () => {
    const segments = pathname.split('/');
    const baseRole = segments[1]; // dashboard, owner, or staff
    return `/${baseRole}/profile`;
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
          padding: 0 1.75rem;
          gap: 1rem;
        }

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

        .nb-right {
          display: flex; align-items: center; gap: 12px;
          margin-${isRTL ? "right" : "left"}: auto;
        }

        .nb-lang-container { position: relative; }
        
        .nb-lang-trigger {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 12px;
          background: var(--bg);
          border: 1px solid var(--border-2);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: var(--f);
          font-size: 13px;
          font-weight: 500;
          color: var(--ink-2);
        }
        
        .nb-lang-trigger:hover {
          background: var(--border);
          border-color: var(--green);
        }
        
        .nb-lang-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          ${isRTL ? "left: 0" : "right: 0"};
          min-width: 160px;
          background: var(--surface);
          border: 1px solid var(--border-2);
          border-radius: 10px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
          padding: 4px;
          z-index: 100;
          opacity: 0;
          transform: translateY(-6px);
          pointer-events: none;
          transition: opacity 0.2s, transform 0.2s;
        }
        
        .nb-lang-dropdown.open {
          opacity: 1;
          transform: translateY(0);
          pointer-events: all;
        }
        
        .nb-lang-option {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.12s;
          font-size: 13px;
          color: var(--ink-2);
          ${isRTL ? "flex-direction: row-reverse; text-align: right" : ""};
        }
        
        .nb-lang-option:hover { background: var(--bg); }
        .nb-lang-option.active { background: var(--green-dim); color: var(--green); }
        .nb-lang-option .check-icon {
          margin-${isRTL ? "right" : "left"}: auto;
          opacity: 0;
          transition: opacity 0.12s;
        }
        .nb-lang-option.active .check-icon { opacity: 1; }

        .nb-bell {
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 1px solid var(--border-2);
          background: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: var(--ink-3); position: relative;
          transition: all 0.2s ease;
        }
        .nb-bell:hover { 
          background: var(--bg); 
          color: var(--ink-2);
          border-color: var(--green);
        }
        .nb-bell-dot {
          position: absolute; top: 6px;
          ${isRTL ? "left: 7px" : "right: 7px"};
          width: 7px; height: 7px;
          background: #ef4444; border-radius: 50%;
          border: 1.5px solid #fff;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }

        .nb-profile { position: relative; }
        
        .nb-profile-trigger {
          display: flex; align-items: center;
          padding: 0;
          background: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .nb-avatar-wrap {
          width: 36px; height: 36px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          border: 2px solid var(--border-2);
          transition: border-color 0.2s ease;
        }
        
        .nb-profile-trigger:hover .nb-avatar-wrap {
          border-color: var(--green);
        }
        
        .nb-avatar-picture {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .nb-avatar-inner {
          width: 100%; height: 100%;
          background: linear-gradient(135deg, var(--green) 0%, #16a34a 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 600; color: white;
        }
        
        .nb-drop {
          position: absolute;
          top: calc(100% + 8px);
          ${isRTL ? "left: 0" : "right: 0"};
          width: 240px;
          background: var(--surface);
          border: 1px solid var(--border-2);
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          padding: 8px;
          z-index: 100;
          opacity: 0;
          transform: translateY(-6px) scale(0.97);
          pointer-events: none;
          transition: opacity 0.2s, transform 0.2s;
        }
        
        .nb-drop.open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: all;
        }

        .nb-drop-head {
          padding: 8px 8px 12px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 8px;
          ${isRTL ? "text-align: right" : ""};
        }
        .nb-drop-name { font-size: 14px; font-weight: 600; color: var(--ink); }
        .nb-drop-email {
          font-size: 11px; color: var(--ink-3); margin-top: 4px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .nb-drop-role {
          display: inline-block; margin-top: 5px;
          font-size: 10px; font-weight: 500;
          color: var(--green);
          background: var(--green-dim);
          border: 1px solid rgba(34,197,94,0.2);
          border-radius: 4px;
          padding: 2px 6px;
        }

        .nb-drop-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px; border-radius: 8px;
          font-size: 13px; color: var(--ink-2);
          cursor: pointer; border: none; background: none;
          width: 100%; font-family: var(--f); text-decoration: none;
          transition: all 0.12s;
          ${isRTL ? "flex-direction: row-reverse; text-align: right" : ""};
        }
        .nb-drop-item:hover { 
          background: var(--bg); 
          color: var(--ink); 
          transform: translateX(${isRTL ? "-2px" : "2px"}); 
        }
        .nb-drop-item.red { color: #ef4444; }
        .nb-drop-item.red:hover { background: #fef2f2; }

        .nb-drop-line { height: 1px; background: var(--border); margin: 8px 0; }

        .nb-skel {
          width: 36px; height: 36px;
          background: linear-gradient(90deg,#f0f0ee 25%,#e6e6e2 50%,#f0f0ee 75%);
          background-size: 200% 100%;
          border-radius: 50%;
          animation: nbsk 1.4s infinite;
        }
        @keyframes nbsk { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      <header className="nb">
        <div className="nb-title">
          <div className="nb-title-h">{page.title}</div>
          {page.sub && <div className="nb-title-sub">{page.sub}</div>}
        </div>

        <div className="nb-right">
          <div className="nb-lang-container" ref={langDropRef}>
            <button className="nb-lang-trigger" onClick={() => setLangDropOpen(v => !v)}>
              <Globe size={14} strokeWidth={1.8} />
              <span>{lang === "fr" ? "FR" : "AR"}</span>
              <ChevronDown size={12} />
            </button>
            
            <div className={`nb-lang-dropdown${langDropOpen ? " open" : ""}`}>
              <div 
                className={`nb-lang-option ${lang === "fr" ? "active" : ""}`}
                onClick={() => { onLangChange?.("fr"); setLangDropOpen(false); }}
              >
                <span>🇫🇷</span>
                <span>{tx.fr}</span>
                <Check size={14} className="check-icon" />
              </div>
              <div 
                className={`nb-lang-option ${lang === "ar" ? "active" : ""}`}
                onClick={() => { onLangChange?.("ar"); setLangDropOpen(false); }}
              >
                <span>🇸🇦</span>
                <span>{tx.ar}</span>
                <Check size={14} className="check-icon" />
              </div>
            </div>
          </div>

          <button className="nb-bell" aria-label="Notifications">
            <Bell size={15} strokeWidth={1.8} />
            <span className="nb-bell-dot" />
          </button>

          {loading ? (
            <div className="nb-skel" />
          ) : (
            <div className="nb-profile" ref={dropRef}>
              <button className="nb-profile-trigger" onClick={() => setDropOpen(v => !v)}>
                <div className="nb-avatar-wrap">
                  {showPicture ? (
                    <img 
                      src={profilePictureUrl!}
                      alt={user?.full_name || 'Profile'}
                      className="nb-avatar-picture"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="nb-avatar-inner">{initials()}</div>
                  )}
                </div>
              </button>

              <div className={`nb-drop${dropOpen ? " open" : ""}`}>
                <div className="nb-drop-head">
                  <div className="nb-drop-name">{user?.full_name || `${user?.first_name} ${user?.last_name}` || user?.email}</div>
                  <div className="nb-drop-email">{user?.email}</div>
                  <span className="nb-drop-role">
                    {tx.roles[user?.role ?? ""] ?? user?.role}
                  </span>
                </div>
                <a href={getProfilePath()} className="nb-drop-item">
                  <User size={14} strokeWidth={1.8} />
                  <span>{tx.profile}</span>
                </a>
                <a href={`/${pathname.split('/')[1]}/settings`} className="nb-drop-item">
                  <Settings size={14} strokeWidth={1.8} />
                  <span>{tx.settings}</span>
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
                  <LogOut size={14} strokeWidth={1.8} />
                  <span>{tx.logout}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}