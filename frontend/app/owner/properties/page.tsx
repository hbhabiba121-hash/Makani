"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Home, MapPin, Bed, Bath, ArrowRight, Image as ImageIcon, 
  Calendar, TrendingUp, DollarSign, Percent, Users, Star,
  Wallet, TrendingDown, Award, AlertCircle, XCircle, BarChart3
} from "lucide-react";
import api from "@/lib/axios";

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
  const [properties, setProperties] = useState<Property[]>([]);
  const [performanceData, setPerformanceData] = useState<{ [key: number]: PerformanceMetrics }>({});
  const [loading, setLoading] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState<{ [key: number]: boolean }>({});
  const currentYear = new Date().getFullYear();
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({});

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
      
      // Fetch performance metrics for each property
      for (const prop of data) {
        await fetchPerformanceMetrics(prop.id);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceMetrics = async (propertyId: number) => {
    setLoadingMetrics(prev => ({ ...prev, [propertyId]: true }));
    try {
      // Get bookings for this property
      const finRes = await api.get(`/api/financials/monthly-summary/${propertyId}/?year=${currentYear}`);
      const bookings: Booking[] = finRes.data || [];
      
      // Get occupancy data
      let occupancyRate = 0;
      try {
        const occRes = await api.get(`/api/financials/property-occupancy/${propertyId}/?year=${currentYear}`);
        occupancyRate = occRes.data?.occupancy_rate || 0;
      } catch {
        // Calculate from bookings if occupancy API not available
        const totalNights = bookings.reduce((sum, b) => sum + (b.nights || 0), 0);
        occupancyRate = (totalNights / 365) * 100;
      }
      
      // Calculate metrics
      const totalBookings = bookings.length;
      const totalNights = bookings.reduce((sum, b) => sum + (b.nights || 0), 0);
      const totalRevenue = bookings.reduce((sum, b) => sum + (b.revenue || 0), 0);
      const totalPayout = bookings.reduce((sum, b) => sum + (b.net_profit || 0), 0);
      const avgPricePerNight = totalNights > 0 ? totalRevenue / totalNights : 0;
      const netProfit = totalPayout;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      
      // Last booking date
      let lastBookingDate = null;
      if (bookings.length > 0) {
        const lastBooking = bookings.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        })[0];
        lastBookingDate = `${lastBooking.month_display || `Month ${lastBooking.month}`} ${lastBooking.year}`;
      }
      
      // Rating based on occupancy
      const getRating = (rate: number) => {
        if (rate >= 70) return { text: "Excellent", color: "text-green-600", icon: Award };
        if (rate >= 50) return { text: "Good", color: "text-blue-600", icon: TrendingUp };
        if (rate >= 30) return { text: "Average", color: "text-yellow-600", icon: AlertCircle };
        return { text: "Needs Improvement", color: "text-red-500", icon: XCircle };
      };
      
      setPerformanceData(prev => ({
        ...prev,
        [propertyId]: {
          totalBookings,
          totalNights,
          totalRevenue,
          totalPayout,
          avgPricePerNight,
          occupancyRate,
          netProfit,
          profitMargin,
          lastBookingDate,
          rating: getRating(occupancyRate)
        }
      }));
    } catch (err) {
      console.error(`Error fetching metrics for property ${propertyId}:`, err);
    } finally {
      setLoadingMetrics(prev => ({ ...prev, [propertyId]: false }));
    }
  };

  const getMainImageUrl = (property: Property): string | null => {
    // Try images_urls first (full URLs from backend)
    if (property.images_urls && property.images_urls.length > 0) {
      return property.images_urls[0];
    }
    
    // Try images array with image_url
    if (property.images && property.images.length > 0) {
      const mainImage = property.images.find(img => img.is_main) || property.images[0];
      if (mainImage.image_url) {
        return mainImage.image_url;
      }
      if (mainImage.image) {
        // If relative path, construct full URL
        if (mainImage.image.startsWith('/')) {
          return `http://127.0.0.1:8000${mainImage.image}`;
        }
        if (!mainImage.image.startsWith('http')) {
          return `http://127.0.0.1:8000${mainImage.image.startsWith('/') ? '' : '/'}${mainImage.image}`;
        }
        return mainImage.image;
      }
    }
    
    return null;
  };

  const handleImageError = (propertyId: number) => {
    setImageErrors(prev => ({ ...prev, [propertyId]: true }));
  };

  // Get display property type (show actual type, not "Other")
  const getPropertyTypeDisplay = (property: Property) => {
    if (property.property_type_display && property.property_type_display !== 'Other') {
      return property.property_type_display;
    }
    // If it's "Other" or empty, show the actual property_type value
    if (property.property_type && property.property_type !== 'other') {
      return property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1);
    }
    return 'Property';
  };

  return (
    <div className="p-8 bg-[#f9fafb] min-h-screen">

      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-sm text-gray-400 mb-1">Home › My Properties</p>
          <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track your property portfolio performance</p>
        </div>
        <button 
          onClick={() => router.push("/owner/properties/add")}
          className="bg-[#581c87] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#4c1d95] transition-all"
        >
          + Add Property
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse border border-gray-100">
              <div className="h-52 bg-gray-100" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-8 bg-gray-100 rounded w-full mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Home size={64} className="mx-auto mb-4 text-gray-200" />
          <p className="text-lg font-medium text-gray-500">No properties found</p>
          <p className="text-sm text-gray-400 mt-1">Add your first property to get started</p>
          <button 
            onClick={() => router.push("/owner/properties/add")}
            className="mt-6 bg-[#581c87] text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-[#4c1d95]"
          >
            + Add Property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p) => {
            const mainImageUrl = getMainImageUrl(p);
            const hasImageError = imageErrors[p.id];
            const showPlaceholder = !mainImageUrl || hasImageError;
            const metrics = performanceData[p.id];
            const isLoadingMetrics = loadingMetrics[p.id];
            const propertyTypeDisplay = getPropertyTypeDisplay(p);

            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group">

                {/* Image Section */}
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-50 to-blue-50">
                  {!showPlaceholder ? (
                    <img 
                      src={mainImageUrl!}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={() => handleImageError(p.id)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon size={48} className="text-purple-200 mx-auto mb-2" />
                        <p className="text-xs text-purple-300">No image</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Property Type Badge - removed status badge */}
                  <span className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
                    {propertyTypeDisplay}
                  </span>

                  {/* Performance Rating Badge */}
                  {metrics && !isLoadingMetrics && (
                    <div className={`absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm shadow-sm`}>
                      {metrics.rating.icon && <metrics.rating.icon size={12} className={metrics.rating.color} />}
                      <span className={metrics.rating.color}>{metrics.rating.text}</span>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1">{p.name}</h3>

                  <div className="flex items-center gap-1 text-gray-400 text-sm mb-3">
                    <MapPin size={13} />
                    <span className="line-clamp-1">{p.location}</span>
                  </div>

                  <div className="flex items-center gap-4 text-gray-400 text-sm mb-4">
                    <span className="flex items-center gap-1">
                      <Bed size={14} /> {p.bedrooms} {p.bedrooms === 1 ? 'bed' : 'beds'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath size={14} /> {p.bathrooms} {p.bathrooms === 1 ? 'bath' : 'baths'}
                    </span>
                    {p.area_sqm && (
                      <span className="flex items-center gap-1">
                        <Home size={14} /> {p.area_sqm} m²
                      </span>
                    )}
                  </div>

                  {/* Performance Metrics Section */}
                  <div className="bg-gray-50 rounded-xl p-3 mb-4">
                    <div className="flex items-center gap-1 mb-2">
                      <BarChart3 size={14} className="text-[#581c87]" />
                      <span className="text-xs font-semibold text-gray-700">Performance</span>
                    </div>
                    
                    {isLoadingMetrics ? (
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                      </div>
                    ) : metrics ? (
                      <div className="space-y-2">
                        {/* Occupancy & Revenue */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <Percent size={12} className="text-gray-400" />
                            <span className="text-xs text-gray-500">Occupancy</span>
                          </div>
                          <span className={`text-sm font-bold ${metrics.occupancyRate >= 50 ? 'text-green-600' : metrics.occupancyRate >= 30 ? 'text-yellow-600' : 'text-red-500'}`}>
                            {metrics.occupancyRate.toFixed(0)}%
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <DollarSign size={12} className="text-gray-400" />
                            <span className="text-xs text-gray-500">Avg/Night</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {Math.round(metrics.avgPricePerNight).toLocaleString()} MAD
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <Wallet size={12} className="text-gray-400" />
                            <span className="text-xs text-gray-500">Net Profit</span>
                          </div>
                          <span className="text-sm font-bold text-[#581c87]">
                            {Math.round(metrics.netProfit).toLocaleString()} MAD
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <Users size={12} className="text-gray-400" />
                            <span className="text-xs text-gray-500">Bookings</span>
                          </div>
                          <span className="text-sm text-gray-700">{metrics.totalBookings} stays</span>
                        </div>

                        {metrics.lastBookingDate && (
                          <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                            <div className="flex items-center gap-1">
                              <Calendar size={10} className="text-gray-400" />
                              <span className="text-xs text-gray-400">Last stay</span>
                            </div>
                            <span className="text-xs text-gray-500">{metrics.lastBookingDate}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <p className="text-xs text-gray-400">No booking data yet</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/owner/properties/${p.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#581c87] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#4c1d95] transition-all"
                    >
                      View Details <ArrowRight size={14} />
                    </button>
                    <button
                      onClick={() => router.push(`/owner/properties/${p.id}/performance`)}
                      className="flex items-center justify-center gap-1 border border-[#581c87] text-[#581c87] px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-50 transition-all"
                    >
                      <BarChart3 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}