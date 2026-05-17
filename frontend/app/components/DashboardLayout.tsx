"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  lang?: "fr" | "ar";
}

export default function DashboardLayout({ children, lang = "fr" }: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isRTL = lang === "ar";

  return (
    <>
      <style>{`
        .dashboard-layout {
          display: flex;
          min-height: 100vh;
        }

        .main-content {
          flex: 1;
          transition: margin-${isRTL ? "right" : "left"} 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-${isRTL ? "right" : "left"}: ${isSidebarCollapsed ? "72px" : "240px"};
          width: calc(100% - ${isSidebarCollapsed ? "72px" : "240px"});
          overflow-x: auto;
        }

        @media (max-width: 768px) {
          .main-content {
            margin-${isRTL ? "right" : "left"}: ${isSidebarCollapsed ? "0" : "240px"};
          }
        }
      `}</style>
      <div className="dashboard-layout">
        <Sidebar lang={lang} onCollapseChange={setIsSidebarCollapsed} />
        <main className="main-content">
          {children}
        </main>
      </div>
    </>
  );
}