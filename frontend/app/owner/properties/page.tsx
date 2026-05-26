"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Home, MapPin, Bed, Bath, ArrowRight, Image as ImageIcon, 
  Calendar, TrendingUp, DollarSign, Percent, Users,
  Wallet, Award, AlertCircle, XCircle, BarChart3
} from "lucide-react";
import api from "@/lib/axios";
import { useLang } from "@/app/components/contexts/LanguageContext";

const labels = {
  fr: {
    breadcrumb:   "Accueil › Mes Propriétés",
    title:        "Mes Propriétés",
    subtitle:     "Gérez et suivez votre portefeuille immobilier",
    addProp:      "+ Ajouter une propriété",
    performance:  "Performance",
    occupancy:    "Taux d'occupation",
    avgNight:     "Prix moy./Nuit",
    netProfit:    "Bénéfice net",
    bookings:     "Réservations",
    stays:        "séjour(s)",
    lastStay:     "Dernier séjour",
    noData:       "Aucune donnée de réservation",
    viewDetails:  "Voir les détails",
    noImage:      "Pas d'image",
    bed:          "lit",
    beds:         "lits",
    bath:         "salle de bain",
    baths:        "salles de bain",
    noPropTitle:  "Aucune propriété trouvée",
    noPropSub:    "Ajoutez votre première propriété pour commencer",
    loading:      "Chargement...",
    ratings: {
      excellent:   "Excellent",
      good:        "Bien",
      average:     "Moyen",
      needsImprov: "À améliorer",
    },
  },
  ar: {
    breadcrumb:   "الرئيسية › عقاراتي",
    title:        "عقاراتي",
    subtitle:     "تتبع وإدارة محفظتك العقارية",
    addProp:      "+ إضافة عقار",
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
  const [loadingMetrics, setLoadingMetrics]   = useState<{ [key: number]: boolean }>({});
  const [imageErrors, setImageErrors]         = useState<{ [key: number]: boolean }>({});

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
    }
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
        excellent:   "#16a34a",
        good:        "#2563eb",
        average:     "#ca8a04",
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
    return 'Property';
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');

    .op {
      --green:      #22c55e;
      --green-bg:   #f0fdf4;
      --green-text: #16a34a;
      --green-dim:  rgba(34,197,94,0.1);
      --ink:        #111827;
      --ink-2:      #374151;
      --ink-3:      #6b7280;
      --ink-4:      #9ca3af;
      --border:     #f3f4f6;
      --border-2:   #e5e7eb;
      --bg:         #f9fafb;
      --surface:    #ffffff;
      --f: ${isRTL ? "'Cairo'" : "'Geist'"}, system-ui, sans-serif;

      font-family: var(--f);
      direction: ${isRTL ? "rtl" : "ltr"};
      background:  var(--bg);
      min-height:  100vh;
      padding:     2rem;
      color:       var(--ink);
    }

    .op-header {
      display: flex; justify-content: space-between;
      align-items: flex-start; margin-bottom: 2rem;
    }
    .op-breadcrumb { font-size: 13px; color: var(--ink-4); margin-bottom: 4px; }
    .op-title    { font-size: 22px; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; }
    .op-subtitle { font-size: 13px; color: var(--ink-3); margin-top: 4px; }

    .op-btn-primary {
      display: flex; align-items: center; gap: 7px;
      padding: 9px 16px; border-radius: 10px;
      border: none; background: var(--green);
      color: #fff; font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: var(--f);
      box-shadow: 0 2px 8px rgba(34,197,94,0.25);
      transition: opacity 0.12s;
    }
    .op-btn-primary:hover { opacity: 0.88; }

    .op-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.25rem;
    }

    .op-card {
      background: var(--surface);
      border: 1px solid var(--border-2);
      border-radius: 16px; overflow: hidden;
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .op-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.08); transform: translateY(-2px); }

    .op-img-wrap {
      position: relative; height: 192px; overflow: hidden;
      background: var(--green-bg);
    }
    .op-img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
    .op-card:hover .op-img-wrap img { transform: scale(1.04); }

    .op-placeholder {
      width: 100%; height: 100%;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 6px;
    }

    .op-badge-type {
      position: absolute; bottom: 10px; ${isRTL ? "right:10px" : "left:10px"};
      background: rgba(0,0,0,0.45); backdrop-filter: blur(4px);
      color: #fff; font-size: 11px; font-weight: 500;
      padding: 3px 10px; border-radius: 999px;
    }
    .op-badge-rating {
      position: absolute; bottom: 10px; ${isRTL ? "left:10px" : "right:10px"};
      background: rgba(255,255,255,0.92); backdrop-filter: blur(4px);
      font-size: 11px; font-weight: 600;
      padding: 3px 9px; border-radius: 999px;
      display: flex; align-items: center; gap: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }

    .op-body { padding: 1.25rem; }

    .op-name {
      font-size: 16px; font-weight: 700; color: var(--ink); margin-bottom: 4px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .op-location {
      display: flex; align-items: center; gap: 4px;
      font-size: 13px; color: var(--ink-4); margin-bottom: 10px;
      ${isRTL ? "flex-direction: row-reverse; justify-content: flex-end" : ""};
    }
    .op-specs {
      display: flex; align-items: center; gap: 14px;
      font-size: 12px; color: var(--ink-4); margin-bottom: 14px;
      ${isRTL ? "flex-direction: row-reverse; justify-content: flex-end" : ""};
    }
    .op-spec { display: flex; align-items: center; gap: 4px; }

    .op-perf {
      background: var(--bg); border-radius: 10px;
      padding: 10px 12px; margin-bottom: 14px;
    }
    .op-perf-title {
      display: flex; align-items: center; gap: 5px;
      font-size: 11px; font-weight: 600; color: var(--ink-2); margin-bottom: 8px;
      ${isRTL ? "flex-direction: row-reverse" : ""};
    }
    .op-perf-row {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 6px;
    }
    .op-perf-row:last-child { margin-bottom: 0; }
    .op-perf-label {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; color: var(--ink-4);
      ${isRTL ? "flex-direction: row-reverse" : ""};
    }
    .op-perf-val { font-size: 13px; font-weight: 600; color: var(--ink); }
    .op-perf-val.green { color: var(--green-text); }
    .op-perf-divider { border-top: 1px solid var(--border-2); padding-top: 6px; margin-top: 6px; }

    .op-skel { height: 12px; border-radius: 6px; background: var(--border-2); }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
    .op-skel { animation: pulse 1.5s ease-in-out infinite; }

    .op-actions { display: flex; gap: 8px; }
    .op-btn-details {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
      background: var(--green); color: #fff;
      border: none; border-radius: 10px;
      padding: 10px; font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: var(--f); transition: opacity 0.12s;
    }
    .op-btn-details:hover { opacity: 0.88; }
    .op-btn-chart {
      display: flex; align-items: center; justify-content: center;
      border: 1px solid var(--border-2); background: var(--surface);
      color: var(--green-text); border-radius: 10px;
      padding: 10px 13px; cursor: pointer;
      transition: background 0.12s, border-color 0.12s;
    }
    .op-btn-chart:hover { background: var(--green-bg); border-color: var(--green); }

    .op-empty {
      background: var(--surface); border: 1px solid var(--border-2);
      border-radius: 16px; padding: 5rem 2rem; text-align: center;
    }
    .op-empty-title { font-size: 16px; font-weight: 600; color: var(--ink); margin: 1rem 0 6px; }
    .op-empty-sub   { font-size: 13px; color: var(--ink-4); margin-bottom: 1.5rem; }

    .op-card-skel {
      background: var(--surface); border: 1px solid var(--border-2);
      border-radius: 16px; overflow: hidden;
    }
    .op-card-skel-img  { height: 192px; background: var(--border); animation: pulse 1.5s infinite; }
    .op-card-skel-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 10px; }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="op">

        {/* Header */}
        <div className="op-header">
          <div>
            <div className="op-breadcrumb">{tx.breadcrumb}</div>
            <h1 className="op-title">{tx.title}</h1>
            <p className="op-subtitle">{tx.subtitle}</p>
          </div>
          <button className="op-btn-primary" onClick={() => router.push("/owner/properties/add")}>
            {tx.addProp}
          </button>
        </div>

        {loading ? (
          <div className="op-grid">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="op-card-skel">
                <div className="op-card-skel-img" />
                <div className="op-card-skel-body">
                  <div className="op-skel" style={{ width: "70%" }} />
                  <div className="op-skel" style={{ width: "45%" }} />
                  <div className="op-skel" style={{ width: "100%", height: 80 }} />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="op-empty">
            <Home size={56} color="var(--border-2)" style={{ margin: "0 auto" }} />
            <div className="op-empty-title">{tx.noPropTitle}</div>
            <div className="op-empty-sub">{tx.noPropSub}</div>
            <button className="op-btn-primary" style={{ margin: "0 auto" }}
              onClick={() => router.push("/owner/properties/add")}>
              {tx.addProp}
            </button>
          </div>
        ) : (
          <div className="op-grid">
            {properties.map((p) => {
              const mainImageUrl    = getMainImageUrl(p);
              const hasImageError   = imageErrors[p.id];
              const showPlaceholder = !mainImageUrl || hasImageError;
              const metrics         = performanceData[p.id];
              const isLoadingM      = loadingMetrics[p.id];
              const typeDisplay     = getPropertyTypeDisplay(p);

              const occColor = metrics
                ? metrics.occupancyRate >= 50 ? "#16a34a"
                  : metrics.occupancyRate >= 30 ? "#ca8a04"
                  : "#ef4444"
                : "var(--ink)";

              const ratingText = metrics
                ? tx.ratings[metrics.rating.text as keyof typeof tx.ratings]
                : "";

              return (
                <div key={p.id} className="op-card">
                  {/* Image */}
                  <div className="op-img-wrap">
                    {!showPlaceholder ? (
                      <img src={mainImageUrl!} alt={p.name}
                        onError={() => handleImageError(p.id)} />
                    ) : (
                      <div className="op-placeholder">
                        <ImageIcon size={40} color="rgba(34,197,94,0.3)" />
                        <span style={{ fontSize: 11, color: "rgba(34,197,94,0.5)" }}>{tx.noImage}</span>
                      </div>
                    )}
                    <span className="op-badge-type">{typeDisplay}</span>
                    {metrics && !isLoadingM && (
                      <div className="op-badge-rating" style={{ color: metrics.rating.color }}>
                        <metrics.rating.icon size={11} />
                        {ratingText}
                      </div>
                    )}
                  </div>

                  <div className="op-body">
                    <div className="op-name">{p.name}</div>
                    <div className="op-location">
                      <MapPin size={12} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.location}
                      </span>
                    </div>
                    <div className="op-specs">
                      <span className="op-spec">
                        <Bed size={13} /> {p.bedrooms} {p.bedrooms === 1 ? tx.bed : tx.beds}
                      </span>
                      <span className="op-spec">
                        <Bath size={13} /> {p.bathrooms} {p.bathrooms === 1 ? tx.bath : tx.baths}
                      </span>
                      {p.area_sqm && <span className="op-spec"><Home size={13} /> {p.area_sqm} m²</span>}
                    </div>

                    <div className="op-perf">
                      <div className="op-perf-title">
                        <BarChart3 size={13} color="var(--green-text)" />
                        {tx.performance}
                      </div>

                      {isLoadingM ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div className="op-skel" />
                          <div className="op-skel" style={{ width: "65%" }} />
                        </div>
                      ) : metrics ? (
                        <>
                          <div className="op-perf-row">
                            <span className="op-perf-label"><Percent size={12} />{tx.occupancy}</span>
                            <span className="op-perf-val" style={{ color: occColor }}>
                              {toNum(metrics.occupancyRate).toFixed(0)}%
                            </span>
                          </div>
                          <div className="op-perf-row">
                            <span className="op-perf-label"><DollarSign size={12} />{tx.avgNight}</span>
                            <span className="op-perf-val">
                              {metrics.totalNights > 0
                                ? Math.round(metrics.avgPricePerNight).toLocaleString()
                                : "—"} MAD
                            </span>
                          </div>
                          <div className="op-perf-row">
                            <span className="op-perf-label"><Wallet size={12} />{tx.netProfit}</span>
                            <span className="op-perf-val green">
                              {Math.round(toNum(metrics.netProfit)).toLocaleString()} MAD
                            </span>
                          </div>
                          <div className="op-perf-row">
                            <span className="op-perf-label"><Users size={12} />{tx.bookings}</span>
                            <span className="op-perf-val">{metrics.totalBookings} {tx.stays}</span>
                          </div>
                          {metrics.lastBookingDate && (
                            <div className="op-perf-row op-perf-divider">
                              <span className="op-perf-label" style={{ fontSize: 11 }}>
                                <Calendar size={10} />{tx.lastStay}
                              </span>
                              <span style={{ fontSize: 11, color: "var(--ink-4)" }}>
                                {metrics.lastBookingDate}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ textAlign: "center", padding: "8px 0", fontSize: 12, color: "var(--ink-4)" }}>
                          {tx.noData}
                        </div>
                      )}
                    </div>

                    <div className="op-actions">
                      <button className="op-btn-details"
                        onClick={() => router.push(`/owner/properties/${p.id}`)}>
                        {tx.viewDetails} <ArrowRight size={14} />
                      </button>
                      <button className="op-btn-chart"
                        onClick={() => router.push(`/owner/properties/${p.id}/performance`)}>
                        <BarChart3 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}