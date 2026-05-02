"use client";

import { useEffect, useState, useRef } from "react";
import { Search, Bell, ChevronDown, Home, Users, Building2, DollarSign, X } from "lucide-react";
import { useRouter } from "next/navigation";
import api, { getCurrentUser } from "@/lib/axios";

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
}

interface SearchResult {
  id: number;
  title: string;
  subtitle: string;
  type: "property" | "owner" | "revenue";
  href: string;
  icon: React.ReactNode;
}

interface Notification {
  id: number;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "warning" | "success";
}


const staticNotifications: Notification[] = [
  { id: 1, message: "New booking added for Medina Casa", time: "2 min ago", read: false, type: "success" },
  { id: 2, message: "Expense record updated", time: "1 hour ago", read: false, type: "info" },
  { id: 3, message: "Monthly report is ready", time: "3 hours ago", read: true, type: "info" },
  { id: 4, message: "Owner payout due this week", time: "1 day ago", read: true, type: "warning" },
];

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<Notification[]>(staticNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getCurrentUser();
      setUser(userData);
      setLoading(false);
    };
    fetchUser();
  }, []);

  
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const q = searchQuery.toLowerCase();
    setSearchLoading(true);
    setShowSearchResults(true);

    const timer = setTimeout(async () => {
      try {
        const results: SearchResult[] = [];

        // Search properties
        const propsRes = await api.get("/api/properties/");
        const props = Array.isArray(propsRes.data) ? propsRes.data : propsRes.data.results ?? [];
        props
          .filter((p: any) =>
            p.name?.toLowerCase().includes(q) ||
            p.location?.toLowerCase().includes(q)
          )
          .slice(0, 3)
          .forEach((p: any) => {
            results.push({
              id: p.id,
              title: p.name,
              subtitle: p.location || "Property",
              type: "property",
              href: `/dashboard/properties/${p.id}`,
              icon: <Home size={16} className="text-purple-600" />,
            });
          });

        // Search owners
        const ownersRes = await api.get("/api/owners/");
        const owners = Array.isArray(ownersRes.data) ? ownersRes.data : ownersRes.data.results ?? [];
        owners
          .filter((o: any) =>
            o.full_name?.toLowerCase().includes(q) ||
            o.email?.toLowerCase().includes(q)
          )
          .slice(0, 3)
          .forEach((o: any) => {
            results.push({
              id: o.id,
              title: o.full_name,
              subtitle: o.email || "Owner",
              type: "owner",
              href: `/dashboard/owners`,
              icon: <Users size={16} className="text-blue-600" />,
            });
          });

        setSearchResults(results);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 400); 

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleResultClick = (href: string) => {
    router.push(href);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markOneRead = (id: number) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const getInitials = () => {
    if (!user) return "AU";
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    return user.email.charAt(0).toUpperCase();
  };

  const getDisplayName = () => {
    if (!user) return "Admin User";
    if (user.full_name && user.full_name.trim() !== "") return user.full_name;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    return user.email.split('@')[0];
  };

  const notifColor = (type: string) => {
    switch (type) {
      case "success": return "bg-green-100 text-green-600";
      case "warning": return "bg-orange-100 text-orange-600";
      default: return "bg-blue-100 text-blue-600";
    }
  };

  if (loading) {
    return (
      <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10">
        <div className="relative w-96">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search properties, owners, records..."
            className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none"
            disabled
          />
        </div>
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </header>
    );
  }

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40">

      {/* Search Bar */}
      <div className="relative w-96" ref={searchRef}>
        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 z-10">
          {searchLoading
            ? <div className="w-4 h-4 border-2 border-[#581c87] border-t-transparent rounded-full animate-spin" />
            : <Search size={18} />
          }
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery && setShowSearchResults(true)}
          placeholder="Search properties, owners, records..."
          className="w-full bg-gray-50 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#581c87]/20 focus:border-[#581c87] transition-all outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(""); setShowSearchResults(false); }}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}

        {/* Search Results Dropdown */}
        {showSearchResults && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
            {searchLoading ? (
              <div className="p-4 text-center text-sm text-gray-400">Searching...</div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">
                No results for "<span className="font-medium text-gray-600">{searchQuery}</span>"
              </div>
            ) : (
              <>
                <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                  Results ({searchResults.length})
                </div>
                {searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result.href)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      result.type === "property" ? "bg-purple-50" :
                      result.type === "owner" ? "bg-blue-50" : "bg-green-50"
                    }`}>
                      {result.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{result.title}</p>
                      <p className="text-xs text-gray-400 truncate">{result.subtitle}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      result.type === "property" ? "bg-purple-50 text-purple-600" :
                      result.type === "owner" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                    }`}>
                      {result.type}
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">

        {/* Bell / Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-all"
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-xs text-gray-400">{unreadCount} unread</p>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-[#581c87] font-semibold hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-400">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markOneRead(notif.id)}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${
                        notif.read ? "bg-white hover:bg-gray-50" : "bg-purple-50/40 hover:bg-purple-50"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${notifColor(notif.type)}`}>
                        <Bell size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${notif.read ? "text-gray-600" : "text-gray-900 font-semibold"}`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{notif.time}</p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 bg-[#581c87] rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-3 border-t border-gray-100 text-center">
                <button className="text-xs text-[#581c87] font-semibold hover:underline">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-100 cursor-pointer group">
          <div className="text-right">
            <p className="text-sm font-bold text-gray-800 group-hover:text-[#581c87] transition-colors">
              {getDisplayName()}
            </p>
            <p className="text-[11px] text-gray-400 font-medium">{user?.email || 'loading...'}</p>
          </div>
          <div className="w-10 h-10 bg-[#581c87] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
            {getInitials()}
          </div>
          <ChevronDown size={16} className="text-gray-400" />
        </div>

      </div>
    </header>
  );
}
