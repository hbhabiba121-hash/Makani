"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  MapPin, Bed, Bath, ArrowLeft, User, Mail, Phone, Home, Sofa, 
  UtensilsCrossed, Car, Trees, Wind, X, Plus, Image as ImageIcon, 
  Loader2, Trash2, Star, ChevronLeft, ChevronRight, TrendingUp, CalendarDays
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

const chartData = [
  { month: "Jan", revenue: 8500, expenses: 1200 },
  { month: "Feb", revenue: 8500, expenses: 1100 },
  { month: "Mar", revenue: 9000, expenses: 1300 },
  { month: "Apr", revenue: 8200, expenses: 1000 },
  { month: "May", revenue: 9500, expenses: 1400 },
  { month: "Jun", revenue: 8800, expenses: 1200 },
  { month: "Jul", revenue: 10000, expenses: 1500 },
  { month: "Aug", revenue: 9200, expenses: 1100 },
];

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
      case "available": return "bg-green-500";
      case "rented": return "bg-orange-500";
      case "maintenance": return "bg-red-500";
      default: return "bg-gray-400";
    }
  };

  const placeholderColor = (type: string) => {
    switch (type) {
      case "villa": return "bg-purple-100";
      case "apartment": return "bg-blue-100";
      case "studio": return "bg-green-100";
      default: return "bg-gray-100";
    }
  };

  const getOccupancyColor = (rate: number) => {
    if (rate >= 75) return "text-green-600";
    if (rate >= 50) return "text-yellow-600";
    if (rate >= 25) return "text-orange-600";
    return "text-red-600";
  };

  const kitchenLabel = (status?: number) => {
    switch (status) {
      case 1: return "Full Kitchen";
      case 2: return "Semi Kitchen";
      case 3: return "No Kitchen";
      default: return "—";
    }
  };

  const parkingLabel = (status?: string) => {
    switch (status) {
      case "private": return "Private Garage";
      case "street": return "On Street";
      case "no": return "No Parking";
      default: return "—";
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-[#f9fafb] min-h-screen">
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-gray-100 rounded-2xl" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!property) return null;

  const monthlyRevenue = Number(property.monthly_rent);
  const commission = Math.round(monthlyRevenue * 0.15);

  // Prepare occupancy chart data
  const occupancyChartData = occupancy?.monthly_breakdown.map(m => ({
    month: m.month_name.slice(0, 3),
    occupancy: m.occupancy_rate,
    bookedDays: m.booked_days
  })) || [];

  return (
    <div className="p-8 bg-[#f9fafb] min-h-screen">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={18} /> Back to Properties
      </button>

      {/* Hero Section with Image Gallery */}
      <div className="relative mb-6">
        <div className={`h-96 ${placeholderColor(property.property_type)} rounded-2xl flex items-center justify-center relative overflow-hidden group`}>
          {property.images && property.images.length > 0 ? (
            <div className="relative w-full h-full">
              <img
                src={property.images[0]?.image_url || `http://127.0.0.1:8000${property.images[0]?.image}`}
                alt={property.name}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => openImageViewer(0)}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1200x400?text=No+Image';
                }}
              />
              
              {property.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {property.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => openImageViewer(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === 0 ? 'bg-white w-4' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Home size={80} className="text-gray-300" />
          )}
          
          <span className={`absolute top-4 right-4 text-white text-sm font-bold px-4 py-1.5 rounded-full ${statusStyle(property.status)} z-10`}>
            {property.status_display}
          </span>

          <label className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full cursor-pointer transition-all z-10">
            {uploading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Plus size={20} />
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

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
            <h1 className="text-3xl font-bold text-white">{property.name}</h1>
            <div className="flex items-center gap-1 text-white/80 mt-1">
              <MapPin size={14} />
              <span className="text-sm">{property.location}</span>
            </div>
          </div>
        </div>

        {property.images && property.images.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            {property.images.map((image, idx) => (
              <div key={image.id} className="relative group/thumb flex-shrink-0">
                <div 
                  className="w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-purple-500 transition-all"
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
                  <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5">
                    <Star size={10} className="text-white" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                  <button
                    onClick={() => handleSetMainImage(image.id)}
                    className="bg-yellow-500 text-white p-1 rounded hover:bg-yellow-600"
                    title="Set as main"
                  >
                    <Star size={12} />
                  </button>
                  <button
                    onClick={() => handleDeleteImage(image.id)}
                    className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                    title="Delete image"
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
        )}
      </div>

      {/* Stats Cards - Added Occupancy Card */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Property Type</p>
          <p className="text-xl font-bold text-gray-900">{property.property_type_display}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Occupancy Rate</p>
          {occupancyLoading ? (
            <Loader2 size={20} className="animate-spin text-gray-400" />
          ) : (
            <>
              <p className={`text-xl font-bold ${getOccupancyColor(occupancy?.occupancy_rate || 0)}`}>
                {occupancy?.occupancy_rate || 0}%
              </p>
              <p className="text-xs text-gray-400 mt-1">{occupancy?.booked_days || 0} days booked</p>
            </>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Total Stays (YTD)</p>
          <p className="text-xl font-bold text-gray-900">{occupancy?.total_stays || 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Monthly Revenue</p>
          <p className="text-xl font-bold text-green-600">{monthlyRevenue.toLocaleString()} MAD</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">YTD Revenue</p>
          <p className="text-xl font-bold text-[#581c87]">{Math.round(occupancy?.total_revenue || 0).toLocaleString()} MAD</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left */}
        <div className="lg:col-span-2 space-y-6">

          {/* Occupancy Chart - NEW */}
          {occupancyChartData.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-900">Occupancy Rate Trend</h2>
                  <p className="text-sm text-gray-400">Monthly occupancy percentage</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays size={14} className="text-gray-400" />
                  <span className="text-gray-500">Year to Date</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={occupancyChartData}>
                  <defs>
                    <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#581c87" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#581c87" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip formatter={(value) => [`${value}%`, 'Occupancy']} />
                  <Area 
                    type="monotone" 
                    dataKey="occupancy" 
                    name="Occupancy Rate" 
                    stroke="#581c87" 
                    strokeWidth={2} 
                    fill="url(#occGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Average Occupancy</span>
                  <span className={`font-semibold ${getOccupancyColor(occupancy?.occupancy_rate || 0)}`}>
                    {occupancy?.occupancy_rate || 0}%
                  </span>
                </div>
                <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#581c87] rounded-full transition-all"
                    style={{ width: `${occupancy?.occupancy_rate || 0}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-1">Revenue & Expenses Trend</h2>
            <p className="text-sm text-gray-400 mb-4">Monthly performance</p>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
                <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} MAD`]} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#7c3aed" strokeWidth={2} fill="url(#revGrad)" />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f43f5e" strokeWidth={2} fill="url(#expGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Property Details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">Property Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Bed size={16} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Bedrooms</p>
                  <p className="font-semibold text-gray-900">{property.bedrooms}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Bath size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Bathrooms</p>
                  <p className="font-semibold text-gray-900">{property.bathrooms}</p>
                </div>
              </div>

              {property.living_rooms != null && property.living_rooms > 0 && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Sofa size={16} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Living Rooms</p>
                    <p className="font-semibold text-gray-900">{property.living_rooms}</p>
                  </div>
                </div>
              )}

              {property.dining_room != null && property.dining_room > 0 && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <UtensilsCrossed size={16} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Dining Room</p>
                    <p className="font-semibold text-gray-900">{property.dining_room}</p>
                  </div>
                </div>
              )}

              {property.kitchen_status != null && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                    <UtensilsCrossed size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Kitchen</p>
                    <p className="font-semibold text-gray-900">{kitchenLabel(property.kitchen_status)}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-sky-100 rounded-lg flex items-center justify-center">
                  <Wind size={16} className="text-sky-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Balcony</p>
                  <p className="font-semibold text-gray-900">{property.has_balcony ? "Yes" : "No"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Trees size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Garden</p>
                  <p className="font-semibold text-gray-900">{property.has_garden ? "Yes" : "No"}</p>
                </div>
              </div>

              {property.parking_status && property.parking_status !== "no" && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Car size={16} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Parking</p>
                    <p className="font-semibold text-gray-900">{parkingLabel(property.parking_status)}</p>
                  </div>
                </div>
              )}

              {property.area_sqm && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 bg-pink-100 rounded-lg flex items-center justify-center">
                    <Home size={16} className="text-pink-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Area</p>
                    <p className="font-semibold text-gray-900">{property.area_sqm} m²</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-3">About Property</h2>
              <p className="text-gray-500 text-sm leading-relaxed">{property.description}</p>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="space-y-6">

          {/* Owner Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">Property Owner</h2>
            {owner ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <User size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{owner.full_name}</p>
                    <p className="text-xs text-gray-400">Property Owner</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail size={14} /> {owner.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone size={14} /> {owner.phone || "—"}
                  </div>
                </div>
                <button className="w-full mt-4 py-2.5 bg-[#581c87] text-white rounded-xl text-sm font-semibold hover:bg-[#4c1d95] transition-all">
                  Contact Owner
                </button>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No owner assigned</p>
            )}
          </div>

          {/* Financial Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">Financial Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Monthly Revenue</span>
                <span className="font-semibold text-green-600">{monthlyRevenue.toLocaleString()} MAD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">YTD Revenue</span>
                <span className="font-semibold text-[#581c87]">{Math.round(occupancy?.total_revenue || 0).toLocaleString()} MAD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Monthly Expenses</span>
                <span className="font-semibold text-red-500">— MAD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Commission (15%)</span>
                <span className="font-semibold text-gray-700">-{commission.toLocaleString()} MAD</span>
              </div>
              <div className="pt-3 border-t border-gray-100 flex justify-between">
                <span className="font-bold text-gray-900">Owner Payout</span>
                <span className="font-bold text-[#581c87]">— MAD</span>
              </div>
            </div>
          </div>

          {/* Monthly Occupancy Breakdown */}
          {occupancy?.monthly_breakdown && occupancy.monthly_breakdown.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4">Monthly Breakdown</h2>
              <div className="space-y-3">
                {occupancy.monthly_breakdown.map((month) => (
                  <div key={month.month}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{month.month_name}</span>
                      <span className={`font-semibold ${getOccupancyColor(month.occupancy_rate)}`}>
                        {month.occupancy_rate}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          month.occupancy_rate >= 75 ? 'bg-green-500' :
                          month.occupancy_rate >= 50 ? 'bg-yellow-500' :
                          month.occupancy_rate >= 25 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${month.occupancy_rate}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {month.booked_days} / {month.total_days} days
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Screen Image Modal */}
      {showImageModal && property.images && property.images.length > 0 && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X size={32} />
          </button>
          
          <button
            onClick={prevImage}
            className="absolute left-4 text-white hover:text-gray-300 bg-black/50 p-2 rounded-full"
          >
            <ChevronLeft size={32} />
          </button>
          
          <button
            onClick={nextImage}
            className="absolute right-4 text-white hover:text-gray-300 bg-black/50 p-2 rounded-full"
          >
            <ChevronRight size={32} />
          </button>
          
          <div className="relative max-w-4xl max-h-[80vh] mx-4">
            <img
              src={property.images[selectedImageIndex]?.image_url || `http://127.0.0.1:8000${property.images[selectedImageIndex]?.image}`}
              alt={`${property.name} ${selectedImageIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain"
            />
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              <button
                onClick={() => handleSetMainImage(property.images![selectedImageIndex].id)}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-600 transition"
              >
                <Star size={16} />
                Set as Main
              </button>
              <button
                onClick={() => handleDeleteImage(property.images![selectedImageIndex].id)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-600 transition"
                disabled={deletingImage === property.images![selectedImageIndex].id}
              >
                {deletingImage === property.images![selectedImageIndex].id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Delete
              </button>
            </div>
          </div>
          
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 translate-y-12">
            <p className="text-white text-sm">
              {selectedImageIndex + 1} / {property.images.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}