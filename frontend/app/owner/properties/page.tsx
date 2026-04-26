"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, MapPin, Bed, Bath, ArrowRight } from "lucide-react";
import api from "@/lib/axios";

interface Property {
  id: number;
  name: string;
  location: string;
  property_type: string;
  status: string;
  status_display: string;
  bedrooms: number;
  bathrooms: number;
  monthly_rent: string;
}

interface Financial {
  property: { id: number; name: string };
  owner_payout: string;
  revenue: string;
}

export default function OwnerPropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [financials, setFinancials] = useState<{ [key: number]: Financial[] }>({});
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) router.push("/login");
  }, [router]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/api/properties/");
      const data = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      setProperties(data);

      const finMap: { [key: number]: Financial[] } = {};
      for (const prop of data) {
        try {
          const finRes = await api.get(`/financials/summary/${prop.id}/?year=${currentYear}`);
          finMap[prop.id] = Array.isArray(finRes.data) ? finRes.data : [];
        } catch {
          finMap[prop.id] = [];
        }
      }
      setFinancials(finMap);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTotalEarnings = (propertyId: number) => {
    const fins = financials[propertyId] || [];
    return fins.reduce((sum, f) => sum + Number(f.owner_payout), 0);
  };

  const placeholderColor = (type: string) => {
    switch (type) {
      case "villa": return "bg-purple-100";
      case "apartment": return "bg-blue-100";
      case "studio": return "bg-green-100";
      default: return "bg-purple-50";
    }
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-700";
      case "rented": return "bg-purple-100 text-purple-700";
      case "maintenance": return "bg-red-100 text-red-600";
      default: return "bg-gray-100 text-gray-500";
    }
  };

  return (
    <div className="p-8 bg-[#f9fafb] min-h-screen">

      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-sm text-gray-400 mb-1">Home › My Properties</p>
          <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse border border-gray-100">
              <div className="h-52 bg-gray-100" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Home size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No properties found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p) => {
            const totalEarnings = getTotalEarnings(p.id);
            const fins = financials[p.id] || [];
            const hasFinancials = fins.length > 0;

            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">

                <div className={`h-52 ${placeholderColor(p.property_type)} flex items-center justify-center`}>
                  <Home size={52} className="text-purple-200" />
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-gray-900 text-lg">{p.name}</h3>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusStyle(p.status)}`}>
                      {p.status_display}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-gray-400 text-sm mb-4">
                    <MapPin size={13} />
                    <span>{p.location}</span>
                  </div>

                  <div className="flex items-center gap-3 text-gray-400 text-sm mb-4">
                    <span className="flex items-center gap-1"><Bed size={13} /> {p.bedrooms} bed</span>
                    <span className="flex items-center gap-1"><Bath size={13} /> {p.bathrooms} bath</span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Monthly Rent</span>
                      <span className="font-semibold text-gray-900">{Number(p.monthly_rent).toLocaleString()} MAD</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Earnings</span>
                      <span className="font-bold text-[#581c87]">
                        {hasFinancials ? `${totalEarnings.toLocaleString()} MAD` : `${Math.round(Number(p.monthly_rent) * 0.85).toLocaleString()} MAD`}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/owner/properties/${p.id}`)}
                    className="w-full flex items-center justify-center gap-2 bg-[#581c87] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#4c1d95] transition-all"
                  >
                    View Details <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}