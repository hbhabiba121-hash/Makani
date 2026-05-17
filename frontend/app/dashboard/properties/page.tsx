"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, MapPin, Bed, Bath, MoreVertical, Building2, X, Loader2, Edit, Trash2,
  Image as ImageIcon, Calendar, TrendingUp, Crown, AlertCircle, Upload,
  Search, Grid, List, ChevronRight, FileText, BarChart3, Eye, EyeOff,
  Medal, TrendingDown, ArrowUpRight, ArrowDownRight, Target, Zap, LayoutGrid, Rows
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
  avg_daily_rate?: number;
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

const ITEMS_PER_PAGE = 6;

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
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [performanceTab, setPerformanceTab] = useState<"top" | "worst" | "comparison">("top");
  const [currentView, setCurrentView] = useState<"properties" | "performances">("properties");

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType]);

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
        image_url: p.images?.[0]?.image_url,
        avg_daily_rate: p.total_revenue && p.total_booked_days ? p.total_revenue / p.total_booked_days : 0
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
        image_url: p.images?.[0]?.image_url,
        avg_daily_rate: p.total_revenue && p.total_booked_days ? p.total_revenue / p.total_booked_days : 0
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
      setFormError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    if (form.property_type === "other" && !form.property_type_other) {
      setFormError("Veuillez spécifier le type de propriété.");
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
      setFormError(err.response?.data?.message || "Une erreur est survenue. Veuillez réessayer.");
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
      alert("Échec de la suppression du bien");
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
      alert(err.response?.data?.error || "Échec du téléchargement des images");
    } finally {
      setUploadingImages(null);
    }
  };

  const filteredProperties = properties.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.owner_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || p.property_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE);
  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalProperties = properties.length;
  const totalRevenue = properties.reduce((sum, p) => sum + Number(p.monthly_rent), 0);
  const avgOccupancyRate = properties.length > 0
    ? Math.round(properties.reduce((sum, p) => sum + (p.occupancy_rate || 0), 0) / properties.length)
    : 0;
  const lowOccupancyCount = properties.filter(p => (p.occupancy_rate || 0) < 50).length;

  const getOccupancyColor = (rate: number = 0) => {
    if (rate >= 75) return "text-[#10b981]";
    if (rate >= 50) return "text-[#f59e0b]";
    if (rate >= 25) return "text-[#f97316]";
    return "text-[#ef4444]";
  };

  const getOccupancyBgColor = (rate: number = 0) => {
    if (rate >= 75) return "bg-[#d1fae5]";
    if (rate >= 50) return "bg-[#fef3c7]";
    if (rate >= 25) return "bg-[#ffedd5]";
    return "bg-[#fee2e2]";
  };

  const getOccupancyBarColor = (rate: number = 0) => {
    if (rate >= 75) return "bg-[#10b981]";
    if (rate >= 50) return "bg-[#f59e0b]";
    if (rate >= 25) return "bg-[#f97316]";
    return "bg-[#ef4444]";
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

  const stats = [
    { label: "Propriétés", value: totalProperties, change: "+3.05% ce mois", icon: Building2, accent: "#10b981" },
    { label: "Occupation", value: `${avgOccupancyRate}%`, change: `${lowOccupancyCount} < 50%`, icon: TrendingUp, accent: "#6366f1" },
    { label: "Séjours", value: properties.reduce((sum, p) => sum + (p.total_stays || 0), 0), change: "+8.2%", icon: Calendar, accent: "#f59e0b" },
    { label: "Revenu/mois", value: `${totalRevenue.toLocaleString()} MAD`, change: "+12.4%", icon: BarChart3, accent: "#581c87" },
  ];

  const inputClass = "w-full p-2.5 rounded-lg border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] text-[#334155] bg-[#f8fafc] focus:bg-white transition-all text-[13px] font-medium";

  const openModal = () => {
    setSelectedProperty(null);
    setForm(emptyForm);
    setSelectedImages(null);
    setImagePreviewUrls([]);
    setFormError("");
    setShowModal(true);
  };

  const PaginationControls = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#f1f5f9]">
        <p className="text-[12px] text-[#94a3b8]">
          {filteredProperties.length} résultat{filteredProperties.length > 1 ? "s" : ""} • Page {currentPage} / {totalPages}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed text-[12px] transition-colors"
          >
            ←
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-medium transition-colors ${currentPage === page
                  ? "bg-[#10b981] text-white"
                  : "text-[#64748b] hover:bg-[#f8fafc] border border-[#e2e8f0]"
                }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed text-[12px] transition-colors"
          >
            →
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6]">
      <div className="p-4 max-w-[1280px] mx-auto">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#e2e8f0] p-4 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-[#64748b] font-medium">{s.label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.accent + "12" }}>
                  <s.icon size={14} style={{ color: s.accent }} />
                </div>
              </div>
              <p className="text-[22px] font-bold text-[#1e293b] tracking-tight">{s.value}</p>
              <p className="text-[11px] text-[#10b981] font-medium mt-0.5">{s.change}</p>
            </div>
          ))}
        </div>

        {/* Filter & Search Bar - Only show in properties view */}
        {currentView === "properties" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[220px] pl-8 pr-3 py-2 bg-white border border-[#e2e8f0] rounded-lg text-[13px] text-[#334155] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-[12px] font-medium text-[#334155] bg-white border border-[#e2e8f0] rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#10b981]/20"
              >
                <option value="all">Tous</option>
                <option value="apartment">Appartement</option>
                <option value="villa">Villa</option>
                <option value="studio">Studio</option>
                <option value="house">Maison</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white border border-[#e2e8f0] rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${viewMode === "grid" ? "bg-[#10b981] text-white" : "text-[#64748b] hover:bg-[#f8fafc]"}`}
                >
                  <LayoutGrid size={14} />
                  Grille
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${viewMode === "table" ? "bg-[#10b981] text-white" : "text-[#64748b] hover:bg-[#f8fafc]"}`}
                >
                  <Rows size={14} />
                  Liste
                </button>
              </div>
              <button
                onClick={refreshOccupancyRates}
                disabled={loading}
                className="flex items-center gap-1.5 bg-white border border-[#e2e8f0] text-[#334155] px-3 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#f8fafc] transition-all disabled:opacity-50"
              >
                <TrendingUp size={14} />
                Actualiser
              </button>
              <button
                onClick={openModal}
                className="flex items-center gap-1.5 bg-[#10b981] text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#059669] transition-all shadow-[0_1px_2px_rgba(16,185,129,0.25)]"
              >
                <Plus size={14} />
                Ajouter
              </button>
            </div>
          </div>
        )}

        {/* View Toggle Button */}
        <div className="mb-4">
          {currentView === "properties" ? (
            <button
              onClick={() => setCurrentView("performances")}
              className="flex items-center gap-2 bg-[#1e293b] text-white px-4 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#0f172a] transition-all shadow-lg"
            >
              <BarChart3 size={16} />
              Voir les performances
            </button>
          ) : (
            <button
              onClick={() => setCurrentView("properties")}
              className="flex items-center gap-2 bg-[#1e293b] text-white px-4 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#0f172a] transition-all shadow-lg"
            >
              <LayoutGrid size={16} />
              Retour aux propriétés
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && currentView === "properties" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden animate-pulse">
                <div className="h-[140px] bg-[#f1f5f9]" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-[#f1f5f9] rounded w-3/4" />
                  <div className="h-2.5 bg-[#f1f5f9] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : currentView === "properties" && filteredProperties.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-[#f1f5f9] rounded-xl flex items-center justify-center mx-auto mb-3">
              <Building2 size={22} className="text-[#94a3b8]" />
            </div>
            <p className="text-[14px] font-semibold text-[#334155]">Aucun bien trouvé</p>
            <p className="text-[12px] text-[#94a3b8] mt-0.5">Ajoutez votre premier bien</p>
            <button onClick={openModal} className="mt-3 flex items-center gap-1.5 bg-[#10b981] text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#059669] transition-all mx-auto">
              <Plus size={14} /> Ajouter
            </button>
          </div>
        ) : currentView === "properties" && viewMode === "grid" ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginatedProperties.map((p) => (
                <div key={p.id} className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-all group">
                  <div className="relative">
                    <div className={`h-[130px] ${placeholderColor(p.property_type)} flex items-center justify-center relative`}>
                      {p.images && p.images.length > 0 ? (
                        <img
                          src={p.images[0].image_url || `http://127.0.0.1:8000${p.images[0].image}`}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Pas+d%27image';
                          }}
                        />
                      ) : (
                        <Building2 size={32} className="text-[#94a3b8] opacity-40" />
                      )}

                      <label className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm hover:bg-white text-[#334155] p-1.5 rounded-lg cursor-pointer transition-all shadow-sm">
                        {uploadingImages === p.id ? (
                          <Loader2 size={13} className="animate-spin text-[#10b981]" />
                        ) : (
                          <ImageIcon size={13} />
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

                      <div className={`absolute top-2 left-2 ${getOccupancyBgColor(p.occupancy_rate)} text-[11px] px-2 py-0.5 rounded-md font-semibold ${getOccupancyColor(p.occupancy_rate)}`}>
                        {p.occupancy_rate || 0}%
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-[#1e293b] text-[14px] truncate">{p.name}</h3>
                        <div className="flex items-center gap-1 text-[#94a3b8] text-[11px] mt-0.5">
                          <MapPin size={11} /><span className="truncate">{p.location}</span>
                        </div>
                      </div>
                      <div className="relative ml-2">
                        <button onClick={() => setShowMenu(showMenu === p.id ? null : p.id)} className="text-[#94a3b8] hover:text-[#334155] transition-colors w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f1f5f9]">
                          <MoreVertical size={14} />
                        </button>
                        {showMenu === p.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(null)} />
                            <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-[#e2e8f0] z-20 overflow-hidden">
                              <button onClick={() => handleEdit(p)} className="w-full text-left px-3.5 py-2 text-[12px] text-[#334155] hover:bg-[#f8fafc] flex items-center gap-2">
                                <Edit size={13} /> Modifier
                              </button>
                              <button
                                onClick={() => router.push(`/dashboard/properties/${p.id}`)}
                                className="w-full text-left px-3.5 py-2 text-[12px] text-[#334155] hover:bg-[#f8fafc] flex items-center gap-2"
                              >
                                <FileText size={13} /> Détails
                              </button>
                              <button onClick={() => { setSelectedProperty(p); setShowDeleteModal(true); setShowMenu(null); }} className="w-full text-left px-3.5 py-2 text-[12px] text-[#ef4444] hover:bg-[#fef2f2] flex items-center gap-2">
                                <Trash2 size={13} /> Supprimer
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[#64748b] text-[11px] mb-3">
                      <span className="flex items-center gap-1 bg-[#f1f5f9] px-1.5 py-0.5 rounded text-[10px]">
                        <Bed size={11} /> {p.bedrooms}
                      </span>
                      <span className="flex items-center gap-1 bg-[#f1f5f9] px-1.5 py-0.5 rounded text-[10px]">
                        <Bath size={11} /> {p.bathrooms}
                      </span>
                      <span className="text-[10px] bg-[#f1f5f9] px-1.5 py-0.5 rounded">{propertyTypeLabel(p.property_type)}</span>
                    </div>

                    <div className="mb-2.5">
                      <div className="flex justify-between text-[11px] text-[#94a3b8] mb-1">
                        <span>Occupation</span>
                        <span className={`font-semibold ${getOccupancyColor(p.occupancy_rate)}`}>{p.occupancy_rate || 0}%</span>
                      </div>
                      <div className="w-full h-[5px] bg-[#f1f5f9] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${getOccupancyBarColor(p.occupancy_rate)}`}
                          style={{ width: `${p.occupancy_rate || 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-[#f1f5f9] flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-[#94a3b8]">Loyer</p>
                        <p className="font-bold text-[#1e293b] text-[14px]">{Number(p.monthly_rent).toLocaleString()} MAD</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-[10px] text-[#94a3b8]">Propriétaire</p>
                          <p className="text-[11px] font-semibold text-[#334155] truncate max-w-[80px]">{p.owner_name}</p>
                        </div>
                        <button
                          onClick={() => router.push(`/dashboard/properties/${p.id}`)}
                          className="flex items-center gap-1 bg-[#f0fdf4] text-[#10b981] px-2.5 py-1 rounded-lg text-[11px] font-semibold hover:bg-[#dcfce7] transition-all"
                        >
                          Voir <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <PaginationControls />
          </>
        ) : currentView === "properties" ? (
          <>
            {/* Table View */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e2e8f0]">
                      <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Bien</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider hidden md:table-cell">Emplacement</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider hidden sm:table-cell">Type</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider hidden lg:table-cell">Ch./SdB</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Occupation</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Loyer</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider hidden xl:table-cell">Propriétaire</th>
                      <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {paginatedProperties.map((p) => (
                      <tr key={p.id} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg ${placeholderColor(p.property_type)} flex items-center justify-center flex-shrink-0`}>
                              {p.images && p.images.length > 0 ? (
                                <img src={p.images[0].image_url || `http://127.0.0.1:8000${p.images[0].image}`} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                              ) : (
                                <Building2 size={14} className="text-[#94a3b8]" />
                              )}
                            </div>
                            <span className="font-semibold text-[#1e293b] text-[13px] truncate max-w-[140px]">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex items-center gap-1 text-[12px] text-[#64748b]">
                            <MapPin size={12} /><span className="truncate max-w-[100px]">{p.location}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-[11px] bg-[#f1f5f9] px-2 py-0.5 rounded text-[#64748b] font-medium">{propertyTypeLabel(p.property_type)}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 text-[12px] text-[#64748b]">
                            <Bed size={12} /> {p.bedrooms}
                            <Bath size={12} /> {p.bathrooms}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-[5px] bg-[#f1f5f9] rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${getOccupancyBarColor(p.occupancy_rate)}`} style={{ width: `${p.occupancy_rate || 0}%` }} />
                            </div>
                            <span className={`text-[12px] font-semibold ${getOccupancyColor(p.occupancy_rate)}`}>{p.occupancy_rate || 0}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[13px] font-bold text-[#1e293b]">{Number(p.monthly_rent).toLocaleString()} MAD</span>
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <span className="text-[12px] text-[#64748b]">{p.owner_name}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEdit(p)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f1f5f9] text-[#64748b] transition-colors">
                              <Edit size={13} />
                            </button>
                            <button onClick={() => { setSelectedProperty(p); setShowDeleteModal(true); }} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#fef2f2] text-[#64748b] hover:text-[#ef4444] transition-colors">
                              <Trash2 size={13} />
                            </button>
                            <button onClick={() => router.push(`/dashboard/properties/${p.id}`)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f0fdf4] text-[#64748b] hover:text-[#10b981] transition-colors">
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <PaginationControls />
          </>
        ) : null}

        {/* Performance Section - Only show in performances view */}
        {currentView === "performances" && (topPerformers.length > 0 || worstPerformers.length > 0) && (
          <div>
            {/* Performance Header with Tabs */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-1 mb-4">
              <div className="flex gap-1">
                <button
                  onClick={() => setPerformanceTab("top")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${performanceTab === "top"
                      ? "bg-[#f0fdf4] text-[#10b981] shadow-sm"
                      : "text-[#64748b] hover:bg-[#f8fafc]"
                    }`}
                >
                  <Crown size={16} />
                  Top Performers
                  <span className="bg-[#10b981] text-white text-[10px] px-1.5 py-0.5 rounded-full">{topPerformers.length}</span>
                </button>
                <button
                  onClick={() => setPerformanceTab("worst")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${performanceTab === "worst"
                      ? "bg-[#fef2f2] text-[#ef4444] shadow-sm"
                      : "text-[#64748b] hover:bg-[#f8fafc]"
                    }`}
                >
                  <AlertCircle size={16} />
                  À Surveiller
                  <span className="bg-[#ef4444] text-white text-[10px] px-1.5 py-0.5 rounded-full">{worstPerformers.length}</span>
                </button>
                <button
                  onClick={() => setPerformanceTab("comparison")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${performanceTab === "comparison"
                      ? "bg-[#f0f9ff] text-[#0284c7] shadow-sm"
                      : "text-[#64748b] hover:bg-[#f8fafc]"
                    }`}
                >
                  <BarChart3 size={16} />
                  Comparaison
                </button>
              </div>
            </div>

            {/* Top Performers View */}
            {performanceTab === "top" && topPerformers.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {topPerformers.map((property, index) => {
                  const medals = [
                    { icon: Crown, color: "text-[#fbbf24]", bg: "bg-[#fef3c7]", border: "border-[#fbbf24]" },
                    { icon: Medal, color: "text-[#94a3b8]", bg: "bg-[#f1f5f9]", border: "border-[#94a3b8]" },
                    { icon: Medal, color: "text-[#b45309]", bg: "bg-[#ffedd5]", border: "border-[#b45309]" }
                  ];
                  const medal = medals[index] || medals[2];

                  return (
                    <div
                      key={property.id}
                      onClick={() => router.push(`/dashboard/properties/${property.id}`)}
                      className="bg-white rounded-xl border-2 border-[#e2e8f0] overflow-hidden hover:shadow-lg hover:border-[#10b981] transition-all cursor-pointer group"
                    >
                      <div className="relative h-[160px] overflow-hidden">
                        {property.image_url ? (
                          <img
                            src={property.image_url}
                            alt={property.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className={`w-full h-full ${placeholderColor(property.property_type)} flex items-center justify-center`}>
                            <Building2 size={48} className="text-[#94a3b8] opacity-40" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <div className={`${medal.bg} ${medal.color} p-2 rounded-xl border-2 ${medal.border} shadow-lg`}>
                            <medal.icon size={20} />
                          </div>
                        </div>
                        <div className="absolute top-3 right-3 bg-[#10b981] text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-lg">
                          #{index + 1}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                          <h3 className="text-white font-bold text-[15px]">{property.name}</h3>
                          <p className="text-white/80 text-[11px] flex items-center gap-1">
                            <MapPin size={10} /> {property.location.split(',')[0]}
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#f0fdf4] flex items-center justify-center">
                              <TrendingUp size={16} className="text-[#10b981]" />
                            </div>
                            <div>
                              <p className="text-[10px] text-[#64748b] font-medium">Taux d'occupation</p>
                              <p className={`text-[18px] font-bold ${getOccupancyColor(property.occupancy_rate)}`}>
                                {property.occupancy_rate}%
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-[#64748b] font-medium">Revenu</p>
                            <p className="text-[16px] font-bold text-[#1e293b]">
                              {(property.total_revenue / 1000).toFixed(1)}k MAD
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-[11px] text-[#64748b] pt-2 border-t border-[#f1f5f9]">
                          <span className="flex items-center gap-1">
                            <Bed size={12} /> {property.bedrooms} ch.
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {property.total_stays} séjours
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${getOccupancyBarColor(property.occupancy_rate)}`} />
                            <span className="text-[11px] text-[#10b981] font-medium">Excellente performance</span>
                          </div>
                          <ArrowUpRight size={14} className="text-[#10b981]" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Worst Performers View */}
            {performanceTab === "worst" && worstPerformers.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {worstPerformers.map((property, index) => (
                  <div
                    key={property.id}
                    onClick={() => router.push(`/dashboard/properties/${property.id}`)}
                    className="bg-white rounded-xl border-2 border-[#e2e8f0] overflow-hidden hover:shadow-lg hover:border-[#ef4444] transition-all cursor-pointer group"
                  >
                    <div className="relative h-[160px] overflow-hidden">
                      {property.image_url ? (
                        <img
                          src={property.image_url}
                          alt={property.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 grayscale group-hover:grayscale-0"
                        />
                      ) : (
                        <div className={`w-full h-full ${placeholderColor(property.property_type)} flex items-center justify-center`}>
                          <Building2 size={48} className="text-[#94a3b8] opacity-40" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <div className="bg-[#fef2f2] text-[#ef4444] p-2 rounded-xl border-2 border-[#ef4444] shadow-lg">
                          <AlertCircle size={20} />
                        </div>
                      </div>
                      <div className="absolute top-3 right-3 bg-[#ef4444] text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-lg">
                        #{index + 1}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <h3 className="text-white font-bold text-[15px]">{property.name}</h3>
                        <p className="text-white/80 text-[11px] flex items-center gap-1">
                          <MapPin size={10} /> {property.location.split(',')[0]}
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#fef2f2] flex items-center justify-center">
                            <TrendingDown size={16} className="text-[#ef4444]" />
                          </div>
                          <div>
                            <p className="text-[10px] text-[#64748b] font-medium">Taux d'occupation</p>
                            <p className={`text-[18px] font-bold ${getOccupancyColor(property.occupancy_rate)}`}>
                              {property.occupancy_rate}%
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-[#64748b] font-medium">Revenu</p>
                          <p className="text-[16px] font-bold text-[#1e293b]">
                            {(property.total_revenue / 1000).toFixed(1)}k MAD
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-[#64748b] pt-2 border-t border-[#f1f5f9]">
                        <span className="flex items-center gap-1">
                          <Bed size={12} /> {property.bedrooms} ch.
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {property.total_stays} séjours
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
                          <span className="text-[11px] text-[#ef4444] font-medium">Nécessite attention</span>
                        </div>
                        <ArrowDownRight size={14} className="text-[#ef4444]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Comparison View */}
            {performanceTab === "comparison" && topPerformers.length > 0 && worstPerformers.length > 0 && (
              <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
                <div className="p-4 border-b border-[#e2e8f0]">
                  <h3 className="font-bold text-[#1e293b] text-[14px] mb-1">Analyse comparative</h3>
                  <p className="text-[12px] text-[#64748b]">Comparaison entre les meilleures et moins bonnes performances</p>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Best */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[#f0fdf4] flex items-center justify-center">
                          <Crown size={16} className="text-[#10b981]" />
                        </div>
                        <div>
                          <p className="font-bold text-[#1e293b] text-[13px]">Meilleur</p>
                          <p className="text-[11px] text-[#64748b]">{topPerformers[0].name}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-[#64748b]">Occupation</span>
                            <span className="font-bold text-[#10b981]">{topPerformers[0].occupancy_rate}%</span>
                          </div>
                          <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                            <div className="h-full bg-[#10b981] rounded-full" style={{ width: `${topPerformers[0].occupancy_rate}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-[#64748b]">Revenu</span>
                            <span className="font-bold text-[#1e293b]">{(topPerformers[0].total_revenue / 1000).toFixed(1)}k</span>
                          </div>
                          <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                            <div className="h-full bg-[#6366f1] rounded-full" style={{ width: `${Math.min(100, (topPerformers[0].total_revenue / 10000) * 100)}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-[#64748b]">Séjours</span>
                            <span className="font-bold text-[#1e293b]">{topPerformers[0].total_stays}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Worst */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[#fef2f2] flex items-center justify-center">
                          <AlertCircle size={16} className="text-[#ef4444]" />
                        </div>
                        <div>
                          <p className="font-bold text-[#1e293b] text-[13px]">À améliorer</p>
                          <p className="text-[11px] text-[#64748b]">{worstPerformers[0].name}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-[#64748b]">Occupation</span>
                            <span className="font-bold text-[#ef4444]">{worstPerformers[0].occupancy_rate}%</span>
                          </div>
                          <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                            <div className="h-full bg-[#ef4444] rounded-full" style={{ width: `${worstPerformers[0].occupancy_rate}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-[#64748b]">Revenu</span>
                            <span className="font-bold text-[#1e293b]">{(worstPerformers[0].total_revenue / 1000).toFixed(1)}k</span>
                          </div>
                          <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                            <div className="h-full bg-[#94a3b8] rounded-full" style={{ width: `${Math.min(100, (worstPerformers[0].total_revenue / 10000) * 100)}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-[#64748b]">Séjours</span>
                            <span className="font-bold text-[#1e293b]">{worstPerformers[0].total_stays}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gap Analysis */}
                  <div className="mt-4 p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                    <div className="flex items-center gap-2 mb-2">
                      <Target size={14} className="text-[#6366f1]" />
                      <p className="font-semibold text-[#1e293b] text-[12px]">Écart de performance</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-[10px] text-[#64748b] mb-1">Occupation</p>
                        <p className="text-[14px] font-bold text-[#ef4444]">
                          {topPerformers[0].occupancy_rate - worstPerformers[0].occupancy_rate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#64748b] mb-1">Revenu</p>
                        <p className="text-[14px] font-bold text-[#ef4444]">
                          {((topPerformers[0].total_revenue - worstPerformers[0].total_revenue) / 1000).toFixed(1)}k MAD
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#64748b] mb-1">Séjours</p>
                        <p className="text-[14px] font-bold text-[#ef4444]">
                          {topPerformers[0].total_stays - worstPerformers[0].total_stays}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h2 className="text-[16px] font-bold text-[#1e293b]">{selectedProperty ? "Modifier le bien" : "Ajouter un bien"}</h2>
                  <p className="text-[12px] text-[#94a3b8] mt-0.5">{selectedProperty ? "Mettre à jour" : "Nouveau bien"}</p>
                </div>
                <button onClick={() => { setShowModal(false); setForm(emptyForm); setSelectedProperty(null); setFormError(""); setSelectedImages(null); setImagePreviewUrls([]); }} className="text-[#94a3b8] hover:text-[#334155] transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9]">
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div className="bg-[#fef2f2] text-[#ef4444] text-[12px] p-3 rounded-lg mb-4 border border-[#fecaca] flex items-center gap-2">
                  <AlertCircle size={14} />
                  {formError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">Images</label>
                  <div className="border-2 border-dashed border-[#e2e8f0] rounded-lg p-4 hover:border-[#10b981] transition-colors cursor-pointer">
                    <input type="file" multiple accept="image/*" className="hidden" id="image-upload-input" onChange={(e) => handleImageSelect(e.target.files)} />
                    <label htmlFor="image-upload-input" className="cursor-pointer flex flex-col items-center gap-1.5">
                      <Upload size={22} className="text-[#94a3b8]" />
                      <p className="text-[12px] text-[#64748b] font-medium">Cliquez pour télécharger</p>
                    </label>
                  </div>
                  {imagePreviewUrls.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[12px] font-semibold text-[#334155] mb-1.5">{imagePreviewUrls.length} image(s)</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {imagePreviewUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img src={url} alt={`Preview ${index + 1}`} className="w-14 h-14 object-cover rounded-lg border border-[#e2e8f0]" />
                            <button type="button" onClick={() => removePreviewImage(index)} className="absolute -top-1.5 -right-1.5 bg-[#ef4444] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#f1f5f9] pt-3">
                  <p className="text-[12px] font-semibold text-[#334155]">Informations</p>
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Nom *</label>
                  <input className={inputClass} placeholder="Riad Palais Médina" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Emplacement *</label>
                  <input className={inputClass} placeholder="Marrakech, Maroc" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Type *</label>
                  <select className={inputClass} value={form.property_type} onChange={e => setForm({ ...form, property_type: e.target.value, property_type_other: "" })}>
                    <option value="">Sélectionner</option>
                    <option value="apartment">Appartement</option>
                    <option value="villa">Villa</option>
                    <option value="studio">Studio</option>
                    <option value="house">Maison</option>
                    <option value="commercial">Commercial</option>
                    <option value="riad">Riad</option>
                    <option value="other">Autre</option>
                  </select>
                  {form.property_type === "other" && (
                    <input className={`${inputClass} mt-1.5`} placeholder="Précisez..." value={form.property_type_other} onChange={e => setForm({ ...form, property_type_other: e.target.value })} />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Chambres</label>
                    <input type="number" className={inputClass} placeholder="3" value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-[#334155] mb-1 block">SdB</label>
                    <input type="number" className={inputClass} placeholder="2" value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Salons</label>
                    <input type="number" className={inputClass} placeholder="1" value={form.living_rooms} onChange={e => setForm({ ...form, living_rooms: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Salle à manger</label>
                    <input type="number" className={inputClass} placeholder="1" value={form.dining_room} onChange={e => setForm({ ...form, dining_room: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Cuisine</label>
                  <select className={inputClass} value={form.kitchen_status} onChange={e => setForm({ ...form, kitchen_status: e.target.value })}>
                    <option value="">Sélectionner</option>
                    <option value="1">Équipée</option>
                    <option value="2">Semi-équipée</option>
                    <option value="3">Sans cuisine</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Balcon</label>
                    <select className={inputClass} value={form.has_balcony} onChange={e => setForm({ ...form, has_balcony: e.target.value })}>
                      <option value="no">Non</option>
                      <option value="yes">Oui</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Jardin</label>
                    <select className={inputClass} value={form.has_garden} onChange={e => setForm({ ...form, has_garden: e.target.value })}>
                      <option value="no">Non</option>
                      <option value="yes">Oui</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Parking</label>
                  <select className={inputClass} value={form.parking_status} onChange={e => setForm({ ...form, parking_status: e.target.value })}>
                    <option value="no">Non</option>
                    <option value="private">Privé</option>
                    <option value="street">Rue</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Surface (m²)</label>
                    <input type="number" className={inputClass} placeholder="75" value={form.area_sqm} onChange={e => setForm({ ...form, area_sqm: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Loyer (MAD)</label>
                    <input type="number" className={inputClass} placeholder="5000" value={form.monthly_rent} onChange={e => setForm({ ...form, monthly_rent: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Propriétaire *</label>
                  <select className={inputClass} value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })}>
                    <option value="">Sélectionner</option>
                    {owners.map(o => <option key={o.id} value={o.id}>{o.full_name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Description</label>
                  <textarea className={inputClass} rows={2} placeholder="Description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>

              <div className="flex gap-2.5 mt-5 pt-4 border-t border-[#f1f5f9]">
                <button onClick={() => { setShowModal(false); setForm(emptyForm); setSelectedProperty(null); setFormError(""); setSelectedImages(null); setImagePreviewUrls([]); }} className="flex-1 py-2.5 rounded-lg border border-[#e2e8f0] text-[#64748b] font-semibold hover:bg-[#f8fafc] transition-all text-[13px]">
                  Annuler
                </button>
                <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-[#10b981] text-white font-semibold hover:bg-[#059669] transition-all flex items-center justify-center gap-1.5 shadow-[0_1px_2px_rgba(16,185,129,0.25)] text-[13px]">
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : (selectedProperty ? "Mettre à jour" : "Ajouter")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedProperty && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] w-full max-w-sm">
            <div className="p-5">
              <div className="w-10 h-10 bg-[#fef2f2] rounded-xl flex items-center justify-center mx-auto mb-3">
                <Trash2 size={18} className="text-[#ef4444]" />
              </div>
              <h2 className="text-[16px] font-bold text-[#1e293b] text-center mb-1">Supprimer</h2>
              <p className="text-[#64748b] text-[13px] text-center mb-5">Supprimer <span className="font-semibold text-[#1e293b]">"{selectedProperty.name}"</span> ? Action irréversible.</p>
              <div className="flex gap-2.5">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 rounded-lg border border-[#e2e8f0] text-[#64748b] font-semibold hover:bg-[#f8fafc] transition-all text-[13px]">
                  Annuler
                </button>
                <button onClick={handleDelete} disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-[#ef4444] text-white font-semibold hover:bg-[#dc2626] transition-all flex items-center justify-center gap-1.5 text-[13px]">
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}