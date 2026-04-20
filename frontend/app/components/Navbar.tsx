"use client";

import { Search, Bell, ChevronDown } from "lucide-react";

export default function Navbar() {
  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="relative w-96">
        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          placeholder="Search properties, owners, records..."
          className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#581c87]/20 transition-all outline-none"
        />
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-all">
          <Bell size={22} />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-gray-100 cursor-pointer group">
          <div className="text-right">
            <p className="text-sm font-bold text-gray-800 group-hover:text-[#581c87] transition-colors">Admin User</p>
            <p className="text-[11px] text-gray-400 font-medium">admin@makani.com</p>
          </div>
          <div className="w-10 h-10 bg-[#581c87] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
            AU
          </div>
          <ChevronDown size={16} className="text-gray-400" />
        </div>
      </div>
    </header>
  );
}