"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Home, 
  Users, 
  DollarSign, 
  TrendingUp, 
  FileText, 
  Settings, 
  LogOut 
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { name: "Properties", icon: Home, path: "/dashboard/properties" },
  { name: "Owners", icon: Users, path: "/dashboard/owners" },
  { name: "Revenue", icon: DollarSign, path: "/dashboard/revenue" },
  { name: "Expenses", icon: TrendingUp, path: "/dashboard/expenses" },
  { name: "Reports", icon: FileText, path: "/dashboard/reports" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0">
      {/* Logo Section */}
    <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#581c87] rounded-xl flex items-center justify-center shadow-lg">
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
              <path d="M9 22v-4h6v4"></path>
              <path d="M8 6h.01"></path>
              <path d="M16 6h.01"></path>
              <path d="M8 10h.01"></path>
              <path d="M16 10h.01"></path>
              <path d="M8 14h.01"></path>
              <path d="M16 14h.01"></path>
            </svg>
        </div>
        <span className="text-xl font-bold text-gray-800 tracking-tight">Makani</span>
    </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? "bg-[#581c87] text-white shadow-lg shadow-purple-100" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-[#581c87]"
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-50 space-y-1">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all"
        >
          <Settings size={20} />
          Settings
        </Link>
        <button
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
          onClick={() => console.log("Logout clicked")}
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}