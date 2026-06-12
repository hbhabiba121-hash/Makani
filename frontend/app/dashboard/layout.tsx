// frontend/app/dashboard/layout.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { LanguageProvider, useLang } from "@/app/components/contexts/LanguageContext";

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { lang } = useLang();
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isRTL = lang === "ar";

  useEffect(() => {
    const token = localStorage.getItem("access");
    const role = localStorage.getItem("role");
    if (!token) {
      router.push("/login");
      return;
    }
    // Allow admin and staff to access dashboard
    if (role !== "admin" && role !== "staff") {
      router.push("/login");
      return;
    }
    setLoading(false);
  }, [router]);

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
      <Sidebar lang={lang} onCollapseChange={setSidebarCollapsed} />
      
      <div style={{
        flex: 1,
        marginLeft: isRTL ? 0 : (sidebarCollapsed ? 72 : 240),
        marginRight: isRTL ? (sidebarCollapsed ? 72 : 240) : 0,
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </LanguageProvider>
  );
}