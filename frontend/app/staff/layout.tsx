"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, ReceiptText, LogOut } from 'lucide-react';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', path: '/staff/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Properties', path: '/staff/properties', icon: <Building2 size={20} /> },
    { name: 'Financial Records', path: '/staff/records', icon: <ReceiptText size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col p-6 fixed h-full">
        <div className="mb-10 px-2">
          <h1 className="text-xl font-black text-[#9333ea] tracking-tight">MAKANI <span className="text-xs font-medium text-gray-400">STAFF</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                pathname === item.path 
                ? 'bg-purple-50 text-purple-600' 
                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto pt-6 border-t border-gray-50">
          <button 
            onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-400 font-bold hover:bg-red-50 rounded-2xl transition-all"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}