"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, MapPin, Bed, Bath, MoreVertical, Home, X, Loader2, Edit, Trash2, Image as ImageIcon, Calendar, TrendingUp, Crown, AlertCircle, Upload } from "lucide-react";
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
  bedrooms: number;
  bathrooms: number;
  monthly_rent: string;
  owner_name: string;
  owner: number;
  description?: string;
  area_sqm?: number;
  images?: PropertyImage[];
  living_rooms?: number;
  kitchen_status?: number;
  dining_room?: number;
  has_balcony?: boolean;
  has_garden?: boolean;
  parking_status?: string;
  occupancy_rate?: number;
  total_booked_days?: number;
  total_stays?: number;
  total_revenue?: number;
}

interface Owner {
  id: number;
  full_name: string;
}

interface OccupancyData {
  rate: number;
  bookedDays: number;
  totalStays: number;
  totalRevenue: number;
}

interface PerformanceData {
  id: number;
  name: string;
  location: string;
  property_type: string;
  bedrooms: number;
  occupancy_rate: number;
  total_stays: number;
  total_revenue: number;
  image_url?: string;
}

const emptyForm = {
  name: "",
  location: "",
  property_type: "",
  property_type_other: "",
  bedrooms: "",
  bathrooms: "",
  area_sqm: "",
  monthly_rent: "",
  owner: "",
  description: "",
  living_rooms: "",
  kitchen_status: "",
  dining_room: "",
  has_balcony: "no",
  has_garden: "no",
  parking_status: "no",
};

