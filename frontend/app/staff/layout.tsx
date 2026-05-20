// frontend/app/staff/layout.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Home, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Navbar from "@/app/components/Navbar";
import { LanguageProvider, useLang } from "@/app/components/contexts/LanguageContext";

const labels = {
  fr: {
    dashboard: "Tableau de bord",
    properties: "Propriétés",
    tenants: "Locataires",
    reports: "Rapports",
    settings: "Paramètres",
    logout: "Déconnexion",
  },
  ar: {
    dashboard: "لوحة التحكم",
    properties: "العقارات",
    tenants: "المستأجرين",
    reports: "التقارير",
    settings: "الإعدادات",
    logout: "تسجيل الخروج",
  },
};

function StaffLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { lang } = useLang();
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isRTL = lang === "ar";
  const tx = labels[lang as keyof typeof labels] || labels.fr;

  useEffect(() => {
    const token = localStorage.getItem("access");
    const role = localStorage.getItem("role");
    if (!token || role !== "staff") {
      router.push("/login");
      return;
    }
    setLoading(false);
  }, [router]);

  const navItems = [
    { href: "/staff", label: tx.dashboard, icon: LayoutDashboard },
    { href: "/staff/properties", label: tx.properties, icon: Home },
    { href: "/staff/tenants", label: tx.tenants, icon: Users },
    { href: "/staff/reports", label: tx.reports, icon: FileText },
    { href: "/staff/settings", label: tx.settings, icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/staff") return pathname === href;
    return pathname.startsWith(href);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #f0fdf4", borderTop: "3px solid #22c55e", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f9fafb", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside style={{
        width: isCollapsed ? 72 : 240,
        background: "white",
        borderRight: isRTL ? "none" : "1px solid #e5e7eb",
        borderLeft: isRTL ? "1px solid #e5e7eb" : "none",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        height: "100vh",
        [isRTL ? "right" : "left"]: 0,
        top: 0,
        zIndex: 40,
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "space-between",
          padding: isCollapsed ? "0 1rem" : "0 1.25rem",
          height: 64,
          borderBottom: "1px solid #f3f4f6",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#f0fdf4"/>
              <path d="M19 8L11 17h6l-2 7 8-10h-6l3-7z" fill="#22c55e" stroke="#22c55e" strokeWidth="0.5" strokeLinejoin="round"/>
            </svg>
            {!isCollapsed && <span style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>Makani</span>}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              width: 26,
              height: 26,
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              background: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#9ca3af",
              transition: "background 0.12s",
              transform: isCollapsed ? "rotate(180deg)" : "none",
            }}
          >
            {isRTL ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation */}
        <nav style={{
          flex: 1,
          overflowY: "auto",
          padding: isCollapsed ? "0 0.5rem" : "0 0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          marginTop: "0.5rem",
        }}>
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 8,
                fontSize: 13.5,
                color: isActive(href) ? "#16a34a" : "#9ca3af",
                background: isActive(href) ? "#f0fdf4" : "transparent",
                textDecoration: "none",
                transition: "all 0.12s",
                justifyContent: isCollapsed ? "center" : "flex-start",
              }}
              title={isCollapsed ? label : undefined}
            >
              <Icon size={16} strokeWidth={isActive(href) ? 2.2 : 1.8} />
              {!isCollapsed && <span style={{ whiteSpace: "nowrap" }}>{label}</span>}
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div style={{ padding: isCollapsed ? "0 0.5rem 0.875rem" : "0 0.75rem 0.875rem" }}>
          <button
            onClick={() => {
              localStorage.clear();
              router.push("/login");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              borderRadius: 8,
              fontSize: 13.5,
              color: "#ef4444",
              background: "none",
              border: "none",
              cursor: "pointer",
              width: "100%",
              justifyContent: isCollapsed ? "center" : "flex-start",
            }}
            title={isCollapsed ? tx.logout : undefined}
          >
            <LogOut size={16} strokeWidth={1.8} />
            {!isCollapsed && <span>{tx.logout}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{
        flex: 1,
        marginLeft: isRTL ? 0 : (isCollapsed ? 72 : 240),
        marginRight: isRTL ? (isCollapsed ? 72 : 240) : 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "margin 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        <Navbar lang={lang} />
        <main style={{ flex: 1, overflow: "auto", padding: "1.5rem" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <StaffLayoutInner>{children}</StaffLayoutInner>
    </LanguageProvider>
  );
}