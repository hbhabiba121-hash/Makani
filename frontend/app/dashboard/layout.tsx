"use client";

import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onCollapseChange={setIsSidebarCollapsed} />
      <div 
        className="flex-1 flex flex-col transition-all duration-300 ease-in-out"
        style={{ 
          marginLeft: isSidebarCollapsed ? "72px" : "240px",
          width: `calc(100% - ${isSidebarCollapsed ? "72px" : "240px"})`
        }}
      >
        <Navbar />
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}