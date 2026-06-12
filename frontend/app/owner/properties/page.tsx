"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Home, MapPin, Bed, Bath, ArrowRight, Image as ImageIcon, 
  Calendar, TrendingUp, DollarSign, Percent, Users,
  Wallet, Award, AlertCircle, XCircle, BarChart3, Plus,
  LayoutGrid, Rows, RefreshCw, Building2, Eye
} from "lucide-react";
import api from "@/lib/axios";
import { useLang } from "@/app/components/contexts/LanguageContext";

const labels = {
  fr: {
    title:        "Mes Propriétés",
    refresh:      "Actualiser",
    grid:         "Grille",
    table:        "Liste",
    performance:  "Performance",
    occupancy:    "Taux d'occupation",
    avgNight:     "Prix moy./Nuit",
    netProfit:    "Bénéfice net",
    bookings:     "Réservations",
    stays:        "séjour(s)",
    lastStay:     "Dernier séjour",
    noData:       "Aucune donnée de réservation",
    viewDetails:  "Voir détails",
    noImage:      "Pas d'image",
    bed:          "lit",
    beds:         "lits",
    bath:         "sdb",
    baths:        "sdbs",
    noPropTitle:  "Aucune propriété trouvée",
    noPropSub:    "Ajoutez votre première propriété pour commencer",
    loading:      "Chargement...",
    ratings: {
      excellent:   "Excellent",
      good:        "Bien",
      average:     "Moyen",
      needsImprov: "À améliorer",
    },
    tableHeaders: {
      property: "Bien",
      location: "Emplacement",
      type: "Type",
      specs: "Ch./Sdb",
      occupancy: "Occupation",
      rent: "Loyer",
      actions: "Actions"
    }
  },
  ar: {
    title:        "عقاراتي",
    refresh:      "تحديث",
    grid:         "شبكة",
    table:        "قائمة",
    performance:  "الأداء",
    occupancy:    "نسبة الإشغال",
    avgNight:     "متوسط/ليلة",
    netProfit:    "صافي الربح",
    bookings:     "الحجوزات",
    stays:        "إقامة",
    lastStay:     "آخر إقامة",
    noData:       "لا توجد بيانات حجز",
    viewDetails:  "عرض التفاصيل",
    noImage:      "لا توجد صورة",
    bed:          "غرفة",
    beds:         "غرف",
    bath:         "حمام",
    baths:        "حمامات",
    noPropTitle:  "لا توجد عقارات",
    noPropSub:    "أضف عقارك الأول للبدء",
    loading:      "جارٍ التحميل...",
    ratings: {
      excellent:   "ممتاز",
      good:        "جيد",
      average:     "متوسط",
      needsImprov: "يحتاج تحسين",
    },
    tableHeaders: {
      property: "العقار",
      location: "الموقع",
      type: "النوع",
      specs: "غرف/حمامات",
      occupancy: "الإشغال",
      rent: "الإيجار",
      actions: "إجراءات"
    }
  },
} as const;

const toNum = (v: any): number => {
  if (v === null || v === undefined || v === "") return 0;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return isFinite(n) ? n : 0;
};

interface PropertyImage {
  id: number;
  image: string;
  image_url: string;
  is_main: boolean;
}

interface Property {
  id: number;
  name: string;
  location: string;
  property_type: string;
  property_type_display: string;
  status: string;
  status_display: string;
  bedrooms: number;
  bathrooms: number;
  living_rooms: number;
  monthly_rent: string;
  area_sqm: string;
  description: string;
  images: PropertyImage[];
  images_urls: string[];
}

interface Booking {
  id: number;
  guest_name: string;
  booking_source: string;
  nights: number;
  price_per_night: number;
  revenue: number;
  commission: number;
  net_profit: number;
  check_in: string;
  check_out: string;
  month: number;
  year: number;
  month_display: string;
}

interface PerformanceMetrics {
  totalBookings: number;
  totalNights: number;
  totalRevenue: number;
  totalPayout: number;
  avgPricePerNight: number;
  occupancyRate: number;
  netProfit: number;
  profitMargin: number;
  lastBookingDate: string | null;
  rating: { text: string; color: string; icon: any };
}

