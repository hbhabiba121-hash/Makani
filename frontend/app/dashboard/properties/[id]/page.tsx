"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  MapPin, Bed, Bath, ArrowLeft, User, Mail, Phone, Home, Sofa, 
  UtensilsCrossed, Car, Trees, Wind, X, Plus, Image as ImageIcon, 
  Loader2, Trash2, Star, ChevronLeft, ChevronRight, TrendingUp, CalendarDays,
  Building2, DollarSign, Percent, Calendar, Eye, Edit, Download
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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
  property_type_display: string;
  property_type: string;
  status: string;
  status_display: string;
  bedrooms: number;
  bathrooms: number;
  monthly_rent: string;
  owner: number;
  owner_name: string;
  description?: string;
  area_sqm?: string;
  living_rooms?: number;
  kitchen_status?: number;
  dining_room?: number;
  has_balcony?: boolean;
  has_garden?: boolean;
  parking_status?: string;
  images?: PropertyImage[];
}

interface Owner {
  id: number;
  full_name: string;
  email: string;
  phone: string;
}

interface OccupancyData {
  property_id: number;
  property_name: string;
  period: {
    start_date: string;
    end_date: string;
    total_days: number;
  };
  booked_days: number;
  occupancy_rate: number;
  total_revenue: number;
  total_stays: number;
  monthly_breakdown: Array<{
    month: number;
    month_name: string;
    year: number;
    booked_days: number;
    total_days: number;
    occupancy_rate: number;
  }>;
}

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [deletingImage, setDeletingImage] = useState<number | null>(null);
  const [occupancy, setOccupancy] = useState<OccupancyData | null>(null);
  const [occupancyLoading, setOccupancyLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "financials">("overview");

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) router.push("/login");
  }, []);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await api.get(`/api/properties/${params.id}/`);
        setProperty(res.data);
        if (res.data.owner) {
          const ownerRes = await api.get(`/api/owners/${res.data.owner}/`);
          setOwner(ownerRes.data);
        }
      } catch (err) {
        console.error("Error fetching property:", err);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchOccupancy = async () => {
      try {
        const currentYear = new Date().getFullYear();
        const res = await api.get(`/api/financials/property-occupancy/${params.id}/?year=${currentYear}`);
        setOccupancy(res.data);
      } catch (err) {
        console.error("Error fetching occupancy:", err);
      } finally {
        setOccupancyLoading(false);
      }
    };
    
    if (params.id) {
      fetchProperty();
      fetchOccupancy();
    }
  }, [params.id]);

  const handleImageUpload = async (files: FileList) => {
    if (!files.length || !property) return;
    
    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    
    try {
      await api.post(`/api/properties/${property.id}/upload-images/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const res = await api.get(`/api/properties/${property.id}/`);
      setProperty(res.data);
    } catch (err: any) {
      console.error("Error uploading images:", err);
      alert(err.response?.data?.error || "Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!property || !confirm("Are you sure you want to delete this image?")) return;
    
    setDeletingImage(imageId);
    try {
      await api.delete(`/api/properties/${property.id}/delete-image/${imageId}/`);
      const res = await api.get(`/api/properties/${property.id}/`);
      setProperty(res.data);
      if (showImageModal && property.images?.length === 1) {
        setShowImageModal(false);
      }
    } catch (err) {
      console.error("Error deleting image:", err);
      alert("Failed to delete image");
    } finally {
      setDeletingImage(null);
    }
  };

  const handleSetMainImage = async (imageId: number) => {
    if (!property) return;
    
    try {
      await api.post(`/api/properties/${property.id}/set-main-image/${imageId}/`);
      const res = await api.get(`/api/properties/${property.id}/`);
      setProperty(res.data);
    } catch (err) {
      console.error("Error setting main image:", err);
      alert("Failed to set main image");
    }
  };

  const openImageViewer = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  const nextImage = () => {
    if (property?.images) {
      setSelectedImageIndex((prev) => (prev + 1) % property.images!.length);
    }
  };

  const prevImage = () => {
    if (property?.images) {
      setSelectedImageIndex((prev) => (prev - 1 + property.images!.length) % property.images!.length);
    }
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case "available": return "bg-[#10b981]";
      case "rented": return "bg-[#f59e0b]";
      case "maintenance": return "bg-[#ef4444]";
      default: return "bg-[#94a3b8]";
    }
  };

  const placeholderColor = (type: string) => {
    switch (type) {
      case "villa": return "bg-[#e0e7ff]";
      case "apartment": return "bg-[#dbeafe]";
      case "studio": return "bg-[#d1fae5]";
      case "riad": return "bg-[#ffedd5]";
      default: return "bg-[#f1f5f9]";
    }
  };

  const getOccupancyColor = (rate: number) => {
    if (rate >= 75) return "text-[#10b981]";
    if (rate >= 50) return "text-[#f59e0b]";
    if (rate >= 25) return "text-[#f97316]";
    return "text-[#ef4444]";
  };

  const getOccupancyBgColor = (rate: number) => {
    if (rate >= 75) return "bg-[#d1fae5]";
    if (rate >= 50) return "bg-[#fef3c7]";
    if (rate >= 25) return "bg-[#ffedd5]";
    return "bg-[#fee2e2]";
  };

  const getOccupancyBarColor = (rate: number) => {
    if (rate >= 75) return "bg-[#10b981]";
    if (rate >= 50) return "bg-[#f59e0b]";
    if (rate >= 25) return "bg-[#f97316]";
    return "bg-[#ef4444]";
  };

  const kitchenLabel = (status?: number) => {
    switch (status) {
      case 1: return "Équipée";
      case 2: return "Semi-équipée";
      case 3: return "Sans cuisine";
      default: return "—";
    }
  };

  const parkingLabel = (status?: string) => {
    switch (status) {
      case "private": return "Privé";
      case "street": return "Rue";
      case "no": return "Aucun";
      default: return "—";
    }
  };

  const propertyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      apartment: "Appartement",
      villa: "Villa",
      studio: "Studio",
      house: "Maison",
      commercial: "Commercial",
      riad: "Riad",
      other: "Autre",
    };
    return labels[type] || type;
  };

  // Prepare occupancy chart data
  const occupancyChartData = occupancy?.monthly_breakdown.map(m => ({
    month: m.month_name.slice(0, 3),
    occupancy: m.occupancy_rate,
    bookedDays: m.booked_days,
    revenue: Math.round((occupancy.total_revenue / occupancy.monthly_breakdown.length) * (m.occupancy_rate / 100))
  })) || [];

  const revenueChartData = occupancy?.monthly_breakdown.map(m => ({
    month: m.month_name.slice(0, 3),
    revenue: Math.round(m.occupancy_rate * 100),
    expenses: Math.round(m.occupancy_rate * 30)
  })) || [];

  if (loading) {
    return (
      <div className="p-4 bg-[#f4f7f6] min-h-screen">
        <div className="max-w-[1280px] mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-[#f1f5f9] rounded-lg w-48" />
          <div className="h-96 bg-[#f1f5f9] rounded-2xl" />
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-[#f1f5f9] rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!property) return null;

  const monthlyRevenue = Number(property.monthly_rent);
  const commission = Math.round(monthlyRevenue * 0.15);
  const ownerPayout = monthlyRevenue - commission;

  return (
    <div className="min-h-screen bg-[#f4f7f6]">
      <div className="p-4 max-w-[1280px] mx-auto">

        {/* Back Button & Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#64748b] hover:text-[#1e293b] transition-colors text-[13px] font-medium"
          >
            <ArrowLeft size={16} /> Retour
          </button>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 bg-white border border-[#e2e8f0] text-[#334155] px-3 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#f8fafc] transition-all">
              <Edit size={14} /> Modifier
            </button>
            <button className="flex items-center gap-1.5 bg-white border border-[#e2e8f0] text-[#334155] px-3 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#f8fafc] transition-all">
              <Download size={14} /> Exporter
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden mb-4">
          <div className={`h-[280px] ${placeholderColor(property.property_type)} relative overflow-hidden group`}>
            {property.images && property.images.length > 0 ? (
              <div className="relative w-full h-full">
                <img
                  src={property.images[0]?.image_url || `http://127.0.0.1:8000${property.images[0]?.image}`}
                  alt={property.name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => openImageViewer(0)}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1200x400?text=Pas+d%27image';
                  }}
                />
                
                {property.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {property.images.slice(0, 5).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => openImageViewer(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === 0 ? 'bg-white w-4' : 'bg-white/60 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 size={64} className="text-[#94a3b8] opacity-40" />
              </div>
            )}
            
            {/* Status Badge */}
            <span className={`absolute top-4 right-4 text-white text-[11px] font-bold px-3 py-1.5 rounded-full ${statusStyle(property.status)} shadow-lg z-10`}>
              {property.status_display}
            </span>

            {/* Upload Button */}
            <label className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm hover:bg-white text-[#334155] p-2.5 rounded-xl cursor-pointer transition-all shadow-lg z-10 border border-[#e2e8f0]">
              {uploading ? (
                <Loader2 size={18} className="animate-spin text-[#10b981]" />
              ) : (
                <Plus size={18} />
              )}
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                disabled={uploading}
              />
            </label>

            {/* Property Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">{property.name}</h1>
                  <div className="flex items-center gap-1 text-white/90 mt-1">
                    <MapPin size={14} />
                    <span className="text-[13px]">{property.location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded-lg">
                    {propertyTypeLabel(property.property_type)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Image Thumbnails */}
          {property.images && property.images.length > 1 && (
            <div className="p-4 border-t border-[#f1f5f9]">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {property.images.map((image, idx) => (
                  <div key={image.id} className="relative group/thumb flex-shrink-0">
                    <div 
                      className={`w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                        image.is_main ? 'border-[#10b981]' : 'border-transparent hover:border-[#10b981]/50'
                      }`}
                      onClick={() => openImageViewer(idx)}
                    >
                      <img
                        src={image.image_url || `http://127.0.0.1:8000${image.image}`}
                        alt={`${property.name} ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x80?text=No+Image';
                        }}
                      />
                    </div>
                    {image.is_main && (
                      <div className="absolute -top-1.5 -right-1.5 bg-[#10b981] rounded-full p-0.5 shadow">
                        <Star size={10} className="text-white" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSetMainImage(image.id); }}
                        className="bg-[#10b981] text-white p-1 rounded hover:bg-[#059669] transition"
                        title="Définir comme principale"
                      >
                        <Star size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteImage(image.id); }}
                        className="bg-[#ef4444] text-white p-1 rounded hover:bg-[#dc2626] transition"
                        title="Supprimer"
                        disabled={deletingImage === image.id}
                      >
                        {deletingImage === image.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-[#64748b] font-medium">Type</p>
              <div className="w-7 h-7 rounded-lg bg-[#e0e7ff] flex items-center justify-center">
                <Building2 size={14} className="text-[#6366f1]" />
              </div>
            </div>
            <p className="text-[18px] font-bold text-[#1e293b]">{propertyTypeLabel(property.property_type)}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-[#64748b] font-medium">Occupation</p>
              <div className="w-7 h-7 rounded-lg bg-[#d1fae5] flex items-center justify-center">
                <Percent size={14} className="text-[#10b981]" />
              </div>
            </div>
            {occupancyLoading ? (
              <Loader2 size={18} className="animate-spin text-[#94a3b8]" />
            ) : (
              <>
                <p className={`text-[18px] font-bold ${getOccupancyColor(occupancy?.occupancy_rate || 0)}`}>
                  {occupancy?.occupancy_rate || 0}%
                </p>
                <p className="text-[10px] text-[#94a3b8] mt-0.5">{occupancy?.booked_days || 0} jours réservés</p>
              </>
            )}
          </div>
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-[#64748b] font-medium">Séjours (YTD)</p>
              <div className="w-7 h-7 rounded-lg bg-[#fef3c7] flex items-center justify-center">
                <Calendar size={14} className="text-[#f59e0b]" />
              </div>
            </div>
            <p className="text-[18px] font-bold text-[#1e293b]">{occupancy?.total_stays || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-[#64748b] font-medium">Loyer/mois</p>
              <div className="w-7 h-7 rounded-lg bg-[#d1fae5] flex items-center justify-center">
                <DollarSign size={14} className="text-[#10b981]" />
              </div>
            </div>
            <p className="text-[18px] font-bold text-[#10b981]">{monthlyRevenue.toLocaleString()} MAD</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-[#64748b] font-medium">Revenu (YTD)</p>
              <div className="w-7 h-7 rounded-lg bg-[#ede9fe] flex items-center justify-center">
                <TrendingUp size={14} className="text-[#7c3aed]" />
              </div>
            </div>
            <p className="text-[18px] font-bold text-[#581c87]">{Math.round(occupancy?.total_revenue || 0).toLocaleString()} MAD</p>
          </div>
        </div>

        {/* Tabs - Only Overview & Financials */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-1 mb-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 px-4 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${activeTab === "overview"
                  ? "bg-[#f0fdf4] text-[#10b981] shadow-sm"
                  : "text-[#64748b] hover:bg-[#f8fafc]"
                }`}
            >
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab("financials")}
              className={`flex-1 px-4 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${activeTab === "financials"
                  ? "bg-[#f0fdf4] text-[#10b981] shadow-sm"
                  : "text-[#64748b] hover:bg-[#f8fafc]"
                }`}
            >
              Finances
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4">

            {/* Occupancy Chart - Overview Tab */}
            {activeTab === "overview" && occupancyChartData.length > 0 && (
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-[#1e293b] text-[14px]">Évolution de l'occupation</h2>
                    <p className="text-[11px] text-[#64748b]">Taux mensuel</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#64748b]">
                    <CalendarDays size={12} />
                    <span>Année en cours</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={occupancyChartData}>
                    <defs>
                      <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: 'none', 
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: '#fff'
                      }}
                      formatter={(value) => [`${value}%`, 'Occupation']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="occupancy" 
                      name="Taux d'occupation" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      fill="url(#occGrad)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="mt-3 pt-3 border-t border-[#f1f5f9]">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#64748b]">Moyenne annuelle</span>
                    <span className={`font-semibold ${getOccupancyColor(occupancy?.occupancy_rate || 0)}`}>
                      {occupancy?.occupancy_rate || 0}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${getOccupancyBarColor(occupancy?.occupancy_rate || 0)}`}
                      style={{ width: `${occupancy?.occupancy_rate || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Revenue Chart - Financials Tab */}
            {activeTab === "financials" && (
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-[#1e293b] text-[14px]">Revenus & Dépenses</h2>
                    <p className="text-[11px] text-[#64748b]">Performance mensuelle</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: 'none', 
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: '#fff'
                      }}
                      formatter={(value) => [`${Number(value).toLocaleString()} MAD`]}
                    />
                    <Area type="monotone" dataKey="revenue" name="Revenus" stroke="#10b981" strokeWidth={2} fill="url(#revGrad)" />
                    <Area type="monotone" dataKey="expenses" name="Dépenses" stroke="#ef4444" strokeWidth={2} fill="url(#expGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Property Details - Always Visible */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
              <h2 className="font-bold text-[#1e293b] text-[14px] mb-4">Caractéristiques</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">

                <div className="flex items-center gap-2.5 p-3 bg-[#f8fafc] rounded-xl">
                  <div className="w-8 h-8 bg-[#e0e7ff] rounded-lg flex items-center justify-center">
                    <Bed size={14} className="text-[#6366f1]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#64748b]">Chambres</p>
                    <p className="font-semibold text-[#1e293b] text-[13px]">{property.bedrooms}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 bg-[#f8fafc] rounded-xl">
                  <div className="w-8 h-8 bg-[#dbeafe] rounded-lg flex items-center justify-center">
                    <Bath size={14} className="text-[#3b82f6]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#64748b]">Salles de bain</p>
                    <p className="font-semibold text-[#1e293b] text-[13px]">{property.bathrooms}</p>
                  </div>
                </div>

                {property.living_rooms != null && property.living_rooms > 0 && (
                  <div className="flex items-center gap-2.5 p-3 bg-[#f8fafc] rounded-xl">
                    <div className="w-8 h-8 bg-[#ffedd5] rounded-lg flex items-center justify-center">
                      <Sofa size={14} className="text-[#f97316]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748b]">Salons</p>
                      <p className="font-semibold text-[#1e293b] text-[13px]">{property.living_rooms}</p>
                    </div>
                  </div>
                )}

                {property.dining_room != null && property.dining_room > 0 && (
                  <div className="flex items-center gap-2.5 p-3 bg-[#f8fafc] rounded-xl">
                    <div className="w-8 h-8 bg-[#fef3c7] rounded-lg flex items-center justify-center">
                      <UtensilsCrossed size={14} className="text-[#f59e0b]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748b]">Salle à manger</p>
                      <p className="font-semibold text-[#1e293b] text-[13px]">{property.dining_room}</p>
                    </div>
                  </div>
                )}

                {property.kitchen_status != null && (
                  <div className="flex items-center gap-2.5 p-3 bg-[#f8fafc] rounded-xl">
                    <div className="w-8 h-8 bg-[#d1fae5] rounded-lg flex items-center justify-center">
                      <UtensilsCrossed size={14} className="text-[#10b981]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748b]">Cuisine</p>
                      <p className="font-semibold text-[#1e293b] text-[13px]">{kitchenLabel(property.kitchen_status)}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2.5 p-3 bg-[#f8fafc] rounded-xl">
                  <div className="w-8 h-8 bg-[#e0f2fe] rounded-lg flex items-center justify-center">
                    <Wind size={14} className="text-[#0ea5e9]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#64748b]">Balcon</p>
                    <p className="font-semibold text-[#1e293b] text-[13px]">{property.has_balcony ? "Oui" : "Non"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 bg-[#f8fafc] rounded-xl">
                  <div className="w-8 h-8 bg-[#dcfce7] rounded-lg flex items-center justify-center">
                    <Trees size={14} className="text-[#22c55e]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#64748b]">Jardin</p>
                    <p className="font-semibold text-[#1e293b] text-[13px]">{property.has_garden ? "Oui" : "Non"}</p>
                  </div>
                </div>

                {property.parking_status && property.parking_status !== "no" && (
                  <div className="flex items-center gap-2.5 p-3 bg-[#f8fafc] rounded-xl">
                    <div className="w-8 h-8 bg-[#f1f5f9] rounded-lg flex items-center justify-center">
                      <Car size={14} className="text-[#64748b]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748b]">Parking</p>
                      <p className="font-semibold text-[#1e293b] text-[13px]">{parkingLabel(property.parking_status)}</p>
                    </div>
                  </div>
                )}

                {property.area_sqm && (
                  <div className="flex items-center gap-2.5 p-3 bg-[#f8fafc] rounded-xl">
                    <div className="w-8 h-8 bg-[#fce7f3] rounded-lg flex items-center justify-center">
                      <Home size={14} className="text-[#ec4899]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748b]">Surface</p>
                      <p className="font-semibold text-[#1e293b] text-[13px]">{property.area_sqm} m²</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
                <h2 className="font-bold text-[#1e293b] text-[14px] mb-3">Description</h2>
                <p className="text-[#64748b] text-[13px] leading-relaxed">{property.description}</p>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-4">

            {/* Owner Card */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
              <h2 className="font-bold text-[#1e293b] text-[14px] mb-4">Propriétaire</h2>
              {owner ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-full bg-[#e0e7ff] flex items-center justify-center">
                      <User size={18} className="text-[#6366f1]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#1e293b] text-[13px]">{owner.full_name}</p>
                      <p className="text-[10px] text-[#64748b]">Propriétaire</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[12px] text-[#64748b]">
                      <Mail size={12} /> <span className="truncate">{owner.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-[#64748b]">
                      <Phone size={12} /> {owner.phone || "—"}
                    </div>
                  </div>
                  <button className="w-full mt-4 py-2.5 bg-[#10b981] text-white rounded-lg text-[12px] font-semibold hover:bg-[#059669] transition-all shadow-[0_1px_2px_rgba(16,185,129,0.25)]">
                    Contacter
                  </button>
                </div>
              ) : (
                <p className="text-[#94a3b8] text-[12px]">Aucun propriétaire assigné</p>
              )}
            </div>

            {/* Financial Summary */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
              <h2 className="font-bold text-[#1e293b] text-[14px] mb-4">Résumé financier</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#64748b]">Loyer mensuel</span>
                  <span className="font-semibold text-[#10b981]">{monthlyRevenue.toLocaleString()} MAD</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#64748b]">Revenu (YTD)</span>
                  <span className="font-semibold text-[#581c87]">{Math.round(occupancy?.total_revenue || 0).toLocaleString()} MAD</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#64748b]">Commission (15%)</span>
                  <span className="font-semibold text-[#ef4444]">-{commission.toLocaleString()} MAD</span>
                </div>
                <div className="pt-3 border-t border-[#f1f5f9] flex justify-between">
                  <span className="font-bold text-[#1e293b] text-[13px]">Versement propriétaire</span>
                  <span className="font-bold text-[#10b981] text-[13px]">{ownerPayout.toLocaleString()} MAD</span>
                </div>
              </div>
            </div>

            {/* Monthly Breakdown */}
            {occupancy?.monthly_breakdown && occupancy.monthly_breakdown.length > 0 && (
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
                <h2 className="font-bold text-[#1e293b] text-[14px] mb-4">Détail mensuel</h2>
                <div className="space-y-3">
                  {occupancy.monthly_breakdown.map((month) => (
                    <div key={month.month}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-[#64748b]">{month.month_name}</span>
                        <span className={`font-semibold ${getOccupancyColor(month.occupancy_rate)}`}>
                          {month.occupancy_rate}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${getOccupancyBarColor(month.occupancy_rate)}`}
                          style={{ width: `${month.occupancy_rate}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-[#94a3b8] mt-1">
                        {month.booked_days} / {month.total_days} jours
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Image Modal */}
      {showImageModal && property.images && property.images.length > 0 && (
        <div className="fixed inset-0 bg-[#0f172a]/95 backdrop-blur-sm z-50 flex items-center justify-center">
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10 p-2 hover:bg-white/10 rounded-lg"
          >
            <X size={24} />
          </button>
          
          <button
            onClick={prevImage}
            className="absolute left-4 text-white/80 hover:text-white transition-colors bg-[#0f172a]/50 p-3 rounded-full hover:bg-[#0f172a]/80"
          >
            <ChevronLeft size={28} />
          </button>
          
          <button
            onClick={nextImage}
            className="absolute right-4 text-white/80 hover:text-white transition-colors bg-[#0f172a]/50 p-3 rounded-full hover:bg-[#0f172a]/80"
          >
            <ChevronRight size={28} />
          </button>
          
          <div className="relative max-w-5xl max-h-[85vh] mx-4">
            <img
              src={property.images[selectedImageIndex]?.image_url || `http://127.0.0.1:8000${property.images[selectedImageIndex]?.image}`}
              alt={`${property.name} ${selectedImageIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              <button
                onClick={() => handleSetMainImage(property.images![selectedImageIndex].id)}
                className="bg-[#10b981] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#059669] transition text-[12px] font-medium shadow-lg"
              >
                <Star size={14} />
                Définir comme principale
              </button>
              <button
                onClick={() => handleDeleteImage(property.images![selectedImageIndex].id)}
                className="bg-[#ef4444] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#dc2626] transition text-[12px] font-medium shadow-lg"
                disabled={deletingImage === property.images![selectedImageIndex].id}
              >
                {deletingImage === property.images![selectedImageIndex].id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Supprimer
              </button>
            </div>
          </div>
          
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 translate-y-14">
            <p className="text-white/80 text-[12px] bg-[#0f172a]/50 px-3 py-1 rounded-full">
              {selectedImageIndex + 1} / {property.images.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}