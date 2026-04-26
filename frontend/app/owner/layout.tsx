"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Home, DollarSign, FileText, LogOut, Bell, Search } from "lucide-react";
import Link from "next/link";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("access");
    const role = localStorage.getItem("role");
    const userData = localStorage.getItem("user");

    if (!token || role !== "owner") {
      router.push("/login");
      return;
    }
    if (userData) setUser(JSON.parse(userData));
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const navItems = [
    { href: "/owner", label: "Dashboard", icon: LayoutDashboard },
    { href: "/owner/properties", label: "My Properties", icon: Home },
    { href: "/owner/earnings", label: "Earnings", icon: DollarSign },
    { href: "/owner/reports", label: "Reports", icon: FileText },
  ];

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "O";

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      {/* Sidebar - ديما كاين في كاع الصفحات */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col shadow-sm z-20">
        <div className="p-6 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#581c87] rounded-xl flex items-center justify-center text-white">
              <Home size={18} />
            </div>
            <span className="text-lg font-bold text-gray-900">Makani</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#581c87] text-white shadow-md shadow-purple-100"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar - الفوقاني نقي دبا (غير البحث والبروفايل) */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center z-10">
          
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search properties, reports..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-purple-500 transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell size={22} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#581c87] border-2 border-white rounded-full"></span>
            </button>

            <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{user?.full_name || "Owner"}</p>
                <p className="text-xs text-gray-400">Property Owner</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#581c87] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Content - هنا فين كيتعرض داكشي اللي في page.tsx */}
        <main className="flex-1 overflow-auto bg-[#f9fafb]">
          {children}
        </main>
      </div>
    </div>
  );
}