export default function OwnerPropertiesPage() {
  const router = useRouter();
  const { lang } = useLang();                        
  const tx    = labels[lang];
  const isRTL = lang === "ar";

  const [properties, setProperties]           = useState<Property[]>([]);
  const [performanceData, setPerformanceData] = useState<{ [key: number]: PerformanceMetrics }>({});
  const [loading, setLoading]                 = useState(true);
  const [refreshing, setRefreshing]           = useState(false);
  const [loadingMetrics, setLoadingMetrics]   = useState<{ [key: number]: boolean }>({});
  const [imageErrors, setImageErrors]         = useState<{ [key: number]: boolean }>({});
  const [viewMode, setViewMode]               = useState<"grid" | "table">("grid");

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) router.push("/login");
  }, [router]);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await api.get("/api/properties/");
      const data = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      setProperties(data);
      for (const prop of data) await fetchPerformanceMetrics(prop.id);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchProperties();
  };

  const fetchPerformanceMetrics = async (propertyId: number) => {
    setLoadingMetrics(prev => ({ ...prev, [propertyId]: true }));
    try {
      const finRes  = await api.get(`/api/financials/monthly-summary/${propertyId}/?year=${currentYear}`);
      const bookings: Booking[] = finRes.data || [];

      let occupancyRate = 0;
      try {
        const occRes = await api.get(`/api/financials/property-occupancy/${propertyId}/?year=${currentYear}`);
        occupancyRate = toNum(occRes.data?.occupancy_rate);
      } catch {
        const totalNights = bookings.reduce((sum, b) => sum + toNum(b.nights), 0);
        occupancyRate = (totalNights / 365) * 100;
      }

      const totalBookings    = bookings.length;
      const totalNights      = bookings.reduce((sum, b) => sum + toNum(b.nights), 0);
      const totalRevenue     = bookings.reduce((sum, b) => sum + toNum(b.revenue), 0);
      const totalPayout      = bookings.reduce((sum, b) => sum + toNum(b.net_profit), 0);

      const avgPricePerNight = totalNights > 0 ? totalRevenue / totalNights : 0;

      const netProfit    = totalPayout;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      let lastBookingDate: string | null = null;
      if (bookings.length > 0) {
        const lastBooking = [...bookings].sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        })[0];
        lastBookingDate = `${lastBooking.month_display || `Month ${lastBooking.month}`} ${lastBooking.year}`;
      }

      const getRatingKey = (rate: number): "excellent" | "good" | "average" | "needsImprov" => {
        if (rate >= 70) return "excellent";
        if (rate >= 50) return "good";
        if (rate >= 30) return "average";
        return "needsImprov";
      };
      const ratingColorMap = {
        excellent:   "#10b981",
        good:        "#3b82f6",
        average:     "#f59e0b",
        needsImprov: "#ef4444",
      };
      const ratingIconMap = {
        excellent:   Award,
        good:        TrendingUp,
        average:     AlertCircle,
        needsImprov: XCircle,
      };
      const rk = getRatingKey(occupancyRate);

      setPerformanceData(prev => ({
        ...prev,
        [propertyId]: {
          totalBookings, totalNights, totalRevenue, totalPayout,
          avgPricePerNight, occupancyRate, netProfit, profitMargin,
          lastBookingDate,
          rating: {
            text:  rk,
            color: ratingColorMap[rk],
            icon:  ratingIconMap[rk],
          },
        },
      }));
    } catch (err) {
      console.error(`Error fetching metrics for property ${propertyId}:`, err);
    } finally {
      setLoadingMetrics(prev => ({ ...prev, [propertyId]: false }));
    }
  };

  const getMainImageUrl = (property: Property): string | null => {
    if (property.images_urls && property.images_urls.length > 0) return property.images_urls[0];
    if (property.images && property.images.length > 0) {
      const mainImage = property.images.find(img => img.is_main) || property.images[0];
      if (mainImage.image_url) return mainImage.image_url;
      if (mainImage.image) {
        if (mainImage.image.startsWith('/')) return `http://127.0.0.1:8000${mainImage.image}`;
        if (!mainImage.image.startsWith('http')) return `http://127.0.0.1:8000/${mainImage.image}`;
        return mainImage.image;
      }
    }
    return null;
  };

  const handleImageError = (propertyId: number) =>
    setImageErrors(prev => ({ ...prev, [propertyId]: true }));

  const getPropertyTypeDisplay = (property: Property) => {
    if (property.property_type_display && property.property_type_display !== 'Other')
      return property.property_type_display;
    if (property.property_type && property.property_type !== 'other')
      return property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1);
    return 'Propriété';
  };

  const getOccupancyColor = (rate: number = 0) => {
    if (rate >= 75) return "text-[#10b981]";
    if (rate >= 50) return "text-[#f59e0b]";
    if (rate >= 25) return "text-[#f97316]";
    return "text-[#ef4444]";
  };

  const getOccupancyBarColor = (rate: number = 0) => {
    if (rate >= 75) return "bg-[#10b981]";
    if (rate >= 50) return "bg-[#f59e0b]";
    if (rate >= 25) return "bg-[#f97316]";
    return "bg-[#ef4444]";
  };

  if (loading && properties.length === 0) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22c55e] mx-auto mb-3" />
          <p className="text-[#6b7280] text-sm">{tx.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]" dir={isRTL ? "rtl" : "ltr"}>
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Header with Title and Actions */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">{tx.title}</h1>
          <div className="flex items-center gap-2">
            {/* View Toggle Buttons */}
            <div className="flex items-center gap-1 bg-white border border-[#e5e7eb] rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === "grid" 
                    ? "bg-[#22c55e] text-white" 
                    : "text-[#64748b] hover:bg-[#f8fafc]"
                }`}
              >
                <LayoutGrid size={14} />
                {tx.grid}
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === "table" 
                    ? "bg-[#22c55e] text-white" 
                    : "text-[#64748b] hover:bg-[#f8fafc]"
                }`}
              >
                <Rows size={14} />
                {tx.table}
              </button>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="flex items-center gap-1.5 bg-white border border-[#e5e7eb] text-[#374151] px-3 py-2 rounded-lg text-xs font-semibold hover:bg-[#f8fafc] transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              {tx.refresh}
            </button>
          </div>
        </div>

        {/* Properties Grid View */}
        {viewMode === "grid" && (
          properties.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-12 text-center">
              <Home size={56} className="text-[#d1d5db] mx-auto mb-4" />
              <div className="text-base font-semibold text-[#111827] mb-1">{tx.noPropTitle}</div>
              <div className="text-sm text-[#6b7280] mb-4">{tx.noPropSub}</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {properties.map((p) => {
                const mainImageUrl    = getMainImageUrl(p);
                const hasImageError   = imageErrors[p.id];
                const showPlaceholder = !mainImageUrl || hasImageError;
                const metrics         = performanceData[p.id];
                const isLoadingM      = loadingMetrics[p.id];
                const typeDisplay     = getPropertyTypeDisplay(p);
                const occupancyRate   = metrics?.occupancyRate || 0;

                return (
                  <div 
                    key={p.id} 
                    className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden hover:shadow-md transition-all duration-200 group"
                  >
                    {/* Image Section */}
                    <div className="relative h-48 overflow-hidden bg-[#f0fdf4]">
                      {!showPlaceholder ? (
                        <img 
                          src={mainImageUrl!} 
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={() => handleImageError(p.id)} 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                          <ImageIcon size={40} className="text-[#22c55e]/30" />
                          <span className="text-xs text-[#22c55e]/50">{tx.noImage}</span>
                        </div>
                      )}
                      
                      {/* Property Type Badge */}
                      <span className="absolute bottom-3 left-3 bg-black/45 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
                        {typeDisplay}
                      </span>
                    </div>

                    {/* Content Section */}
                    <div className="p-4">
                      <h3 className="font-bold text-[#111827] text-base truncate">{p.name}</h3>
                      
                      <div className="flex items-center gap-1 text-[#9ca3af] text-xs mt-1 mb-3">
                        <MapPin size={12} />
                        <span className="truncate">{p.location}</span>
                      </div>

                      {/* Specifications */}
                      <div className="flex items-center gap-3 text-[#6b7280] text-xs mb-4">
                        <span className="flex items-center gap-1">
                          <Bed size={12} /> {p.bedrooms} {p.bedrooms === 1 ? tx.bed : tx.beds}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath size={12} /> {p.bathrooms} {p.bathrooms === 1 ? tx.bath : tx.baths}
                        </span>
                        {p.area_sqm && (
                          <span className="flex items-center gap-1">
                            <Home size={12} /> {p.area_sqm} m²
                          </span>
                        )}
                      </div>

                      {/* Performance Section */}
                      <div className="bg-[#f9fafb] rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <BarChart3 size={12} className="text-[#22c55e]" />
                          <span className="text-[11px] font-semibold text-[#374151]">{tx.performance}</span>
                        </div>

                        {isLoadingM ? (
                          <div className="space-y-2">
                            <div className="h-2 bg-[#e5e7eb] rounded animate-pulse" />
                            <div className="h-2 bg-[#e5e7eb] rounded w-2/3 animate-pulse" />
                          </div>
                        ) : metrics ? (
                          <>
                            <div className="mb-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="flex items-center gap-1 text-[#6b7280]">
                                  <Percent size={10} /> {tx.occupancy}
                                </span>
                                <span className={`font-semibold ${getOccupancyColor(occupancyRate)}`}>
                                  {Math.round(occupancyRate)}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-[#e5e7eb] rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${getOccupancyBarColor(occupancyRate)}`}
                                  style={{ width: `${Math.min(100, occupancyRate)}%` }}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="flex items-center gap-1 text-[#6b7280] mb-0.5">
                                  <DollarSign size={10} /> {tx.avgNight}
                                </span>
                                <span className="font-semibold text-[#111827]">
                                  {metrics.totalNights > 0 ? Math.round(metrics.avgPricePerNight).toLocaleString() : "—"} MAD
                                </span>
                              </div>
                              <div>
                                <span className="flex items-center gap-1 text-[#6b7280] mb-0.5">
                                  <Wallet size={10} /> {tx.netProfit}
                                </span>
                                <span className="font-semibold text-[#16a34a]">
                                  {Math.round(metrics.netProfit).toLocaleString()} MAD
                                </span>
                              </div>
                              <div>
                                <span className="flex items-center gap-1 text-[#6b7280] mb-0.5">
                                  <Users size={10} /> {tx.bookings}
                                </span>
                                <span className="font-semibold text-[#111827]">
                                  {metrics.totalBookings} {tx.stays}
                                </span>
                              </div>
                              {metrics.lastBookingDate && (
                                <div>
                                  <span className="flex items-center gap-1 text-[#6b7280] mb-0.5">
                                    <Calendar size={10} /> {tx.lastStay}
                                  </span>
                                  <span className="text-[#6b7280] text-[10px]">
                                    {metrics.lastBookingDate}
                                  </span>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-3 text-xs text-[#9ca3af]">
                            {tx.noData}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button 
                          onClick={() => router.push(`/owner/properties/${p.id}`)}
                          className="flex-1 flex items-center justify-center gap-2 bg-[#22c55e] text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-[#16a34a] transition-all"
                        >
                          {tx.viewDetails} <ArrowRight size={14} />
                        </button>
                        <button 
                          onClick={() => router.push(`/owner/properties/${p.id}/performance`)}
                          className="flex items-center justify-center gap-2 border border-[#e5e7eb] bg-white text-[#16a34a] px-3 py-2 rounded-lg hover:bg-[#f0fdf4] transition-all"
                        >
                          <BarChart3 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Properties Table View */}
        {viewMode === "table" && (
          properties.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-12 text-center">
              <Home size={56} className="text-[#d1d5db] mx-auto mb-4" />
              <div className="text-base font-semibold text-[#111827] mb-1">{tx.noPropTitle}</div>
              <div className="text-sm text-[#6b7280] mb-4">{tx.noPropSub}</div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                      <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">{tx.tableHeaders.property}</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider hidden md:table-cell">{tx.tableHeaders.location}</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider hidden sm:table-cell">{tx.tableHeaders.type}</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider hidden lg:table-cell">{tx.tableHeaders.specs}</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">{tx.tableHeaders.occupancy}</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">{tx.tableHeaders.rent}</th>
                      <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">{tx.tableHeaders.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {properties.map((p) => {
                      const metrics = performanceData[p.id];
                      const occupancyRate = metrics?.occupancyRate || 0;
                      const mainImageUrl = getMainImageUrl(p);
                      
                      return (
                        <tr key={p.id} className="hover:bg-[#f8fafc] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-[#f0fdf4] flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {mainImageUrl && !imageErrors[p.id] ? (
                                  <img 
                                    src={mainImageUrl} 
                                    alt={p.name} 
                                    className="w-8 h-8 object-cover"
                                    onError={() => handleImageError(p.id)}
                                  />
                                ) : (
                                  <Building2 size={14} className="text-[#94a3b8]" />
                                )}
                              </div>
                              <span className="font-semibold text-[#111827] text-[13px] truncate max-w-[140px]">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <div className="flex items-center gap-1 text-[12px] text-[#6b7280]">
                              <MapPin size={12} /><span className="truncate max-w-[100px]">{p.location}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="text-[11px] bg-[#f1f5f9] px-2 py-0.5 rounded text-[#64748b] font-medium">{getPropertyTypeDisplay(p)}</span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <div className="flex items-center gap-1.5 text-[12px] text-[#6b7280]">
                              <Bed size={12} /> {p.bedrooms}
                              <Bath size={12} /> {p.bathrooms}
                            </div>
                           </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-14 h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${getOccupancyBarColor(occupancyRate)}`} style={{ width: `${Math.min(100, occupancyRate)}%` }} />
                              </div>
                              <span className={`text-[12px] font-semibold ${getOccupancyColor(occupancyRate)}`}>{Math.round(occupancyRate)}%</span>
                            </div>
                           </td>
                          <td className="px-4 py-3">
                            <span className="text-[13px] font-bold text-[#111827]">{Number(p.monthly_rent).toLocaleString()} MAD</span>
                           </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => router.push(`/owner/properties/${p.id}`)}
                                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f0fdf4] text-[#6b7280] hover:text-[#22c55e] transition-colors"
                              >
                                <Eye size={13} />
                              </button>
                              <button 
                                onClick={() => router.push(`/owner/properties/${p.id}/performance`)}
                                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f0fdf4] text-[#6b7280] hover:text-[#22c55e] transition-colors"
                              >
                                <BarChart3 size={13} />
                              </button>
                            </div>
                           </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}