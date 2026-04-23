"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { MapPin, Bed, Bath, ArrowLeft, User, Mail, Phone, Home, Sofa, UtensilsCrossed, Car, Trees, Wind } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "@/lib/axios";

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
}

interface Owner {
  id: number;
  full_name: string;
  email: string;
  phone: string;
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
    if (params.id) fetchProperty();
  }, [params.id]);

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

  return (
    <div className="p-8 bg-[#f9fafb] min-h-screen">

      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={18} /> Back to Properties
      </button>

      {/* Hero */}
      <div className={`h-64 ${placeholderColor(property.property_type)} rounded-2xl flex items-center justify-center relative mb-6 overflow-hidden`}>
        <Home size={64} className="text-gray-300" />
        <span className={`absolute top-4 right-4 text-white text-sm font-bold px-4 py-1.5 rounded-full ${statusStyle(property.status)}`}>
          {property.status_display}
        </span>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
          <h1 className="text-3xl font-bold text-white">{property.name}</h1>
          <div className="flex items-center gap-1 text-white/80 mt-1">
            <MapPin size={14} />
            <span className="text-sm">{property.location}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Property Type</p>
          <p className="text-xl font-bold text-gray-900">{property.property_type_display}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Monthly Revenue</p>
          <p className="text-xl font-bold text-green-600">{monthlyRevenue.toLocaleString()} MAD</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Monthly Expenses</p>
          <p className="text-xl font-bold text-red-500">— MAD</p>
          <p className="text-xs text-gray-400 mt-1">Coming soon</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Net Profit</p>
          <p className="text-xl font-bold text-[#581c87]">— MAD</p>
          <p className="text-xs text-gray-400 mt-1">Coming soon</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left */}
        <div className="lg:col-span-2 space-y-6">

          {/* Chart */}
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
                <span className="text-gray-500">Revenue</span>
                <span className="font-semibold text-green-600">{monthlyRevenue.toLocaleString()} MAD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Expenses</span>
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

        </div>
      </div>
    </div>
  );
}