export default function PropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [showMenu, setShowMenu] = useState<number | null>(null);
  const [uploadingImages, setUploadingImages] = useState<number | null>(null);
  const [selectedImages, setSelectedImages] = useState<FileList | null>(null);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [topPerformers, setTopPerformers] = useState<PerformanceData[]>([]);
  const [worstPerformers, setWorstPerformers] = useState<PerformanceData[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) router.push("/login");
  }, []);

  useEffect(() => {
    fetchProperties();
    fetchOwners();
  }, []);

  useEffect(() => {
    if (!showModal) {
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
      setImagePreviewUrls([]);
      setSelectedImages(null);
    }
  }, [showModal]);

  const fetchProperties = async () => {
    try {
      const res = await api.get("/api/properties/");
      const data = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      
      const propertiesWithOccupancy = await Promise.all(
        data.map(async (property: Property) => {
          const occupancyData = await fetchPropertyOccupancy(property.id);
          return {
            ...property,
            occupancy_rate: occupancyData.rate,
            total_booked_days: occupancyData.bookedDays,
            total_stays: occupancyData.totalStays,
            total_revenue: occupancyData.totalRevenue
          };
        })
      );
      
      setProperties(propertiesWithOccupancy);
      calculatePerformers(propertiesWithOccupancy);
    } catch (err) {
      console.error("Error fetching properties:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPropertyOccupancy = async (propertyId: number): Promise<OccupancyData> => {
    try {
      const currentYear = new Date().getFullYear();
      const res = await api.get(`/api/financials/property-occupancy/${propertyId}/?year=${currentYear}`);
      
      return {
        rate: res.data.occupancy_rate,
        bookedDays: res.data.booked_days,
        totalStays: res.data.total_stays,
        totalRevenue: res.data.total_revenue
      };
    } catch (err) {
      console.error(`Error fetching occupancy for property ${propertyId}:`, err);
      return { rate: 0, bookedDays: 0, totalStays: 0, totalRevenue: 0 };
    }
  };

  const calculatePerformers = (propertiesData: Property[]) => {
    const top = [...propertiesData]
      .sort((a, b) => (b.occupancy_rate || 0) - (a.occupancy_rate || 0))
      .slice(0, 3)
      .map(p => ({
        id: p.id,
        name: p.name,
        location: p.location,
        property_type: p.property_type_display,
        bedrooms: p.bedrooms,
        occupancy_rate: p.occupancy_rate || 0,
        total_stays: p.total_stays || 0,
        total_revenue: p.total_revenue || 0,
        image_url: p.images?.[0]?.image_url
      }));
    
    const worst = [...propertiesData]
      .sort((a, b) => (a.occupancy_rate || 0) - (b.occupancy_rate || 0))
      .slice(0, 3)
      .map(p => ({
        id: p.id,
        name: p.name,
        location: p.location,
        property_type: p.property_type_display,
        bedrooms: p.bedrooms,
        occupancy_rate: p.occupancy_rate || 0,
        total_stays: p.total_stays || 0,
        total_revenue: p.total_revenue || 0,
        image_url: p.images?.[0]?.image_url
      }));
    
    setTopPerformers(top);
    setWorstPerformers(worst);
  };

  const fetchOwners = async () => {
    try {
      const res = await api.get("/api/owners/");
      const data = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      setOwners(data);
    } catch (err) {
      console.error("Error fetching owners:", err);
    }
  };

  const refreshOccupancyRates = async () => {
    setLoading(true);
    const updatedProperties = await Promise.all(
      properties.map(async (property) => {
        const occupancyData = await fetchPropertyOccupancy(property.id);
        return { 
          ...property, 
          occupancy_rate: occupancyData.rate,
          total_booked_days: occupancyData.bookedDays,
          total_stays: occupancyData.totalStays,
          total_revenue: occupancyData.totalRevenue
        };
      })
    );
    setProperties(updatedProperties);
    calculatePerformers(updatedProperties);
    setLoading(false);
  };

  const handleImageSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setSelectedImages(files);
    const previews: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const url = URL.createObjectURL(files[i]);
      previews.push(url);
    }
    setImagePreviewUrls(previews);
  };

  const removePreviewImage = (index: number) => {
    URL.revokeObjectURL(imagePreviewUrls[index]);
    const newPreviews = [...imagePreviewUrls];
    newPreviews.splice(index, 1);
    setImagePreviewUrls(newPreviews);
    
    if (selectedImages) {
      const dt = new DataTransfer();
      for (let i = 0; i < selectedImages.length; i++) {
        if (i !== index) {
          dt.items.add(selectedImages[i]);
        }
      }
      setSelectedImages(dt.files.length > 0 ? dt.files : null);
    }
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!form.name || !form.location || !form.property_type || !form.owner) {
      setFormError("Please fill all required fields.");
      return;
    }
    if (form.property_type === "other" && !form.property_type_other) {
      setFormError("Please specify the property type.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        name: form.name,
        location: form.location,
        property_type: form.property_type === "other" ? "other" : form.property_type,
        description: form.property_type === "other" ? `Type: ${form.property_type_other}. ${form.description}` : form.description,
        bedrooms: Number(form.bedrooms) || 1,
        bathrooms: Number(form.bathrooms) || 1,
        area_sqm: Number(form.area_sqm) || 0,
        monthly_rent: Number(form.monthly_rent) || 0,
        owner: Number(form.owner),
        living_rooms: Number(form.living_rooms) || 0,
        kitchen_status: form.kitchen_status ? Number(form.kitchen_status) : null,
        dining_room: Number(form.dining_room) || 0,
        has_balcony: form.has_balcony === "yes",
        has_garden: form.has_garden === "yes",
        parking_status: form.parking_status,
      };
      
      let propertyResponse;
      if (selectedProperty) {
        await api.put(`/api/properties/${selectedProperty.id}/`, payload);
        propertyResponse = { data: { id: selectedProperty.id } };
      } else {
        propertyResponse = await api.post("/api/properties/", payload);
      }
      
      if (selectedImages && selectedImages.length > 0) {
        const propertyId = propertyResponse.data.id;
        const formData = new FormData();
        for (let i = 0; i < selectedImages.length; i++) {
          formData.append('images', selectedImages[i]);
        }
        
        await api.post(`/api/properties/${propertyId}/upload-images/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      setShowModal(false);
      setForm(emptyForm);
      setSelectedProperty(null);
      setSelectedImages(null);
      setImagePreviewUrls([]);
      fetchProperties();
    } catch (err: any) {
      console.error("Submit error:", err);
      setFormError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProperty) return;
    setSubmitting(true);
    try {
      await api.delete(`/api/properties/${selectedProperty.id}/`);
      setShowDeleteModal(false);
      setSelectedProperty(null);
      fetchProperties();
    } catch (err) {
      alert("Failed to delete property");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (property: Property) => {
    setSelectedProperty(property);
    setForm({
      name: property.name,
      location: property.location,
      property_type: property.property_type,
      property_type_other: "",
      bedrooms: property.bedrooms.toString(),
      bathrooms: property.bathrooms.toString(),
      area_sqm: property.area_sqm?.toString() || "",
      monthly_rent: property.monthly_rent.toString(),
      owner: property.owner.toString(),
      description: property.description || "",
      living_rooms: property.living_rooms?.toString() || "",
      kitchen_status: property.kitchen_status?.toString() || "",
      dining_room: property.dining_room?.toString() || "",
      has_balcony: property.has_balcony ? "yes" : "no",
      has_garden: property.has_garden ? "yes" : "no",
      parking_status: property.parking_status || "no",
    });
    setSelectedImages(null);
    setImagePreviewUrls([]);
    setShowModal(true);
    setShowMenu(null);
  };

  const handleImageUpload = async (propertyId: number, files: FileList) => {
    if (!files.length) return;
    
    setUploadingImages(propertyId);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    
    try {
      await api.post(`/api/properties/${propertyId}/upload-images/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchProperties();
    } catch (err: any) {
      console.error("Error uploading images:", err);
      alert(err.response?.data?.error || "Failed to upload images");
    } finally {
      setUploadingImages(null);
    }
  };

  const totalProperties = properties.length;
  const totalRevenue = properties.reduce((sum, p) => sum + Number(p.monthly_rent), 0);
  
  const avgOccupancyRate = properties.length > 0 
    ? Math.round(properties.reduce((sum, p) => sum + (p.occupancy_rate || 0), 0) / properties.length)
    : 0;
  
  const lowOccupancyCount = properties.filter(p => (p.occupancy_rate || 0) < 50).length;

  const getOccupancyColor = (rate: number = 0) => {
    if (rate >= 75) return "text-green-600";
    if (rate >= 50) return "text-yellow-600";
    if (rate >= 25) return "text-orange-600";
    return "text-red-600";
  };

  const getOccupancyBgColor = (rate: number = 0) => {
    if (rate >= 75) return "bg-green-100";
    if (rate >= 50) return "bg-yellow-100";
    if (rate >= 25) return "bg-orange-100";
    return "bg-red-100";
  };

  const placeholderColor = (type: string) => {
    switch (type) {
      case "villa": return "bg-purple-100";
      case "apartment": return "bg-blue-100";
      case "studio": return "bg-green-100";
      case "riad": return "bg-orange-100";
      default: return "bg-gray-100";
    }
  };

  const stats = [
    { label: "Total Properties", value: totalProperties, color: "text-gray-900", icon: Home },
    { label: "Occupancy Rate", value: `${avgOccupancyRate}%`, color: "text-green-600", icon: TrendingUp, subtext: `${lowOccupancyCount} properties below 50%` },
    { label: "Total Stays", value: properties.reduce((sum, p) => sum + (p.total_stays || 0), 0), color: "text-blue-600", icon: Calendar },
    { label: "Total Revenue", value: `${totalRevenue.toLocaleString()} MAD`, color: "text-[#581c87]", icon: TrendingUp },
  ];

  const inputClass = "w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#581c87]/20 focus:border-[#581c87] text-gray-900 bg-gray-50 focus:bg-white transition-all text-sm";

  return (
    <div className="p-8 bg-[#f9fafb] min-h-screen">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-500">Manage all your rental properties</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={refreshOccupancyRates}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-all"
          >
            <TrendingUp size={18} />
            Refresh Rates
          </button>
          <button
            onClick={() => { setSelectedProperty(null); setForm(emptyForm); setSelectedImages(null); setImagePreviewUrls([]); setShowModal(true); }}
            className="flex items-center gap-2 bg-[#581c87] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#4c1d95] transition-all shadow-lg shadow-[#581c87]/20"
          >
            <Plus size={18} />
            Add Property
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500 font-medium">{s.label}</p>
              <s.icon size={18} className="text-gray-400" />
            </div>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            {s.subtext && <p className="text-xs text-gray-400 mt-1">{s.subtext}</p>}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-100" />
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
          <p className="text-sm">Add your first property to get started</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {properties.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow relative">
                <div className="relative">
                  <div className={`h-48 ${placeholderColor(p.property_type)} flex items-center justify-center relative group`}>
                    {p.images && p.images.length > 0 ? (
                      <img
                        src={p.images[0].image_url || `http://127.0.0.1:8000${p.images[0].image}`}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                        }}
                      />
                    ) : (
                      <Home size={48} className="text-gray-300" />
                    )}
                    
                    <label className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full cursor-pointer transition-all z-10">
                      {uploadingImages === p.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <ImageIcon size={16} />
                      )}
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files && handleImageUpload(p.id, e.target.files)}
                        disabled={uploadingImages === p.id}
                      />
                    </label>

                    <div className={`absolute bottom-2 left-2 ${getOccupancyBgColor(p.occupancy_rate)} backdrop-blur-sm text-xs px-2 py-1 rounded-full font-semibold ${getOccupancyColor(p.occupancy_rate)}`}>
                      📊 {p.occupancy_rate || 0}% Occupied
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-900 text-lg">{p.name}</h3>
                    <div className="relative">
                      <button onClick={() => setShowMenu(showMenu === p.id ? null : p.id)} className="text-gray-400 hover:text-gray-600">
                        <MoreVertical size={18} />
                      </button>
                      {showMenu === p.id && (
                        <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-10">
                          <button onClick={() => handleEdit(p)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl flex items-center gap-2">
                            <Edit size={14} /> Edit
                          </button>
                          <button onClick={() => { setSelectedProperty(p); setShowDeleteModal(true); setShowMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-xl flex items-center gap-2">
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-gray-400 text-sm mb-3">
                    <MapPin size={13} /><span>{p.location}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-gray-500 text-sm">
                      <span className="flex items-center gap-1"><Bed size={14} /> {p.bedrooms} bed</span>
                      <span className="flex items-center gap-1"><Bath size={14} /> {p.bathrooms} bath</span>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">{p.property_type_display}</span>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Occupancy Rate (Year to Date)</span>
                      <span className={`font-semibold ${getOccupancyColor(p.occupancy_rate)}`}>{p.occupancy_rate || 0}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          (p.occupancy_rate || 0) >= 75 ? 'bg-green-500' :
                          (p.occupancy_rate || 0) >= 50 ? 'bg-yellow-500' :
                          (p.occupancy_rate || 0) >= 25 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${p.occupancy_rate || 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {p.total_booked_days || 0} days booked • {p.total_stays || 0} stays
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-400">Monthly Rent</p>
                      <p className="font-bold text-[#581c87]">{Number(p.monthly_rent).toLocaleString()} MAD</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Owner</p>
                        <p className="text-sm font-semibold text-gray-700">{p.owner_name}</p>
                      </div>
                      <button onClick={() => router.push(`/dashboard/properties/${p.id}`)} className="flex items-center gap-1 bg-[#581c87]/10 text-[#581c87] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#581c87]/20 transition-all">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Top & Worst Performing Properties */}
          {properties.length > 0 && (topPerformers.length > 0 || worstPerformers.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-transparent">
                  <div className="flex items-center gap-2">
                    <Crown size={20} className="text-yellow-500" />
                    <h2 className="font-bold text-gray-900">🏆 Top Performing Properties</h2>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Highest occupancy rates - These properties are your best assets</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {topPerformers.map((property, index) => (
                    <div key={property.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/properties/${property.id}`)}>
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-sm">
                          #{index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-900 truncate">{property.name}</p>
                            <span className={`text-sm font-bold ${getOccupancyColor(property.occupancy_rate)}`}>
                              {property.occupancy_rate}%
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <MapPin size={10} /> {property.location.split(',')[0]}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Bed size={10} /> {property.bedrooms} beds
                            </span>
                            <span className="text-xs text-gray-400">{property.property_type}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-green-600">{property.total_stays} stays</span>
                              <span className="text-[#581c87] font-semibold">
                                {property.total_revenue.toLocaleString()} MAD revenue
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-transparent">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={20} className="text-red-500" />
                    <h2 className="font-bold text-gray-900">⚠️ Worst Performing Properties</h2>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Lowest occupancy rates - Need immediate attention</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {worstPerformers.map((property, index) => (
                    <div key={property.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/properties/${property.id}`)}>
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">
                          #{index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-900 truncate">{property.name}</p>
                            <span className={`text-sm font-bold ${getOccupancyColor(property.occupancy_rate)}`}>
                              {property.occupancy_rate}%
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <MapPin size={10} /> {property.location.split(',')[0]}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Bed size={10} /> {property.bedrooms} beds
                            </span>
                            <span className="text-xs text-gray-400">{property.property_type}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-orange-600">{property.total_stays} stays</span>
                              <span className="text-gray-500 font-semibold">
                                {property.total_revenue.toLocaleString()} MAD revenue
                              </span>
                            </div>
                          </div>
                          {property.occupancy_rate < 30 && (
                            <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle size={12} />
                              Critical: Low occupancy - needs marketing attention
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedProperty ? "Edit Property" : "Add New Property"}</h2>
                  <p className="text-sm text-gray-400 mt-1">{selectedProperty ? "Update property details" : "Enter the details of the new property"}</p>
                </div>
                <button onClick={() => { setShowModal(false); setForm(emptyForm); setSelectedProperty(null); setFormError(""); setSelectedImages(null); setImagePreviewUrls([]); }} className="text-gray-400 hover:text-gray-600">
                  <X size={22} />
                </button>
              </div>

              {formError && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4 border border-red-100">
                  {formError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Property Images</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-[#581c87] transition-colors cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      id="image-upload-input"
                      onChange={(e) => handleImageSelect(e.target.files)}
                    />
                    <label htmlFor="image-upload-input" className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload size={32} className="text-gray-400" />
                      <p className="text-sm text-gray-500">Click to upload property images</p>
                      <p className="text-xs text-gray-400">You can select multiple images (JPG, PNG, GIF)</p>
                    </label>
                  </div>
                  
                  {imagePreviewUrls.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Selected Images ({imagePreviewUrls.length})</p>
                      <div className="flex gap-2 flex-wrap">
                        {imagePreviewUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => removePreviewImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Property Information</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Property Name *</label>
                  <input className={inputClass} placeholder="Riad Palais Medina" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Location *</label>
                  <input className={inputClass} placeholder="Marrakech, Morocco" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Property Type *</label>
                  <select className={inputClass} value={form.property_type} onChange={e => setForm({ ...form, property_type: e.target.value, property_type_other: "" })}>
                    <option value="">Select type</option>
                    <option value="apartment">Apartment</option>
                    <option value="villa">Villa</option>
                    <option value="studio">Studio</option>
                    <option value="house">House</option>
                    <option value="commercial">Commercial</option>
                    <option value="other">Other</option>
                  </select>
                  {form.property_type === "other" && (
                    <input className={`${inputClass} mt-2`} placeholder="Please specify property type..." value={form.property_type_other} onChange={e => setForm({ ...form, property_type_other: e.target.value })} />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Bedrooms</label>
                    <input type="number" className={inputClass} placeholder="3" value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Bathrooms</label>
                    <input type="number" className={inputClass} placeholder="2" value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Living Rooms</label>
                    <input type="number" className={inputClass} placeholder="1" value={form.living_rooms} onChange={e => setForm({ ...form, living_rooms: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Dining Room</label>
                    <input type="number" className={inputClass} placeholder="1" value={form.dining_room} onChange={e => setForm({ ...form, dining_room: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Kitchen Status</label>
                  <select className={inputClass} value={form.kitchen_status} onChange={e => setForm({ ...form, kitchen_status: e.target.value })}>
                    <option value="">Select status</option>
                    <option value="1">Full Kitchen</option>
                    <option value="2">Semi Kitchen</option>
                    <option value="3">No Kitchen</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Balcony / Terrace</label>
                    <select className={inputClass} value={form.has_balcony} onChange={e => setForm({ ...form, has_balcony: e.target.value })}>
                      <option value="no">None</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Garden</label>
                    <select className={inputClass} value={form.has_garden} onChange={e => setForm({ ...form, has_garden: e.target.value })}>
                      <option value="no">None</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Parking</label>
                  <select className={inputClass} value={form.parking_status} onChange={e => setForm({ ...form, parking_status: e.target.value })}>
                    <option value="no">No Parking</option>
                    <option value="private">Private Garage</option>
                    <option value="street">On Street</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Area (m²)</label>
                    <input type="number" className={inputClass} placeholder="75" value={form.area_sqm} onChange={e => setForm({ ...form, area_sqm: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Monthly Rent (MAD)</label>
                    <input type="number" className={inputClass} placeholder="5000" value={form.monthly_rent} onChange={e => setForm({ ...form, monthly_rent: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Owner *</label>
                  <select className={inputClass} value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })}>
                    <option value="">Select owner</option>
                    {owners.map(o => <option key={o.id} value={o.id}>{o.full_name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Description</label>
                  <textarea className={inputClass} rows={3} placeholder="Brief description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowModal(false); setForm(emptyForm); setSelectedProperty(null); setFormError(""); setSelectedImages(null); setImagePreviewUrls([]); }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-[#581c87] text-white font-semibold hover:bg-[#4c1d95] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#581c87]/20"
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : (selectedProperty ? "Update Property" : "Add Property")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedProperty && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Property</h2>
              <p className="text-gray-500 mb-6">Are you sure you want to delete "{selectedProperty.name}"? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={submitting} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}